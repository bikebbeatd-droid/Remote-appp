package com.universal.smarttv.remote;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.ConsumerIrManager;
import android.os.Bundle;
import android.app.UiModeManager;
import android.content.res.Configuration;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Build;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class MainActivity extends BridgeActivity {

    private AndroidRemoteBridge remoteBridge;
    private LocalRemoteReceiver localRemoteReceiver;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.setBackgroundColor(android.graphics.Color.rgb(9, 9, 11));
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
            webView.getSettings().setAllowFileAccess(true);
            webView.getSettings().setAllowContentAccess(true);
            localRemoteReceiver = new LocalRemoteReceiver((command, value) -> {
                if (remoteBridge != null) remoteBridge.setPendingLocalCommand(command, value);
            });
            localRemoteReceiver.start();
            remoteBridge = new AndroidRemoteBridge(this, localRemoteReceiver);
            remoteBridge.registerLocalRemoteService();
            webView.addJavascriptInterface(remoteBridge, "AndroidRemoteBridge");
            requestRequiredRuntimePermissions();
        }
    }

    private void requestRequiredRuntimePermissions() {
        try {
            java.util.ArrayList<String> permissions = new java.util.ArrayList<>();
            if (Build.VERSION.SDK_INT >= 33) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.NEARBY_WIFI_DEVICES) != PackageManager.PERMISSION_GRANTED) {
                    permissions.add(Manifest.permission.NEARBY_WIFI_DEVICES);
                }
            } else if (Build.VERSION.SDK_INT >= 23) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    permissions.add(Manifest.permission.ACCESS_FINE_LOCATION);
                }
            }
            boolean isTv = false;
            try {
                UiModeManager uiModeManager = (UiModeManager) getSystemService(Context.UI_MODE_SERVICE);
                isTv = uiModeManager != null && uiModeManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION;
            } catch (Exception ignored) {}
            if (!isTv && ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.CAMERA);
            }
            // Android 17+ protects LAN discovery/control with a dedicated runtime permission.
            // Use the literal name so older Android SDKs can still build the app.
            if (Build.VERSION.SDK_INT >= 37) {
                final String localNetworkPermission = "android.permission.ACCESS_LOCAL_NETWORK";
                if (ContextCompat.checkSelfPermission(this, localNetworkPermission) != PackageManager.PERMISSION_GRANTED) {
                    permissions.add(localNetworkPermission);
                }
            }
            if (Build.VERSION.SDK_INT >= 31) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) permissions.add(Manifest.permission.BLUETOOTH_SCAN);
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) permissions.add(Manifest.permission.BLUETOOTH_CONNECT);
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADVERTISE) != PackageManager.PERMISSION_GRANTED) permissions.add(Manifest.permission.BLUETOOTH_ADVERTISE);
            }
            if (Build.VERSION.SDK_INT >= 33) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) permissions.add(Manifest.permission.POST_NOTIFICATIONS);
            }
            if (!isTv && ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.RECORD_AUDIO);
            }
            if (!permissions.isEmpty()) {
                ActivityCompat.requestPermissions(this, permissions.toArray(new String[0]), 4108);
            }
        } catch (Exception ignored) {
            // The app remains usable without optional runtime permissions; features report their own unavailable state.
        }
    }

    public static class AndroidRemoteBridge {
        private final Context context;
        private final Activity activity;
        private final ConsumerIrManager irManager;
        private final AndroidTvRemoteV2 androidTvRemote;
        private final NsdManager nsdManager;
        private final LocalRemoteReceiver localReceiver;
        private final Map<String, NsdServiceInfo> androidTvServices = new ConcurrentHashMap<>();
        private volatile String pendingCommand = "";
        private volatile String pendingValue = null;
        private volatile long pendingTimestamp = 0L;
        private NsdManager.DiscoveryListener discoveryListener;
        private NsdManager.RegistrationListener localReceiverRegistrationListener;
        private NsdServiceInfo localReceiverService;

        public AndroidRemoteBridge(Activity activity, LocalRemoteReceiver localReceiver) {
            this.activity = activity;
            this.context = activity.getApplicationContext();
            this.localReceiver = localReceiver;
            ConsumerIrManager manager = null;
            try {
                manager = (ConsumerIrManager) context.getSystemService(Context.CONSUMER_IR_SERVICE);
            } catch (Exception ignored) {}
            this.irManager = manager;
            this.androidTvRemote = new AndroidTvRemoteV2(this.context);
            this.nsdManager = (NsdManager) this.context.getSystemService(Context.NSD_SERVICE);
        }

        private synchronized void registerLocalRemoteService() {
            if (nsdManager == null || localReceiver == null || !localReceiver.isRunning()) return;
            try {
                if (localReceiverRegistrationListener != null) return;
                localReceiverService = new NsdServiceInfo();
                localReceiverService.setServiceName("Universal Smart TV Remote");
                localReceiverService.setServiceType("_ustvremote._tcp");
                localReceiverService.setPort(localReceiver.getPort());
                localReceiverRegistrationListener = new NsdManager.RegistrationListener() {
                    @Override public void onServiceRegistered(NsdServiceInfo serviceInfo) { }
                    @Override public void onRegistrationFailed(NsdServiceInfo serviceInfo, int errorCode) { localReceiverRegistrationListener = null; }
                    @Override public void onServiceUnregistered(NsdServiceInfo serviceInfo) { localReceiverRegistrationListener = null; }
                    @Override public void onUnregistrationFailed(NsdServiceInfo serviceInfo, int errorCode) { }
                };
                nsdManager.registerService(localReceiverService, NsdManager.PROTOCOL_DNS_SD, localReceiverRegistrationListener);
            } catch (Exception e) {
                localReceiverRegistrationListener = null;
            }
        }

        @JavascriptInterface
        public boolean requestRequiredPermissions() {
            try {
                activity.runOnUiThread(() -> ((MainActivity) activity).requestRequiredRuntimePermissions());
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }

        @JavascriptInterface
        public String getPermissionStatus() {
            try {
                boolean nearbyWifi = Build.VERSION.SDK_INT < 33 ||
                    ContextCompat.checkSelfPermission(activity, Manifest.permission.NEARBY_WIFI_DEVICES) == PackageManager.PERMISSION_GRANTED;
                boolean location = Build.VERSION.SDK_INT > 32 ||
                    ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
                boolean camera = Build.VERSION.SDK_INT < 23 ||
                    ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
                boolean microphone = Build.VERSION.SDK_INT < 23 ||
                    ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
                boolean bluetooth = Build.VERSION.SDK_INT < 31 ||
                    (ContextCompat.checkSelfPermission(activity, Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED &&
                     ContextCompat.checkSelfPermission(activity, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED);
                boolean notifications = Build.VERSION.SDK_INT < 33 ||
                    ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
                boolean localNetwork = Build.VERSION.SDK_INT < 37 ||
                    ContextCompat.checkSelfPermission(activity, "android.permission.ACCESS_LOCAL_NETWORK") == PackageManager.PERMISSION_GRANTED;
                return "{\"nearbyWifi\":" + nearbyWifi +
                    ",\"location\":" + location +
                    ",\"camera\":" + camera +
                    ",\"microphone\":" + microphone +
                    ",\"bluetooth\":" + bluetooth +
                    ",\"notifications\":" + notifications +
                    ",\"localNetwork\":" + localNetwork + "}";
            } catch (Exception e) {
                return "{\"error\":\"permission_status_unavailable\"}";
            }
        }

        @JavascriptInterface
        public boolean startLocalReceiver() {
            return localReceiver != null && localReceiver.start();
        }

        @JavascriptInterface
        public boolean isLocalReceiverRunning() {
            return localReceiver != null && localReceiver.isRunning();
        }

        @JavascriptInterface
        public int getLocalReceiverPort() {
            return localReceiver == null ? 8765 : localReceiver.getPort();
        }

        @JavascriptInterface
        public String getLocalReceiverPairingPin() {
            return localReceiver == null ? "" : localReceiver.getPairingPin();
        }

        @JavascriptInterface
        public void regenerateLocalReceiverPin() {
            if (localReceiver != null) localReceiver.regeneratePin();
        }

        @JavascriptInterface
        public void setPendingLocalCommand(String command, String value) {
            pendingCommand = command == null ? "" : command;
            pendingValue = value == null ? "null" : value;
            pendingTimestamp = System.currentTimeMillis();
        }

        @JavascriptInterface
        public String getPendingLocalCommand() {
            if (pendingCommand == null || pendingCommand.isEmpty()) return "";
            String result = "{\"command\":\"" + jsonEscape(pendingCommand) + "\",\"value\":" + (pendingValue == null ? "null" : pendingValue) + ",\"timestamp\":" + pendingTimestamp + "}";
            pendingCommand = "";
            pendingValue = null;
            return result;
        }

        @JavascriptInterface
        public boolean isAvailable() {
            return true;
        }

        @JavascriptInterface
        public boolean hasCameraPermission() {
            return Build.VERSION.SDK_INT < 23 ||
                ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        }

        @JavascriptInterface
        public boolean requestCameraPermission() {
            try {
                if (hasCameraPermission()) return true;
                ActivityCompat.requestPermissions(activity, new String[]{Manifest.permission.CAMERA}, 4107);
                return false;
            } catch (Exception e) {
                return false;
            }
        }


        @JavascriptInterface
        public String httpRequest(String method, String urlString, String body) {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(urlString);
                if (!isAllowedLanHost(url.getHost())) {
                    return "{\"ok\":false,\"status\":0,\"error\":\"Only private LAN TV addresses are allowed.\"}";
                }
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod(method == null ? "GET" : method.toUpperCase(java.util.Locale.ROOT));
                connection.setConnectTimeout(2500);
                connection.setReadTimeout(3500);
                connection.setUseCaches(false);
                if (body != null && !body.isEmpty()) {
                    connection.setDoOutput(true);
                    connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
                    try (OutputStream out = connection.getOutputStream()) {
                        out.write(body.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    }
                }
                int status = connection.getResponseCode();
                java.io.InputStream stream = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
                StringBuilder response = new StringBuilder();
                if (stream != null) {
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, java.nio.charset.StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = reader.readLine()) != null) response.append(line);
                    }
                }
                return "{\"ok\":" + (status >= 200 && status < 300) + ",\"status\":" + status + ",\"body\":" + jsonEscape(response.toString()) + "}";
            } catch (Exception e) {
                return "{\"ok\":false,\"status\":0,\"error\":" + jsonEscape(e.getMessage() == null ? "Network request failed" : e.getMessage()) + "}";
            } finally {
                if (connection != null) connection.disconnect();
            }
        }

        private static boolean isAllowedLanHost(String host) {
            if (host == null || host.isEmpty() || "localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host)) return false;
            try {
                String[] p = host.split("\\.");
                if (p.length != 4) return false;
                int a = Integer.parseInt(p[0]), b = Integer.parseInt(p[1]), cc = Integer.parseInt(p[2]), d = Integer.parseInt(p[3]);
                if (a < 0 || a > 255 || b < 0 || b > 255 || cc < 0 || cc > 255 || d < 0 || d > 255) return false;
                return a == 10 || (a == 172 && b >= 16 && b <= 31) || (a == 192 && b == 168) || (a == 169 && b == 254);
            } catch (Exception e) { return false; }
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
        public synchronized boolean startAndroidTvDiscovery() {
            if (nsdManager == null) return false;
            stopAndroidTvDiscovery();
            discoveryListener = new NsdManager.DiscoveryListener() {
                @Override public void onStartDiscoveryFailed(String serviceType, int errorCode) { discoveryListener = null; }
                @Override public void onStopDiscoveryFailed(String serviceType, int errorCode) { }
                @Override public void onDiscoveryStarted(String serviceType) { }
                @Override public void onDiscoveryStopped(String serviceType) { }
                @Override public void onServiceFound(NsdServiceInfo serviceInfo) {
                    if ("_androidtvremote2._tcp".equalsIgnoreCase(serviceInfo.getServiceType())) {
                        nsdManager.resolveService(serviceInfo, new NsdManager.ResolveListener() {
                            @Override public void onResolveFailed(NsdServiceInfo info, int errorCode) { }
                            @Override public void onServiceResolved(NsdServiceInfo resolved) {
                                if (resolved.getHost() != null) androidTvServices.put(resolved.getServiceName(), resolved);
                            }
                        });
                    }
                }
                @Override public void onServiceLost(NsdServiceInfo serviceInfo) { androidTvServices.remove(serviceInfo.getServiceName()); }
            };
            try {
                nsdManager.discoverServices("_androidtvremote2._tcp", NsdManager.PROTOCOL_DNS_SD, discoveryListener);
                return true;
            } catch (Exception e) {
                discoveryListener = null;
                return false;
            }
        }

        @JavascriptInterface
        public synchronized void stopAndroidTvDiscovery() {
            if (nsdManager != null && discoveryListener != null) {
                try { nsdManager.stopServiceDiscovery(discoveryListener); } catch (Exception ignored) {}
                discoveryListener = null;
            }
        }

        @JavascriptInterface
        public String getAndroidTvDiscoveredDevices() {
            StringBuilder json = new StringBuilder("[");
            boolean first = true;
            for (NsdServiceInfo info : androidTvServices.values()) {
                if (info.getHost() == null) continue;
                if (!first) json.append(',');
                first = false;
                String name = info.getServiceName() == null ? "Android TV" : info.getServiceName();
                String host = info.getHost().getHostAddress();
                json.append("{\"name\":\"").append(jsonEscape(name))
                    .append("\",\"host\":\"").append(jsonEscape(host))
                    .append("\",\"port\":").append(info.getPort())
                    .append('}');
            }
            return json.append(']').toString();
        }

        private static String jsonEscape(String value) {
            return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
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
        public boolean isAndroidTv() {
            try {
                UiModeManager uiModeManager = (UiModeManager) context.getSystemService(Context.UI_MODE_SERVICE);
                return uiModeManager != null &&
                    (uiModeManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION);
            } catch (Exception e) {
                return false;
            }
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
