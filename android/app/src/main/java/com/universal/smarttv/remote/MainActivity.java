package com.universal.smarttv.remote;

import android.content.Context;
import android.hardware.ConsumerIrManager;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private AndroidRemoteBridge remoteBridge;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            remoteBridge = new AndroidRemoteBridge(this);
            webView.addJavascriptInterface(remoteBridge, "AndroidRemoteBridge");
        }
    }

    public static class AndroidRemoteBridge {
        private final Context context;
        private final ConsumerIrManager irManager;
        private final AndroidTvRemoteV2 androidTvRemote;

        public AndroidRemoteBridge(Context context) {
            this.context = context.getApplicationContext();
            ConsumerIrManager manager = null;
            try {
                manager = (ConsumerIrManager) context.getSystemService(Context.CONSUMER_IR_SERVICE);
            } catch (Exception ignored) {}
            this.irManager = manager;
            this.androidTvRemote = new AndroidTvRemoteV2(this.context);
        }

        @JavascriptInterface
        public boolean isAvailable() {
            return true;
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
                if (irManager == null || !irManager.hasIrEmitter()) return false;
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
        public boolean ping(String ip, int port) {
            return androidTvRemote.ping(ip, port);
        }

        @JavascriptInterface
        public String pair(String ip, String pin, String clientName) {
            return androidTvRemote.pair(ip, pin, clientName);
        }

        @JavascriptInterface
        public boolean sendKey(String ip, int keyCode, String direction) {
            return androidTvRemote.sendKey(ip, keyCode, direction);
        }

        @JavascriptInterface
        public boolean sendText(String ip, String text) {
            return androidTvRemote.sendText(ip, text);
        }

        @JavascriptInterface
        public boolean launchApp(String ip, String appLink) {
            return androidTvRemote.launchApp(ip, appLink);
        }

        @JavascriptInterface
        public String getBridgeVersion() {
            return "3.0.0-android-tv-remote-v2";
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
                            if (hostAddress != null &&
                                    (hostAddress.startsWith("192.168.") ||
                                     hostAddress.startsWith("10.") ||
                                     hostAddress.startsWith("172."))) {
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
