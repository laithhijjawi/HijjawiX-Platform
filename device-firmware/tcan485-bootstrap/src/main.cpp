#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "driver/twai.h"
#include <FastLED.h>

namespace Pins {
  constexpr gpio_num_t CAN_TX = GPIO_NUM_27;
  constexpr gpio_num_t CAN_RX = GPIO_NUM_26;
  constexpr int CAN_SPEED_MODE = 23;
  constexpr int BOOST_ENABLE = 16;
}

namespace App {
  constexpr const char* NAME = "HIJJAWI X DEVICE";
  constexpr const char* VERSION = "0.2.0-bootstrap";
  constexpr uint32_t SERIAL_BAUD = 115200;
  constexpr uint32_t HEARTBEAT_MS = 10000;
  constexpr uint32_t WIFI_RETRY_MS = 15000;
  constexpr const char* AP_PASSWORD = "hxdsetup123"; // Lab bootstrap only; change later per-device.
  constexpr int RGB_PIN = 4;
}

Preferences prefs;
WebServer server(80);

String deviceId;
String apSsid;
String wifiSsid;
String wifiPass;
String serverUrl;
String claimCode;
String lastServerState = "not-configured";

uint32_t rxFrames = 0;
uint32_t lastRxFrames = 0;
uint32_t fps = 0;
uint32_t lastFpsMs = 0;
uint32_t lastWifiAttempt = 0;
uint32_t lastHeartbeat = 0;
bool canReady = false;
CRGB rgb[1];

static String htmlEscape(const String& in) {
  String out;
  out.reserve(in.length() + 16);
  for (size_t i = 0; i < in.length(); ++i) {
    const char c = in[i];
    if (c == '&') out += "&amp;";
    else if (c == '<') out += "&lt;";
    else if (c == '>') out += "&gt;";
    else if (c == '"') out += "&quot;";
    else out += c;
  }
  return out;
}

static String jsonEscape(const String& in) {
  String out;
  out.reserve(in.length() + 16);
  for (size_t i = 0; i < in.length(); ++i) {
    char c = in[i];
    switch (c) {
      case '"': out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n"; break;
      case '\r': out += "\\r"; break;
      case '\t': out += "\\t"; break;
      default: out += c; break;
    }
  }
  return out;
}

static String makeDeviceId() {
  const uint64_t mac = ESP.getEfuseMac();
  char buf[32];
  snprintf(buf, sizeof(buf), "HXD-%06llX", (unsigned long long)(mac & 0xFFFFFFULL));
  return String(buf);
}

static void loadConfig() {
  prefs.begin("hxd", true);
  wifiSsid = prefs.getString("ssid", "");
  wifiPass = prefs.getString("pass", "");
  serverUrl = prefs.getString("server", "");
  claimCode = prefs.getString("claim", "");
  prefs.end();
}

static void saveConfig(const String& ssid, const String& pass, const String& url, const String& claim) {
  prefs.begin("hxd", false);
  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);
  prefs.putString("server", url);
  prefs.putString("claim", claim);
  prefs.end();
  wifiSsid = ssid;
  wifiPass = pass;
  serverUrl = url;
  claimCode = claim;
}

static void eraseConfig() {
  prefs.begin("hxd", false);
  prefs.clear();
  prefs.end();
  wifiSsid = "";
  wifiPass = "";
  serverUrl = "";
  claimCode = "";
  lastServerState = "not-configured";
}

static bool startCanListenOnly() {
  pinMode(Pins::BOOST_ENABLE, OUTPUT);
  digitalWrite(Pins::BOOST_ENABLE, HIGH);

  pinMode(Pins::CAN_SPEED_MODE, OUTPUT);
  digitalWrite(Pins::CAN_SPEED_MODE, LOW);

  twai_general_config_t g = TWAI_GENERAL_CONFIG_DEFAULT(Pins::CAN_TX, Pins::CAN_RX, TWAI_MODE_LISTEN_ONLY);
  g.rx_queue_len = 128;
  g.tx_queue_len = 0;
  twai_timing_config_t t = TWAI_TIMING_CONFIG_500KBITS();
  twai_filter_config_t f = TWAI_FILTER_CONFIG_ACCEPT_ALL();

  esp_err_t err = twai_driver_install(&g, &t, &f);
  if (err != ESP_OK) {
    Serial.printf("TWAI install failed: %d\n", (int)err);
    return false;
  }
  err = twai_start();
  if (err != ESP_OK) {
    Serial.printf("TWAI start failed: %d\n", (int)err);
    twai_driver_uninstall();
    return false;
  }
  uint32_t alerts = TWAI_ALERT_RX_DATA | TWAI_ALERT_RX_QUEUE_FULL | TWAI_ALERT_BUS_ERROR | TWAI_ALERT_ERR_PASS;
  twai_reconfigure_alerts(alerts, nullptr);
  Serial.println("CAN: 500 kbps / LISTEN ONLY / TX disabled");
  return true;
}

static void serviceCan() {
  if (!canReady) return;
  twai_message_t msg;
  while (twai_receive(&msg, 0) == ESP_OK) {
    rxFrames++;
  }

  const uint32_t now = millis();
  if (now - lastFpsMs >= 1000) {
    fps = rxFrames - lastRxFrames;
    lastRxFrames = rxFrames;
    lastFpsMs = now;
  }
}

static String statusJson() {
  String json = "{";
  json += "\"deviceId\":\"" + jsonEscape(deviceId) + "\",";
  json += "\"firmware\":\"" + String(App::VERSION) + "\",";
  json += "\"apSsid\":\"" + jsonEscape(apSsid) + "\",";
  json += "\"wifiConfigured\":" + String(wifiSsid.length() ? "true" : "false") + ",";
  json += "\"wifiConnected\":" + String(WiFi.status() == WL_CONNECTED ? "true" : "false") + ",";
  json += "\"wifiSsid\":\"" + jsonEscape(WiFi.status() == WL_CONNECTED ? WiFi.SSID() : wifiSsid) + "\",";
  json += "\"stationIp\":\"" + jsonEscape(WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : String("")) + "\",";
  json += "\"apIp\":\"" + WiFi.softAPIP().toString() + "\",";
  json += "\"serverConfigured\":" + String(serverUrl.length() ? "true" : "false") + ",";
  json += "\"serverState\":\"" + jsonEscape(lastServerState) + "\",";
  json += "\"canReady\":" + String(canReady ? "true" : "false") + ",";
  json += "\"framesPerSecond\":" + String(fps) + ",";
  json += "\"totalFrames\":" + String(rxFrames) + ",";
  json += "\"freeHeap\":" + String(ESP.getFreeHeap());
  json += "}";
  return json;
}

static String setupPage() {
  String h = R"HTML(<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HIJJAWI X Device Setup</title><style>
  :root{color-scheme:dark;--bg:#07101f;--p:#0d1a2c;--l:#223650;--t:#eef5ff;--m:#93a7bf;--a:#58a8ff}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:radial-gradient(circle at 20% 0,#17355f55,transparent 30%),var(--bg);color:var(--t)}main{max-width:760px;margin:auto;padding:26px 16px 60px}.brand{font-weight:800;letter-spacing:.08em}.brand b{color:var(--a)}.sub{color:var(--m);font-size:12px;letter-spacing:.12em}.card{margin-top:20px;background:var(--p);border:1px solid var(--l);border-radius:20px;padding:20px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.metric{border:1px solid var(--l);border-radius:14px;padding:14px}.metric small{display:block;color:var(--m);margin-bottom:7px}.metric b{font-size:19px}label{display:grid;gap:7px;margin:14px 0;color:var(--m);font-size:13px}input{width:100%;padding:13px;border-radius:12px;border:1px solid var(--l);background:#081321;color:var(--t)}button{padding:12px 16px;border:0;border-radius:12px;font-weight:700;cursor:pointer}.primary{background:#3b8df4;color:white}.danger{background:#38171b;color:#ff8f98;border:1px solid #6b2930}.hint{color:var(--m);font-size:12px;line-height:1.7}.row{display:flex;gap:10px;flex-wrap:wrap}@media(max-width:620px){.grid{grid-template-columns:1fr}}</style></head><body><main><div class="brand">HIJJAWI <b>X</b> DEVICE</div><div class="sub">FACTORY BOOTSTRAP · v0.1</div><section class="card"><div class="grid">
  )HTML";
  h += "<div class='metric'><small>Device ID</small><b>" + htmlEscape(deviceId) + "</b></div>";
  h += "<div class='metric'><small>CAN</small><b>500 kbps · Listen Only</b></div>";
  h += "<div class='metric'><small>Frames/s</small><b id='fps'>" + String(fps) + "</b></div>";
  h += "<div class='metric'><small>Server</small><b id='srv'>" + htmlEscape(lastServerState) + "</b></div>";
  h += R"HTML(</div></section><section class="card"><h2>إعداد Wi‑Fi والسيرفر</h2><form method="post" action="/save">
  <label>اسم شبكة Wi‑Fi<input name="ssid" required value=")HTML";
  h += htmlEscape(wifiSsid);
  h += R"HTML("></label><label>كلمة مرور Wi‑Fi<input name="pass" type="password" value=")HTML";
  h += htmlEscape(wifiPass);
  h += R"HTML("></label><label>Server Base URL<input name="server" placeholder="https://ev-api.hijjawix.com" value=")HTML";
  h += htmlEscape(serverUrl);
  h += R"HTML("></label><label>Claim Code<input name="claim" autocomplete="off" value=")HTML";
  h += htmlEscape(claimCode);
  h += R"HTML("></label><div class="row"><button class="primary" type="submit">حفظ ومحاولة الاتصال</button></div></form>
  <p class="hint">هذه نسخة مختبر أولية. لا توصل CAN بالسيارة قبل أن نتأكد من Wi‑Fi والبرمجة. التحقق المشفر والترخيص النهائي سيُفعّلان في نسخة الربط بالسيرفر.</p></section>
  <section class="card"><h2>الصيانة</h2><div class="row"><form method="post" action="/erase" onsubmit="return confirm('Erase settings?')"><button class="danger">مسح الإعدادات</button></form><button onclick="location.reload()">تحديث الصفحة</button></div></section>
<script>setInterval(async()=>{try{const s=await (await fetch('/status')).json();fps.textContent=s.framesPerSecond;srv.textContent=s.serverState}catch(e){}},1000)</script></main></body></html>)HTML";
  return h;
}

static void beginPortal() {
  server.on("/", HTTP_GET, [](){ server.send(200, "text/html; charset=utf-8", setupPage()); });
  server.on("/status", HTTP_GET, [](){ server.send(200, "application/json", statusJson()); });
  server.on("/save", HTTP_POST, [](){
    const String ssid = server.arg("ssid");
    const String pass = server.arg("pass");
    const String url = server.arg("server");
    const String claim = server.arg("claim");
    saveConfig(ssid, pass, url, claim);
    server.send(200, "text/html; charset=utf-8", "<html><meta charset='utf-8'><body style='font-family:Arial;background:#07101f;color:#fff;padding:30px'><h2>تم الحفظ</h2><p>سيحاول الجهاز الاتصال بالشبكة الآن.</p><a style='color:#58a8ff' href='/'>العودة</a></body></html>");
    WiFi.disconnect(false, false);
    lastWifiAttempt = 0;
  });
  server.on("/erase", HTTP_POST, [](){
    eraseConfig();
    server.send(200, "text/html; charset=utf-8", "<html><meta charset='utf-8'><body style='font-family:Arial;background:#07101f;color:#fff;padding:30px'><h2>تم مسح الإعدادات</h2><p>أعد تشغيل الجهاز أو أدخل إعدادات جديدة.</p><a style='color:#58a8ff' href='/'>العودة</a></body></html>");
    WiFi.disconnect(true, false);
  });
  server.onNotFound([](){ server.sendHeader("Location", "/", true); server.send(302, "text/plain", ""); });
  server.begin();
}

static void setRgb(uint8_t r, uint8_t g, uint8_t b) {
  rgb[0] = CRGB(r, g, b);
  FastLED.show();
}

static void startWifi() {
  WiFi.mode(WIFI_AP_STA);
  WiFi.setSleep(false);
  apSsid = "HXD-SETUP-" + deviceId.substring(deviceId.length() - 6);
  WiFi.softAP(apSsid.c_str(), App::AP_PASSWORD);
  setRgb(0, 30, 120); // Blue = setup AP is alive
  Serial.printf("Setup AP: %s\n", apSsid.c_str());
  Serial.printf("Setup URL: http://%s\n", WiFi.softAPIP().toString().c_str());
}

static void serviceWifi() {
  const uint32_t now = millis();
  if (!wifiSsid.length()) return;
  if (WiFi.status() == WL_CONNECTED) {
    setRgb(0, 110, 20); // Green = connected to configured Wi-Fi
    return;
  }
  if (now - lastWifiAttempt < App::WIFI_RETRY_MS && lastWifiAttempt != 0) return;
  lastWifiAttempt = now;
  Serial.printf("Connecting STA to %s ...\n", wifiSsid.c_str());
  WiFi.begin(wifiSsid.c_str(), wifiPass.c_str());
}

static void heartbeat() {
  if (!serverUrl.length()) {
    lastServerState = "not-configured";
    return;
  }
  if (WiFi.status() != WL_CONNECTED) {
    lastServerState = "wifi-offline";
    return;
  }
  const uint32_t now = millis();
  if (now - lastHeartbeat < App::HEARTBEAT_MS) return;
  lastHeartbeat = now;

  String url = serverUrl;
  while (url.endsWith("/")) url.remove(url.length() - 1);
  url += "/v1/device/bootstrap-heartbeat";

  String body = "{";
  body += "\"deviceId\":\"" + jsonEscape(deviceId) + "\",";
  body += "\"firmware\":\"" + String(App::VERSION) + "\",";
  body += "\"claimCode\":\"" + jsonEscape(claimCode) + "\",";
  body += "\"framesPerSecond\":" + String(fps) + ",";
  body += "\"freeHeap\":" + String(ESP.getFreeHeap());
  body += "}";

  HTTPClient http;
  int code = -1;
  if (url.startsWith("https://")) {
    WiFiClientSecure client;
    // Bootstrap alpha only. Production firmware MUST validate the server certificate
    // with an embedded CA bundle before enrollment/authentication is enabled.
    client.setInsecure();
    if (http.begin(client, url)) {
      http.addHeader("Content-Type", "application/json");
      code = http.POST(body);
      http.end();
    }
  } else {
    WiFiClient client;
    if (http.begin(client, url)) {
      http.addHeader("Content-Type", "application/json");
      code = http.POST(body);
      http.end();
    }
  }
  lastServerState = code > 0 ? ("http-" + String(code)) : ("error-" + String(code));
  Serial.printf("Heartbeat: %s -> %s\n", url.c_str(), lastServerState.c_str());
}

void setup() {
  Serial.begin(App::SERIAL_BAUD);
  FastLED.addLeds<WS2812B, App::RGB_PIN, GRB>(rgb, 1);
  FastLED.setBrightness(45);
  setRgb(120, 40, 0); // Amber = booting
  delay(400);
  deviceId = makeDeviceId();
  loadConfig();

  Serial.println();
  Serial.printf("%s %s\n", App::NAME, App::VERSION);
  Serial.printf("Device ID: %s\n", deviceId.c_str());
  Serial.println("Factory bootstrap: SD not required");
  Serial.println("Safety: CAN transmit is disabled by LISTEN ONLY mode");

  startWifi();
  beginPortal();
  canReady = startCanListenOnly();
}

void loop() {
  server.handleClient();
  serviceWifi();
  serviceCan();
  heartbeat();
  delay(2);
}
