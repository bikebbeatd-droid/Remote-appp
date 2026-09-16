package com.universal.smarttv.remote;

import android.content.Context;
import android.hardware.ConsumerIrManager;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.List;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Expose Native Android Bridge to the WebView
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.addJavascriptInterface(new AndroidRemoteBridge(this), "AndroidRemoteBridge");
        }
    }

    public static class AndroidRemoteBridge {
        private final Context context;
        private final ConsumerIrManager irManager;

        public AndroidRemoteBridge(Context context) {
            this.context = context;
            ConsumerIrManager manager = null;
            try {
                manager = (ConsumerIrManager) context.getSystemService(Context.CONSUMER_IR_SERVICE);
            } catch (Exception ignored) {}
            this.irManager = manager;
        }

        @JavascriptInterface
        public boolean hasIrEmitter() {
            try {
                return irManager != null && irManager.hasIrEmitter();
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public boolean transmitIr(int carrierFrequency, String patternCsv) {
            try {
                if (irManager == null || !irManager.hasIrEmitter()) {
                    return false;
                }
                String[] parts = patternCsv.split(",");
                int[] pattern = new int[parts.length];
                for (int i = 0; i < parts.length; i++) {
                    pattern[i] = Integer.parseInt(parts[i].trim());
                }
                irManager.transmit(carrierFrequency > 0 ? carrierFrequency : 38000, pattern);
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public String getBridgeVersion() {
            return "2.0.0-android-native";
        }

        @JavascriptInterface
        public String getLanIp() {
            try {
                List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
                for (NetworkInterface intf : interfaces) {
                    if (intf.isLoopback() || !intf.isUp()) continue;
                    List<InetAddress> addrs = Collections.list(intf.getInetAddresses());
                    for (InetAddress addr : addrs) {
                        if (!addr.isLoopbackAddress() && addr.getAddress().length == 4) {
                            String hostAddress = addr.getHostAddress();
                            if (hostAddress != null && (hostAddress.startsWith("192.168.") || hostAddress.startsWith("10.") || hostAddress.startsWith("172."))) {
                                return hostAddress;
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
            return "";
        }
    }
}

