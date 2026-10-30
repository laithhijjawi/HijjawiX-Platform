package com.hijjawi.espprogrammer;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import com.hoho.android.usbserial.driver.Ch34xSerialDriver;
import com.hoho.android.usbserial.driver.ProbeTable;
import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;
import java.io.IOException;
import java.util.List;

public class UsbEspConnection {
    public static final String ACTION_USB_PERMISSION="com.hijjawi.espprogrammer.USB_PERMISSION";
    private final Context context;
    private final UsbManager manager;
    private UsbDevice device;
    private UsbDeviceConnection connection;
    private UsbSerialPort port;

    public UsbEspConnection(Context context){this.context=context;this.manager=(UsbManager)context.getSystemService(Context.USB_SERVICE);}

    private UsbSerialDriver probe(UsbDevice d){
        UsbSerialDriver driver=UsbSerialProber.getDefaultProber().probeDevice(d);
        if(driver!=null)return driver;
        ProbeTable table=new ProbeTable();
        table.addProduct(0x1A86,0x55D4,Ch34xSerialDriver.class);
        table.addProduct(0x1A86,0x55D5,Ch34xSerialDriver.class);
        return new UsbSerialProber(table).probeDevice(d);
    }

    public UsbDevice findSupportedDevice(){
        for(UsbDevice d:manager.getDeviceList().values()) if(probe(d)!=null){device=d;return d;}
        device=null;return null;
    }

    public boolean hasPermission(){return device!=null&&manager.hasPermission(device);}
    public void requestPermission(){
        if(device==null)return;
        Intent i=new Intent(ACTION_USB_PERMISSION).setPackage(context.getPackageName());
        PendingIntent pi=PendingIntent.getBroadcast(context,0,i,PendingIntent.FLAG_MUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        manager.requestPermission(device,pi);
    }

    public UsbSerialPort open() throws IOException {
        if(device==null)throw new IOException("No USB serial device selected");
        UsbSerialDriver driver=probe(device);
        if(driver==null)throw new IOException("Unsupported USB serial bridge");
        connection=manager.openDevice(device);
        if(connection==null)throw new IOException("USB permission missing");
        List<UsbSerialPort> ports=driver.getPorts();
        if(ports.isEmpty())throw new IOException("No serial port found");
        port=ports.get(0); port.open(connection);
        port.setParameters(115200,8,UsbSerialPort.STOPBITS_1,UsbSerialPort.PARITY_NONE);
        try{port.setDTR(false);port.setRTS(false);}catch(Exception ignored){}
        return port;
    }

    public void close(){
        try{if(port!=null)port.close();}catch(Exception ignored){}
        try{if(connection!=null)connection.close();}catch(Exception ignored){}
        port=null;connection=null;
    }
}
