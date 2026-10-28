package com.hijjawi.espprogrammer;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final int PICK_MERGED=10;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private UsbEspConnection usb;
    private byte[] mergedBin;
    private TextView status,usbInfo,fileInfo;
    private ProgressBar progress;
    private Button flashBtn;

    private final BroadcastReceiver usbPermissionReceiver=new BroadcastReceiver(){
        @Override public void onReceive(Context context,Intent intent){
            if(UsbEspConnection.ACTION_USB_PERMISSION.equals(intent.getAction())){
                boolean granted=intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED,false);
                append(granted?"USB permission granted":"USB permission denied");
                scanUsb();
            }
        }
    };

    @Override protected void onCreate(Bundle b){
        super.onCreate(b);
        usb=new UsbEspConnection(this);
        IntentFilter f=new IntentFilter(UsbEspConnection.ACTION_USB_PERMISSION);
        if(Build.VERSION.SDK_INT>=33)registerReceiver(usbPermissionReceiver,f,Context.RECEIVER_NOT_EXPORTED);else registerReceiver(usbPermissionReceiver,f);
        setContentView(buildUi());
        scanUsb();
    }

    private View buildUi(){
        ScrollView sv=new ScrollView(this);sv.setBackgroundColor(Color.rgb(7,11,16));
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(28,32,28,60);sv.addView(root);
        root.addView(title("HIJJAWI ESP PROGRAMMER",26,Color.WHITE));
        root.addView(title("T-CAN485 · FACTORY FLASH v0.2",13,Color.rgb(92,153,206)));

        root.addView(section("1 · وصّل القطعة بالهاتف عن طريق USB-OTG"));
        usbInfo=body("Scanning USB...");root.addView(usbInfo);
        Button scan=button("SCAN USB / فحص USB");scan.setOnClickListener(v->scanUsb());root.addView(scan);

        root.addView(section("2 · اختر ملف HXD merged.bin"));
        Button pick=button("SELECT MERGED FIRMWARE .BIN");pick.setOnClickListener(v->pickFile());root.addView(pick);
        fileInfo=body("No merged .bin selected");root.addView(fileInfo);

        TextView boot=body("إذا لم يدخل ESP32 إلى وضع البرمجة تلقائياً: اضغط BOOT واستمر بالضغط، اضغط RESET واتركه، ثم اترك BOOT واضغط FLASH.");
        boot.setTextColor(Color.rgb(255,190,80));root.addView(boot);

        flashBtn=button("FLASH ESP32 OVER USB");flashBtn.setOnClickListener(v->flashUsb());root.addView(flashBtn);

        root.addView(section("STATUS"));
        progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);progress.setMax(100);root.addView(progress,new LinearLayout.LayoutParams(-1,18));
        status=body("Ready");status.setTextIsSelectable(true);root.addView(status);
        return sv;
    }

    private TextView title(String s,int sp,int color){TextView t=new TextView(this);t.setText(s);t.setTextSize(sp);t.setTextColor(color);t.setPadding(0,4,0,5);return t;}
    private TextView section(String s){TextView t=title(s,17,Color.rgb(80,170,245));t.setPadding(0,30,0,10);return t;}
    private TextView body(String s){TextView t=title(s,14,Color.rgb(194,207,222));t.setPadding(0,8,0,12);return t;}
    private Button button(String s){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setBackgroundColor(Color.rgb(25,113,188));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(0,6,0,6);b.setLayoutParams(p);return b;}

    private void scanUsb(){
        UsbDevice d=usb.findSupportedDevice();
        if(d==null){usbInfo.setText("No supported USB serial device detected. تأكد من OTG وأن الكابل Data.");return;}
        usbInfo.setText(String.format("USB: %04X:%04X · %s · permission=%s",d.getVendorId(),d.getProductId(),d.getDeviceName(),usb.hasPermission()));
        if(!usb.hasPermission())usb.requestPermission();
    }

    private void pickFile(){Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("application/octet-stream");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,PICK_MERGED);}

    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode!=PICK_MERGED||resultCode!=RESULT_OK||data==null||data.getData()==null)return;
        try{
            mergedBin=readAll(getContentResolver().openInputStream(data.getData()));
            String n=data.getData().getLastPathSegment();
            fileInfo.setText(n+" · "+mergedBin.length+" bytes");
        }catch(Exception e){append("File error: "+e.getMessage());}
    }

    private void flashUsb(){
        if(mergedBin==null){toast("اختر merged.bin أولاً");return;}
        if(usb.findSupportedDevice()==null){toast("USB device not found");return;}
        if(!usb.hasPermission()){usb.requestPermission();return;}
        flashBtn.setEnabled(false);progress.setProgress(0);
        worker.submit(()->{
            try{
                UsbSerialPort port=usb.open();
                EspRomFlasher f=new EspRomFlasher(port,new EspRomFlasher.Listener(){
                    public void onStatus(String t){append(t);}
                    public void onProgress(int p){runOnUiThread(()->progress.setProgress(p));}
                });
                f.flashMerged(mergedBin);
            }catch(Exception e){append("FLASH FAILED: "+e.getMessage());}
            finally{usb.close();runOnUiThread(()->flashBtn.setEnabled(true));}
        });
    }

    private static byte[] readAll(InputStream in)throws Exception{try(InputStream x=in;ByteArrayOutputStream o=new ByteArrayOutputStream()){byte[] b=new byte[16384];int n;while((n=x.read(b))>0)o.write(b,0,n);return o.toByteArray();}}
    private void append(String s){runOnUiThread(()->status.setText(status.getText()+"\n"+s));}
    private void toast(String s){Toast.makeText(this,s,Toast.LENGTH_SHORT).show();}
    @Override protected void onDestroy(){super.onDestroy();try{unregisterReceiver(usbPermissionReceiver);}catch(Exception ignored){}usb.close();worker.shutdownNow();}
}
