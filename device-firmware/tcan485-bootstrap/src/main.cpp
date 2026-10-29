#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <FastLED.h>
#include "driver/twai.h"

namespace Pins {
  constexpr gpio_num_t CAN_TX = GPIO_NUM_27;
  constexpr gpio_num_t CAN_RX = GPIO_NUM_26;
  constexpr int CAN_SPEED_MODE = 23;
  constexpr int BOOST_ENABLE = 16;
  constexpr int RGB_PIN = 4;
}
namespace App {
  constexpr const char* NAME = "HIJJAWI X DEVICE";
  constexpr const char* VERSION = "0.5.0-cloud-pilot";
  constexpr uint32_t SERIAL_BAUD = 115200;
  constexpr uint32_t WIFI_SCAN_MS = 30000;
  constexpr uint32_t HEARTBEAT_MS = 10000;
  constexpr uint32_t TELEMETRY_MS = 1000;
  constexpr const char* AP_PASSWORD = "hxdsetup123";
  constexpr const char* SERVER_BASE = "https://ev-api.hijjawix.com/api/ev";
  constexpr int MAX_NETWORKS = 5;
  constexpr int MAX_SCAN_RESULTS = 20;
  constexpr uint32_t SCAN_REFRESH_MS = 12000;
}

struct KnownNetwork { String ssid; String pass; };
KnownNetwork nets[App::MAX_NETWORKS];
struct VisibleNetwork { String ssid; int32_t rssi; uint8_t auth; };
VisibleNetwork visible[App::MAX_SCAN_RESULTS];
int visibleCount=0;
bool scanRunning=false;
uint32_t lastScanDone=0;

Preferences prefs;
WebServer server(80);
CRGB rgb[1];

String deviceId, apSsid, claimCode, deviceToken;
String serverState="not-enrolled", serverDeviceStatus="unknown";
uint32_t lastWifiScan=0,lastHeartbeat=0,lastTelemetry=0;
uint32_t rxFrames=0,lastRxFrames=0,fps=0,lastFpsMs=0;
bool canReady=false;
float packVoltage=NAN,packCurrent=NAN,soc=NAN;

static void setRgb(uint8_t r,uint8_t g,uint8_t b){rgb[0]=CRGB(r,g,b);FastLED.show();}
static String htmlEscape(const String& in){String o;for(char c:in){if(c=='&')o+="&amp;";else if(c=='<')o+="&lt;";else if(c=='>')o+="&gt;";else if(c=='"')o+="&quot;";else o+=c;}return o;}
static String jsonEscape(const String& in){String o;for(char c:in){if(c=='"')o+="\\\"";else if(c=='\\')o+="\\\\";else if(c=='\n')o+="\\n";else if(c=='\r')o+="\\r";else o+=c;}return o;}
static String makeDeviceId(){uint64_t mac=ESP.getEfuseMac();char b[32];snprintf(b,sizeof(b),"HXD-%06llX",(unsigned long long)(mac&0xFFFFFFULL));return String(b);}
static uint32_t bitsLE(const uint8_t* d,int start,int len){uint32_t v=0;for(int i=0;i<len;i++){int bit=start+i;if(d[bit/8]&(1<<(bit%8)))v|=(1UL<<i);}return v;}
static int32_t signExtend(uint32_t v,int bits){uint32_t m=1UL<<(bits-1);return (int32_t)((v^m)-m);}

static void loadConfig(){
  prefs.begin("hxd",true);
  claimCode=prefs.getString("claim","");
  deviceToken=prefs.getString("token","");
  for(int i=0;i<App::MAX_NETWORKS;i++){String k="ssid"+String(i),p="pass"+String(i);nets[i].ssid=prefs.getString(k.c_str(),"");nets[i].pass=prefs.getString(p.c_str(),"");}
  prefs.end();
}
static void saveClaim(const String& c){prefs.begin("hxd",false);prefs.putString("claim",c);prefs.end();claimCode=c;}
static void saveToken(const String& t){prefs.begin("hxd",false);prefs.putString("token",t);prefs.end();deviceToken=t;}
static void clearToken(){prefs.begin("hxd",false);prefs.remove("token");prefs.end();deviceToken="";serverDeviceStatus="unknown";serverState="not-enrolled";}
static void saveNetwork(const String& ssid,const String& pass){
  int slot=-1;for(int i=0;i<App::MAX_NETWORKS;i++)if(nets[i].ssid==ssid){slot=i;break;}
  if(slot<0)for(int i=0;i<App::MAX_NETWORKS;i++)if(!nets[i].ssid.length()){slot=i;break;}
  if(slot<0)slot=App::MAX_NETWORKS-1;
  nets[slot]={ssid,pass};prefs.begin("hxd",false);prefs.putString(("ssid"+String(slot)).c_str(),ssid);prefs.putString(("pass"+String(slot)).c_str(),pass);prefs.end();
}
static void eraseAll(){prefs.begin("hxd",false);prefs.clear();prefs.end();for(auto &n:nets)n={"",""};claimCode="";deviceToken="";serverState="not-enrolled";serverDeviceStatus="unknown";WiFi.disconnect(true,false);}

static bool startCan(){
  pinMode(Pins::BOOST_ENABLE,OUTPUT);digitalWrite(Pins::BOOST_ENABLE,HIGH);
  pinMode(Pins::CAN_SPEED_MODE,OUTPUT);digitalWrite(Pins::CAN_SPEED_MODE,LOW);
  twai_general_config_t g=TWAI_GENERAL_CONFIG_DEFAULT(Pins::CAN_TX,Pins::CAN_RX,TWAI_MODE_LISTEN_ONLY);g.rx_queue_len=256;g.tx_queue_len=0;
  twai_timing_config_t t=TWAI_TIMING_CONFIG_500KBITS();twai_filter_config_t f=TWAI_FILTER_CONFIG_ACCEPT_ALL();
  if(twai_driver_install(&g,&t,&f)!=ESP_OK)return false;if(twai_start()!=ESP_OK){twai_driver_uninstall();return false;}return true;
}
static void decodeFrame(const twai_message_t& m){
  if(m.rtr)return;
  if(m.identifier==0x132&&m.data_length_code>=4){
    packVoltage=bitsLE(m.data,0,16)*0.01f;
    packCurrent=signExtend(bitsLE(m.data,16,16),16)*-0.1f;
  } else if(m.identifier==0x292&&m.data_length_code>=5){
    soc=bitsLE(m.data,30,10)*0.1f;
  }
}
static void serviceCan(){
  if(!canReady)return;twai_message_t m;while(twai_receive(&m,0)==ESP_OK){rxFrames++;decodeFrame(m);}
  uint32_t now=millis();if(now-lastFpsMs>=1000){fps=rxFrames-lastRxFrames;lastRxFrames=rxFrames;lastFpsMs=now;}
}

static void sortVisible(){
  for(int i=0;i<visibleCount;i++)for(int j=i+1;j<visibleCount;j++)if(visible[j].rssi>visible[i].rssi){VisibleNetwork t=visible[i];visible[i]=visible[j];visible[j]=t;}
}
static void startNetworkScan(){
  if(scanRunning)return;
  int16_t rc=WiFi.scanNetworks(true,true,false,120,0);
  if(rc==WIFI_SCAN_RUNNING){scanRunning=true;Serial.println("Wi-Fi async scan started");}
  else if(rc>=0){scanRunning=false;}
}
static void serviceNetworkScan(){
  int16_t rc=WiFi.scanComplete();
  if(rc>=0){
    visibleCount=0;
    for(int i=0;i<rc&&visibleCount<App::MAX_SCAN_RESULTS;i++){
      String s=WiFi.SSID(i);if(!s.length())continue;
      int existing=-1;for(int k=0;k<visibleCount;k++)if(visible[k].ssid==s){existing=k;break;}
      int32_t r=WiFi.RSSI(i);uint8_t a=(uint8_t)WiFi.encryptionType(i);
      if(existing>=0){if(r>visible[existing].rssi)visible[existing]={s,r,a};}
      else visible[visibleCount++]={s,r,a};
    }
    sortVisible();
    WiFi.scanDelete();
    scanRunning=false;lastScanDone=millis();
    Serial.printf("Wi-Fi scan complete: %d visible networks\n",visibleCount);
  } else if(rc==WIFI_SCAN_FAILED){
    scanRunning=false;
  }
  uint32_t now=millis();
  if(!scanRunning&&(lastScanDone==0||now-lastScanDone>=App::SCAN_REFRESH_MS))startNetworkScan();
}
static int findBestKnownFromCache(){
  int best=-1,bestRssi=-1000;
  for(int i=0;i<visibleCount;i++)for(int k=0;k<App::MAX_NETWORKS;k++)if(nets[k].ssid.length()&&nets[k].ssid==visible[i].ssid&&visible[i].rssi>bestRssi){best=k;bestRssi=visible[i].rssi;}
  return best;
}
static void connectBestKnown(){
  int k=findBestKnownFromCache();
  if(k<0){serverState="waiting-for-known-wifi";setRgb(0,30,120);return;}
  Serial.printf("Connecting to saved Wi-Fi: %s\n",nets[k].ssid.c_str());WiFi.begin(nets[k].ssid.c_str(),nets[k].pass.c_str());
}
static void serviceWifi(){
  if(WiFi.status()==WL_CONNECTED)return;
  uint32_t now=millis();if(now-lastWifiScan<App::WIFI_SCAN_MS&&lastWifiScan!=0)return;lastWifiScan=now;connectBestKnown();
}

static bool postJson(const String& path,const String& body,String& response,int& code,bool withToken){
  if(WiFi.status()!=WL_CONNECTED){code=-1;return false;}
  WiFiClientSecure client;client.setInsecure(); // PILOT ONLY: no OTA enabled; production will use verified TLS + signed OTA.
  HTTPClient http;String url=String(App::SERVER_BASE)+path;if(!http.begin(client,url)){code=-2;return false;}
  http.addHeader("Content-Type","application/json");if(withToken){http.addHeader("Authorization","Bearer "+deviceToken);http.addHeader("X-Device-Id",deviceId);}
  code=http.POST(body);response=code>0?http.getString():"";http.end();return code>0;
}
static void bootstrapIfNeeded(){
  if(deviceToken.length()||!claimCode.length()||WiFi.status()!=WL_CONNECTED)return;
  String body="{\"deviceId\":\""+jsonEscape(deviceId)+"\",\"hardwareFamily\":\"T-CAN485\",\"hardwareRevision\":\"pilot\",\"firmware\":\""+String(App::VERSION)+"\",\"claimCode\":\""+jsonEscape(claimCode)+"\"}";
  String resp;int code;if(!postJson("/device/bootstrap",body,resp,code,false)){serverState="bootstrap-network-error";return;}
  JsonDocument j;if(deserializeJson(j,resp)){serverState="bootstrap-json-error";return;}
  if(code==200&&j["deviceToken"].is<const char*>()){saveToken(String((const char*)j["deviceToken"]));serverDeviceStatus=String((const char*)(j["status"]|"pending"));serverState="enrolled-"+serverDeviceStatus;setRgb(90,0,120);}
  else serverState="bootstrap-http-"+String(code);
}
static void heartbeat(){
  if(!deviceToken.length()||WiFi.status()!=WL_CONNECTED)return;uint32_t now=millis();if(now-lastHeartbeat<App::HEARTBEAT_MS)return;lastHeartbeat=now;
  String body="{\"firmware\":\""+String(App::VERSION)+"\",\"rssi\":"+String(WiFi.RSSI())+",\"framesPerSecond\":"+String(fps)+",\"freeHeap\":"+String(ESP.getFreeHeap())+"}";
  String resp;int code;if(!postJson("/device/heartbeat",body,resp,code,true)){serverState="heartbeat-network-error";return;}
  JsonDocument j;if(!deserializeJson(j,resp)&&code==200){serverDeviceStatus=String((const char*)(j["status"]|"unknown"));serverState="online-"+serverDeviceStatus;if(serverDeviceStatus=="active")setRgb(0,95,100);else setRgb(90,0,120);}
  else if(code==401){serverState="token-rejected";setRgb(120,0,0);}else serverState="heartbeat-http-"+String(code);
}
static void sendTelemetry(){
  if(serverDeviceStatus!="active"||WiFi.status()!=WL_CONNECTED||!deviceToken.length())return;uint32_t now=millis();if(now-lastTelemetry<App::TELEMETRY_MS)return;lastTelemetry=now;
  String body="{\"framesPerSecond\":"+String(fps);
  if(!isnan(packVoltage))body+=",\"packVoltage\":"+String(packVoltage,2);
  if(!isnan(packCurrent))body+=",\"packCurrent\":"+String(packCurrent,1);
  if(!isnan(soc))body+=",\"soc\":"+String(soc,1);
  if(!isnan(packVoltage)&&!isnan(packCurrent))body+=",\"packPower\":"+String(packVoltage*packCurrent/1000.0f,2);
  body+="}";
  String resp;int code;postJson("/device/telemetry",body,resp,code,true);
}

static String scanOptions(){
  String h;if(visibleCount<=0)return "<option value=''>جاري البحث عن الشبكات...</option>";
  for(int i=0;i<visibleCount;i++)h+="<option value='"+htmlEscape(visible[i].ssid)+"'>"+htmlEscape(visible[i].ssid)+" ("+String(visible[i].rssi)+" dBm)</option>";
  return h;
}
static String networksJson(){
  String j="[";
  for(int i=0;i<visibleCount;i++){if(i)j+=",";j+="{\"ssid\":\""+jsonEscape(visible[i].ssid)+"\",\"rssi\":"+String(visible[i].rssi)+"}";}
  j+="]";return j;
}
static String statusJson(){
  String j="{\"deviceId\":\""+jsonEscape(deviceId)+"\",\"firmware\":\""+String(App::VERSION)+"\",\"wifiConnected\":"+(WiFi.status()==WL_CONNECTED?"true":"false")+",\"wifiSsid\":\""+jsonEscape(WiFi.status()==WL_CONNECTED?WiFi.SSID():String(""))+"\",\"stationIp\":\""+(WiFi.status()==WL_CONNECTED?WiFi.localIP().toString():String(""))+"\",\"serverState\":\""+jsonEscape(serverState)+"\",\"deviceStatus\":\""+jsonEscape(serverDeviceStatus)+"\",\"framesPerSecond\":"+String(fps)+",\"canMode\":\"500 kbps LISTEN ONLY\"}";return j;
}
static String setupPage(){
  String h=R"HTML(<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HXD Setup</title><style>
:root{color-scheme:dark;--b:#07101f;--p:#0d1a2c;--l:#223650;--t:#eef5ff;--m:#93a7bf;--a:#58a8ff}*{box-sizing:border-box}body{margin:0;background:var(--b);color:var(--t);font-family:Arial}main{max-width:760px;margin:auto;padding:24px 16px 60px}.card{background:var(--p);border:1px solid var(--l);border-radius:20px;padding:18px;margin:15px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.m{border:1px solid var(--l);border-radius:13px;padding:12px}.m small{display:block;color:var(--m)}label{display:grid;gap:7px;margin:12px 0;color:var(--m)}input,select{width:100%;padding:13px;border-radius:11px;border:1px solid var(--l);background:#081321;color:white}button{padding:12px 15px;border:0;border-radius:11px;font-weight:700;background:#3189e8;color:white}.danger{background:#421a20}.hint{color:var(--m);font-size:12px;line-height:1.7}@media(max-width:600px){.grid{grid-template-columns:1fr}}</style></head><body><main><h2>HIJJAWI X DEVICE</h2><div style="color:#58a8ff">CLOUD PILOT · v0.4</div><section class="card"><div class="grid">)HTML";
  h+="<div class='m'><small>Device ID</small><b>"+htmlEscape(deviceId)+"</b></div><div class='m'><small>CAN</small><b>500 kbps · Listen Only</b></div><div class='m'><small>Wi-Fi</small><b id='wifi'>"+htmlEscape(WiFi.status()==WL_CONNECTED?WiFi.SSID():String("Searching..."))+"</b></div><div class='m'><small>Server</small><b id='srv'>"+htmlEscape(serverState)+"</b></div></div></section>";
  h+="<section class='card'><h3>إضافة شبكة موثوقة</h3><p class='hint'>الجهاز يبحث تلقائياً عن الشبكات المحفوظة ويختار الأقوى. اختر الشبكة من القائمة ولا تحتاج لكتابة اسمها.</p><form method='post' action='/network'><label>الشبكة<select id='ssidList' name='ssid'>"+scanOptions()+"</select></label><label>كلمة المرور<input type='password' name='pass'></label><button>حفظ الشبكة</button></form></section>";
  h+="<section class='card'><h3>تفعيل الجهاز على Hijjawi X</h3><form method='post' action='/claim'><label>Enrollment / Claim Code<input name='claim' value='"+htmlEscape(claimCode)+"'></label><button>حفظ وبدء التسجيل</button></form><p class='hint'>Server: "+String(App::SERVER_BASE)+"<br>بعد التسجيل سيظهر الجهاز Pending في Owner Dashboard.</p></section>";
  h+=R"HTML(<section class="card"><button onclick="location.reload()">بحث جديد / Refresh</button> <form style="display:inline" method="post" action="/erase" onsubmit="return confirm('Erase all settings?')"><button class="danger">مسح الإعدادات</button></form></section><script>
async function refreshNetworks(){try{const xs=await(await fetch('/networks',{cache:'no-store'})).json();const sel=document.getElementById('ssidList'),old=sel.value;sel.replaceChildren();if(!xs.length){const o=document.createElement('option');o.value='';o.textContent='جاري البحث عن الشبكات...';sel.append(o);return;}for(const x of xs){const o=document.createElement('option');o.value=x.ssid;o.textContent=x.ssid+' ('+x.rssi+' dBm)';sel.append(o)}if([...sel.options].some(o=>o.value===old))sel.value=old}catch(e){}}
setInterval(async()=>{try{let s=await(await fetch('/status',{cache:'no-store'})).json();srv.textContent=s.serverState;wifi.textContent=s.wifiConnected?s.wifiSsid:'Searching...'}catch(e){}},1500);
setInterval(refreshNetworks,3000);refreshNetworks();
</script></main></body></html>)HTML";
  return h;
}
static void beginPortal(){
  server.on("/",HTTP_GET,[](){server.send(200,"text/html; charset=utf-8",setupPage());});
  server.on("/status",HTTP_GET,[](){server.send(200,"application/json",statusJson());});
  server.on("/networks",HTTP_GET,[](){server.send(200,"application/json",networksJson());});
  server.on("/network",HTTP_POST,[](){String s=server.arg("ssid"),p=server.arg("pass");if(s.length())saveNetwork(s,p);server.sendHeader("Location","/",true);server.send(302);WiFi.disconnect(false,false);lastWifiScan=0;});
  server.on("/claim",HTTP_POST,[](){saveClaim(server.arg("claim"));if(!deviceToken.length())serverState="ready-to-enroll";server.sendHeader("Location","/",true);server.send(302);});
  server.on("/erase",HTTP_POST,[](){eraseAll();server.sendHeader("Location","/",true);server.send(302);});
  server.onNotFound([](){server.sendHeader("Location","/",true);server.send(302);});server.begin();
}

void setup(){
  Serial.begin(App::SERIAL_BAUD);FastLED.addLeds<WS2812B,Pins::RGB_PIN,GRB>(rgb,1);FastLED.setBrightness(45);setRgb(120,40,0);delay(250);
  deviceId=makeDeviceId();loadConfig();Serial.printf("\n%s %s\nDevice: %s\n",App::NAME,App::VERSION,deviceId.c_str());
  WiFi.mode(WIFI_AP_STA);WiFi.setSleep(false);apSsid="HXD-SETUP-"+deviceId.substring(deviceId.length()-6);WiFi.softAP(apSsid.c_str(),App::AP_PASSWORD);setRgb(0,30,120);
  beginPortal();canReady=startCan();Serial.printf("AP: %s http://%s\n",apSsid.c_str(),WiFi.softAPIP().toString().c_str());startNetworkScan();
}
void loop(){server.handleClient();serviceNetworkScan();serviceWifi();serviceCan();bootstrapIfNeeded();heartbeat();sendTelemetry();delay(2);}
