package com.hijjawi.canabletester;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.hardware.usb.*;
import android.os.*;
import android.view.View;
import android.widget.*;
import com.hoho.android.usbserial.driver.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {
  static final String PERMISSION = "com.hijjawi.canabletester.USB_PERMISSION";
  final ExecutorService worker = Executors.newSingleThreadExecutor();
  final AtomicBoolean running = new AtomicBoolean(false);
  volatile boolean starting = false, english = false, pendingPermission = false;
  UsbManager manager; UsbDevice device; UsbSerialDriver driver;
  TextView info, state, results; Button scan, connect, stop, language;
  Spinner canBaud, serialBaud;
  long frames = 0;
  final StringBuilder lines = new StringBuilder();
  final BroadcastReceiver permissionReceiver = new BroadcastReceiver() {
    @Override public void onReceive(Context c, Intent intent) {
      if (!PERMISSION.equals(intent.getAction())) return;
      boolean allowed = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED,false);
      append(allowed ? "USB PERMISSION GRANTED" : "USB PERMISSION DENIED");
      if (allowed && pendingPermission) { pendingPermission=false; connect(); }
      else { pendingPermission=false; scan(); }
    }
  };
  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    manager = (UsbManager)getSystemService(Context.USB_SERVICE);
    IntentFilter f = new IntentFilter(PERMISSION);
    if (Build.VERSION.SDK_INT >= 33) registerReceiver(permissionReceiver, f, Context.RECEIVER_NOT_EXPORTED);
    else registerReceiver(permissionReceiver, f);
    buildUi();
    scan();
  }
  String tr(String ar,String en) { return english?en:ar; }
  TextView label(String t,int size,int color) {
    TextView v=new TextView(this); v.setText(t);v.setTextSize(size);v.setTextColor(color);
    v.setPadding(1,12,1,12);return v;
  }
  Button button(String t,LinearLayout parent) {
    Button b=new Button(this);b.setText(t);b.setAllCaps(false);
    b.setTextColor(Color.WHITE);
    b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(25,106,187)));
    parent.addView(b);return b;
  }
  void buildUi() {
    ScrollView scroll=new ScrollView(this);scroll.setBackgroundColor(Color.rgb(7,17,31));
    LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(27,22,27,50);
    scroll.addView(root);setContentView(scroll);
    root.addView(label("HIJJAWI X · CAN LAB",24,Color.WHITE));
    root.addView(label("MKS CANable · Android OTG · v0.1 · READ ONLY",12,Color.rgb(100,175,240)));
    language=button("عربي / EN",root);language.setOnClickListener(v->{english=!english;refresh();});
    root.addView(label("USB TEST FIRST · DO NOT CONNECT HIGH VOLTAGE",13,Color.rgb(255,190,92)));
    state=label("",16,Color.rgb(98,224,183));root.addView(state);
    info=label("",13,Color.rgb(200,212,231));info.setTextIsSelectable(true);root.addView(info);
    scan=button("SCAN USB",root);scan.setOnClickListener(v->scan());
    root.addView(label("USB SERIAL BAUD",12,Color.rgb(155,183,228)));
    serialBaud=new Spinner(this);
    serialBaud.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,
      new String[]{"115200","230400","460800","57600","9600"}));
    root.addView(serialBaud);
    root.addView(label("CAN SPEED / سرعة CAN",12,Color.rgb(155,183,228)));
    canBaud=new Spinner(this);
    canBaud.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,
      new String[]{"500 kbps","250 kbps","125 kbps","1 Mbps"}));
    root.addView(canBaud);
    connect=button("CONNECT SLCAN",root);connect.setOnClickListener(v->connect());
    stop=button("DISCONNECT",root);stop.setOnClickListener(v->{running.set(false);append("DISCONNECT REQUESTED");});
    results=label("",13,Color.rgb(220,232,245));results.setTextIsSelectable(true);
    results.setTextDirection(View.TEXT_DIRECTION_LTR);root.addView(results);
    refresh();
  }
  void refresh() {
    scan.setText(tr("فحص USB / Scan","SCAN USB"));
    connect.setText(tr("اتصال SLCAN · استقبال فقط","CONNECT SLCAN · LISTEN ONLY"));
    stop.setText(tr("فصل الاتصال","DISCONNECT"));
    if (running.get()) state.setText(tr("متصل — CAN استقبال فقط","Connected — listen-only CAN"));
    else if (starting) state.setText(tr("جار فتح المنفذ...","Opening port..."));
    else state.setText(tr("غير متصل","Disconnected"));
  }
  void append(String message) {
    runOnUiThread(()->{
      lines.insert(0, new java.text.SimpleDateFormat("HH:mm:ss",Locale.US).format(new Date())+"  "+message+"\n");
      if(lines.length()>14000)lines.setLength(14000);
      results.setText(lines);
      refresh();
    });
  }
  void scan() {
    if (running.get()||starting) return;
    device=null;driver=null;
    StringBuilder found=new StringBuilder();
    for (UsbDevice d:manager.getDeviceList().values()) {
      found.append(String.format(Locale.US,"VID:%04X PID:%04X  USB class:%d  interfaces:%d\n",
        d.getVendorId(),d.getProductId(),d.getDeviceClass(),d.getInterfaceCount()));
      for(int j=0;j<d.getInterfaceCount();j++)
        found.append(String.format(Locale.US,"  interface %d class:%d subclass:%d\n",j,
          d.getInterface(j).getInterfaceClass(),d.getInterface(j).getInterfaceSubclass()));
      UsbSerialDriver s=UsbSerialProber.getDefaultProber().probeDevice(d);
      if(s!=null && driver==null){driver=s;device=d;found.append("  SERIAL DRIVER: "+s.getClass().getSimpleName()+"\n");}
    }
    info.setText(found.length()==0?tr("لا يوجد USB. تأكد من OTG وكابل البيانات","No USB detected. Check OTG and data cable"):found.toString());
    if(driver!=null)append("SLCAN SERIAL CANDIDATE DETECTED");
    else if(found.length()>0)append("USB FOUND BUT NO SERIAL DRIVER. Possible candleLight / gs_usb firmware. DO NOT FLASH.");
  }
  void connect() {
    if(running.get()||starting)return;
    if(driver==null) {scan();if(driver==null){append("NO SUPPORTED USB SERIAL DEVICE");return;}}
    if(!manager.hasPermission(device)){
      pendingPermission=true;
      Intent request=new Intent(PERMISSION).setPackage(getPackageName());
      PendingIntent pi=PendingIntent.getBroadcast(this,0,request,
        PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
      manager.requestPermission(device,pi);
      append("USB ACCESS PERMISSION REQUESTED");
      return;
    }
    final UsbSerialDriver selected=driver;final UsbDevice selectedDevice=device;
    final int usbSpeed=Integer.parseInt(serialBaud.getSelectedItem().toString());
    final String[] speeds={"S6\r","S5\r","S4\r","S8\r"};
    final String canSpeed=speeds[canBaud.getSelectedItemPosition()];
    starting=true; connect.setEnabled(false);refresh();
    worker.execute(()->{
      UsbSerialPort port=null;UsbDeviceConnection usbConnection=null;
      try{
        usbConnection=manager.openDevice(selectedDevice);
        if(usbConnection==null)throw new IllegalStateException("USB open failed");
        port=selected.getPorts().get(0);
        port.open(usbConnection);
        port.setParameters(usbSpeed,8,UsbSerialPort.STOPBITS_1,UsbSerialPort.PARITY_NONE);
        // Only local SLCAN configuration: C close, S set bus rate, L listen-only.
        // NO O/t/T/r/R data transmission; never send diagnostic requests.
        send(port,"C\r");send(port,canSpeed);send(port,"L\r");
        running.set(true);starting=false;
        append("LISTEN ONLY STARTED - waiting for CAN frames");
        byte[] buf=new byte[2048];StringBuilder line=new StringBuilder();
        while(running.get()){
          int n=port.read(buf,300);
          for(int i=0;i<n;i++){
            int c=buf[i]&255;
            if(c==13||c==10) {
              if(line.length()>0){handleLine(line.toString());line.setLength(0);}
            } else if(c==7)append("SLCAN NACK/BELL — check firmware support");
            else if(c>=32&&c<127) {
              if(line.length()<300)line.append((char)c);else line.setLength(0);
            }
          }
        }
      }catch(Exception e){append("ERROR: "+e.getClass().getSimpleName()+": "+e.getMessage());}
      finally{
        running.set(false);starting=false;
        try{if(port!=null)send(port,"C\r");}catch(Exception ignored){}
        try{if(port!=null)port.close();}catch(Exception ignored){}
        if(usbConnection!=null)usbConnection.close();
        runOnUiThread(()->{connect.setEnabled(true);refresh();});
        append("PORT CLOSED. TOTAL FRAMES: "+frames);
      }
    });
  }
  void send(UsbSerialPort port,String txt)throws Exception {
    port.write(txt.getBytes(StandardCharsets.US_ASCII),2000);
  }
  void handleLine(String s){
    if(s.isEmpty()||"tTrRdDbB".indexOf(s.charAt(0))<0)return;
    int ids=Character.isUpperCase(s.charAt(0))?8:3;
    if(s.length()<ids+2)return;
    String id=s.substring(1,1+ids), dlc=s.substring(1+ids,2+ids);
    if(!id.matches("[0-9a-fA-F]+") || !dlc.matches("[0-9a-fA-F]"))return;
    int length=Integer.parseInt(dlc,16);
    boolean fd="dDbB".indexOf(s.charAt(0))>=0;
    if(!fd&&length>8)return;
    int[] fdlen={0,1,2,3,4,5,6,7,8,12,16,20,24,32,48,64};
    length=fd?fdlen[length]:length;
    boolean rtr=s.charAt(0)=='r'||s.charAt(0)=='R';
    if(s.length()<ids+2+(rtr?0:length*2))return;
    String data=s.substring(ids+2,ids+2+(rtr?0:length*2));
    if(!data.matches("[0-9a-fA-F]*"))return;
    frames++;
    if(frames==1||frames%10==0)append("RX#"+frames+" CAN:"+id.toUpperCase(Locale.US)+" "+data.toUpperCase(Locale.US));
  }
  @Override public void onDestroy(){
    running.set(false);worker.shutdownNow();
    try{unregisterReceiver(permissionReceiver);}catch(Exception ignored){}
    super.onDestroy();
  }
}
