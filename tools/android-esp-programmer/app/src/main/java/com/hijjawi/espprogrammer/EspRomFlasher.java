package com.hijjawi.espprogrammer;

import com.hoho.android.usbserial.driver.UsbSerialPort;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;

public class EspRomFlasher {
    public interface Listener { void onStatus(String text); void onProgress(int percent); }

    private static final int ESP_SYNC = 0x08;
    private static final int ESP_SPI_SET_PARAMS = 0x0B;
    private static final int ESP_SPI_ATTACH = 0x0D;
    private static final int ESP_FLASH_BEGIN = 0x02;
    private static final int ESP_FLASH_DATA = 0x03;
    private static final int ESP_FLASH_END = 0x04;
    private static final int ESP_SPI_FLASH_MD5 = 0x13;
    private static final int BLOCK = 0x400;
    private static final int FLASH_SIZE = 4 * 1024 * 1024;

    private final UsbSerialPort port;
    private final Listener listener;

    public EspRomFlasher(UsbSerialPort port, Listener listener) {
        this.port = port; this.listener = listener;
    }

    public void flashMerged(byte[] image) throws IOException {
        if (image.length < 4096) throw new IOException("Merged image is too small");
        listener.onStatus("Synchronizing with ESP32 ROM bootloader...");
        drain();
        if (!sync()) throw new IOException("No ESP32 bootloader response. Hold BOOT, tap RESET, release BOOT, then retry.");

        listener.onStatus("Bootloader synchronized");
        command(ESP_SPI_ATTACH, words(0, 0), 0, 2000);
        command(ESP_SPI_SET_PARAMS, words(0, FLASH_SIZE, 0x10000, 0x1000, 0x100, 0xFFFF), 0, 2000);

        int blocks = (image.length + BLOCK - 1) / BLOCK;
        int eraseSize = ((image.length + 0xFFF) / 0x1000) * 0x1000;
        command(ESP_FLASH_BEGIN, words(eraseSize, blocks, BLOCK, 0), 0, 10000);

        for (int seq = 0; seq < blocks; seq++) {
            int start = seq * BLOCK;
            int count = Math.min(BLOCK, image.length - start);
            byte[] data = new byte[BLOCK];
            Arrays.fill(data, (byte)0xFF);
            System.arraycopy(image, start, data, 0, count);
            ByteArrayOutputStream payload = new ByteArrayOutputStream(16 + BLOCK);
            payload.write(words(BLOCK, seq, 0, 0), 0, 16);
            payload.write(data, 0, data.length);
            command(ESP_FLASH_DATA, payload.toByteArray(), checksum(data), 5000);
            int pct = (int)(((long)(seq + 1) * 100L) / blocks);
            listener.onProgress(pct);
            if ((seq % 32) == 0) listener.onStatus("Flashing " + pct + "%");
        }

        listener.onStatus("Verifying flash MD5...");
        byte[] md5Resp = command(ESP_SPI_FLASH_MD5, words(0, image.length, 0, 0), 0, 12000);
        if (!verifyMd5(md5Resp, image)) throw new IOException("Flash MD5 verification failed");
        listener.onStatus("MD5 verified. Flash write is successful.");
        // Do not issue FLASH_END reboot from the phone flasher. Some ESP32 ROM/USB-UART
        // combinations return ROM error 0x06 even after a fully verified flash.
        // Espressif documents FLASH_END as optional when remaining in the loader.
        // A manual RESET gives us a deterministic first-boot path on T-CAN485.
        listener.onProgress(100);
        listener.onStatus("FLASH SUCCESS. Press RESET once (do NOT hold BOOT) to start the new firmware.");
    }

    public boolean sync() throws IOException {
        byte[] p = new byte[36];
        p[0]=0x07; p[1]=0x07; p[2]=0x12; p[3]=0x20;
        Arrays.fill(p,4,p.length,(byte)0x55);
        for(int i=0;i<7;i++){
            try { command(ESP_SYNC,p,0,800); return true; }
            catch(IOException e){ sleep(80); }
        }
        return false;
    }

    private byte[] command(int opcode, byte[] data, int checksum, int timeoutMs) throws IOException {
        ByteBuffer bb=ByteBuffer.allocate(8+data.length).order(ByteOrder.LITTLE_ENDIAN);
        bb.put((byte)0).put((byte)opcode).putShort((short)data.length).putInt(checksum).put(data);
        port.write(slipEncode(bb.array()), Math.max(timeoutMs,2000));
        long deadline=System.currentTimeMillis()+timeoutMs;
        while(System.currentTimeMillis()<deadline){
            byte[] resp=readSlipFrame((int)Math.max(50,deadline-System.currentTimeMillis()));
            if(resp==null||resp.length<8) continue;
            int dir=resp[0]&0xFF, cmd=resp[1]&0xFF;
            if(dir!=1||cmd!=opcode) continue;
            int size=(resp[2]&0xFF)|((resp[3]&0xFF)<<8);
            if(resp.length<8+size) continue;
            if(size>=4){
                int status=resp[8+size-4]&0xFF, error=resp[8+size-3]&0xFF;
                if(status!=0) throw new IOException(String.format("ESP error cmd=0x%02X status=%d error=%d",opcode,status,error));
            } else if(size>=2){
                int status=resp[8+size-2]&0xFF, error=resp[8+size-1]&0xFF;
                if(status!=0) throw new IOException(String.format("ESP error cmd=0x%02X status=%d error=%d",opcode,status,error));
            }
            return resp;
        }
        throw new IOException(String.format("Timeout waiting for ESP command 0x%02X",opcode));
    }

    private byte[] readSlipFrame(int timeoutMs) throws IOException {
        long deadline=System.currentTimeMillis()+timeoutMs;
        ByteArrayOutputStream frame=new ByteArrayOutputStream();
        boolean inFrame=false,escape=false;
        byte[] buf=new byte[512];
        while(System.currentTimeMillis()<deadline){
            int n=port.read(buf,100);
            if(n<=0) continue;
            for(int i=0;i<n;i++){
                int b=buf[i]&0xFF;
                if(!inFrame){ if(b==0xC0){inFrame=true;frame.reset();} continue; }
                if(b==0xC0){ if(frame.size()>0)return frame.toByteArray(); else continue; }
                if(escape){
                    if(b==0xDC)frame.write(0xC0); else if(b==0xDD)frame.write(0xDB); else frame.write(b);
                    escape=false;
                } else if(b==0xDB) escape=true;
                else frame.write(b);
            }
        }
        return null;
    }

    private static boolean verifyMd5(byte[] response, byte[] image) {
        try {
            int size=(response[2]&0xFF)|((response[3]&0xFF)<<8);
            if(response.length<8+size) return false;
            MessageDigest md=MessageDigest.getInstance("MD5");
            byte[] localBytes=md.digest(image);
            StringBuilder localHex=new StringBuilder();
            for(byte b:localBytes)localHex.append(String.format("%02x",b&0xFF));

            if(size>=36){
                String remote=new String(response,8,32,StandardCharsets.US_ASCII).trim().toLowerCase();
                return remote.equals(localHex.toString());
            }
            if(size>=18){
                for(int i=0;i<16;i++) if(response[8+i]!=localBytes[i]) return false;
                return true;
            }
            return false;
        } catch(Exception e){ return false; }
    }

    private static byte[] slipEncode(byte[] raw){
        ByteArrayOutputStream o=new ByteArrayOutputStream(raw.length+16); o.write(0xC0);
        for(byte value:raw){int b=value&0xFF;if(b==0xC0){o.write(0xDB);o.write(0xDC);}else if(b==0xDB){o.write(0xDB);o.write(0xDD);}else o.write(b);}
        o.write(0xC0); return o.toByteArray();
    }
    private static int checksum(byte[] data){int c=0xEF;for(byte b:data)c^=(b&0xFF);return c;}
    private static byte[] words(int... words){ByteBuffer b=ByteBuffer.allocate(words.length*4).order(ByteOrder.LITTLE_ENDIAN);for(int w:words)b.putInt(w);return b.array();}
    private void drain(){try{byte[] b=new byte[512];while(port.read(b,30)>0){}}catch(Exception ignored){}}
    private static void sleep(long ms){try{Thread.sleep(ms);}catch(InterruptedException ignored){}}
}
