package com.universal.smarttv.remote;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class LocalRemoteReceiver {
    public interface CommandListener {
        void onCommand(String command, String value);
    }

    private static final int PORT = 8765;
    private final CommandListener listener;
    private final SecureRandom random = new SecureRandom();
    private final ExecutorService pool = Executors.newCachedThreadPool();
    private volatile boolean running = false;
    private volatile ServerSocket serverSocket;
    private volatile String pairingPin;
    private volatile String sessionToken;

    public LocalRemoteReceiver(CommandListener listener) {
        this.listener = listener;
        rotateCredentials();
    }

    private void rotateCredentials() {
        pairingPin = String.format(Locale.US, "%06d", random.nextInt(1_000_000));
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(64);
        for (byte b : bytes) {
            sb.append(String.format(Locale.US, "%02x", b & 0xff));
        }
        sessionToken = sb.toString();
    }

    public synchronized boolean start() {
        if (running) return true;
        try {
            serverSocket = new ServerSocket(PORT, 20, InetAddress.getByName("0.0.0.0"));
            running = true;
            pool.execute(() -> {
                while (running) {
                    try {
                        Socket socket = serverSocket.accept();
                        if (!isAllowedLanPeer(socket.getInetAddress())) {
                            try { socket.close(); } catch (Exception ignored) {}
                            continue;
                        }
                        pool.execute(() -> handle(socket));
                    } catch (IOException ignored) {
                        if (running) {
                            // The receiver can be restarted explicitly if the socket fails.
                        }
                    }
                }
            });
            return true;
        } catch (IOException e) {
            running = false;
            return false;
        }
    }

    public synchronized void stop() {
        running = false;
        try { if (serverSocket != null) serverSocket.close(); } catch (Exception ignored) {}
        serverSocket = null;
    }

    public boolean isRunning() { return running; }
    public int getPort() { return PORT; }
    public String getPairingPin() { return pairingPin; }

    public synchronized void regeneratePin() {
        rotateCredentials();
    }

    private void handle(Socket socket) {
        try (Socket s = socket;
             InputStream in = s.getInputStream();
             OutputStream out = s.getOutputStream()) {
            s.setSoTimeout(5000);
            BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
            String requestLine = reader.readLine();
            if (requestLine == null) return;

            String[] parts = requestLine.split(" ");
            if (parts.length < 2) {
                write(out, 400, "{\"error\":\"bad_request\"}");
                return;
            }

            String method = parts[0];
            String path = parts[1];
            int contentLength = 0;
            String auth = "";

            String line;
            while ((line = reader.readLine()) != null && !line.isEmpty()) {
                int colon = line.indexOf(':');
                if (colon <= 0) continue;
                String key = line.substring(0, colon).trim().toLowerCase(Locale.US);
                String value = line.substring(colon + 1).trim();
                if ("content-length".equals(key)) {
                    try { contentLength = Integer.parseInt(value); } catch (Exception ignored) {}
                } else if ("authorization".equals(key)) {
                    auth = value;
                }
            }

            if (contentLength < 0 || contentLength > 16384) {
                write(out, 413, "{\"error\":\"payload_too_large\"}");
                return;
            }

            char[] bodyChars = new char[contentLength];
            int read = 0;
            while (read < contentLength) {
                int n = reader.read(bodyChars, read, contentLength - read);
                if (n < 0) break;
                read += n;
            }
            String body = new String(bodyChars, 0, read);

            if ("GET".equalsIgnoreCase(method) && "/ping".equals(path)) {
                write(out, 200, "{\"ok\":true,\"service\":\"UniversalSmartTVRemote\",\"version\":\"1\"}");
                return;
            }

            if ("POST".equalsIgnoreCase(method) && "/pair".equals(path)) {
                String pin = jsonString(body, "pin");
                if (pin != null && pin.equals(pairingPin)) {
                    write(out, 200, "{\"ok\":true,\"token\":\"" + jsonEscape(sessionToken) + "\"}");
                } else {
                    write(out, 401, "{\"ok\":false,\"error\":\"INVALID_PAIRING_PIN\"}");
                }
                return;
            }

            if ("POST".equalsIgnoreCase(method) && "/command".equals(path)) {
                if (!("Bearer " + sessionToken).equals(auth)) {
                    write(out, 401, "{\"ok\":false,\"error\":\"UNAUTHORIZED\"}");
                    return;
                }

                String command = jsonString(body, "command");
                String value = jsonRaw(body, "value");
                if (command == null || command.length() > 80) {
                    write(out, 400, "{\"ok\":false,\"error\":\"INVALID_COMMAND\"}");
                    return;
                }

                if (listener != null) listener.onCommand(command, value);
                write(out, 200, "{\"ok\":true,\"command\":\"" + jsonEscape(command) + "\"}");
                return;
            }

            write(out, 404, "{\"error\":\"not_found\"}");
        } catch (Exception ignored) {
            // A disconnected LAN peer must not crash the receiver.
        }
    }

    private static boolean isAllowedLanPeer(InetAddress address) {
        if (address == null || address.isLoopback() || address.isAnyLocalAddress() || address.isLinkLocalAddress()) {
            return false;
        }
        if (address instanceof Inet4Address) {
            byte[] b = address.getAddress();
            int a = b[0] & 0xff;
            int second = b[1] & 0xff;
            return a == 10 ||
                   (a == 172 && second >= 16 && second <= 31) ||
                   (a == 192 && second == 168);
        }
        return false;
    }

    private static String jsonString(String json, String key) {
        String raw = jsonRaw(json, key);
        if (raw == null || raw.length() < 2 || raw.charAt(0) != '"' || raw.charAt(raw.length() - 1) != '"') {
            return null;
        }
        String value = raw.substring(1, raw.length() - 1);
        return value.replace("\\", "\u0000").replace("\"", "\u0001").replace("\u0000", "\\").replace("\u0001", "\"");
    }

    private static String jsonRaw(String json, String key) {
        if (json == null || key == null) return null;
        String needle = "\"" + key + "\"";
        int p = json.indexOf(needle);
        if (p < 0) return null;
        p = json.indexOf(':', p + needle.length());
        if (p < 0) return null;
        p++;
        while (p < json.length() && Character.isWhitespace(json.charAt(p))) p++;
        if (p >= json.length()) return null;

        if (json.charAt(p) == '"') {
            int end = p + 1;
            boolean escaped = false;
            while (end < json.length()) {
                char c = json.charAt(end);
                if (c == '"' && !escaped) return json.substring(p, end + 1);
                if (c == '\\' && !escaped) escaped = true;
                else escaped = false;
                end++;
            }
            return null;
        }

        int end = p;
        while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
        return json.substring(p, end).trim();
    }

    private static String jsonEscape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static void write(OutputStream out, int status, String body) throws IOException {
        byte[] data = body.getBytes(StandardCharsets.UTF_8);
        String statusText;
        switch (status) {
            case 200: statusText = "OK"; break;
            case 400: statusText = "Bad Request"; break;
            case 401: statusText = "Unauthorized"; break;
            case 404: statusText = "Not Found"; break;
            case 413: statusText = "Payload Too Large"; break;
            default: statusText = "Error";
        }
        String headers = "HTTP/1.1 " + status + " " + statusText + "\r\n" +
                "Content-Type: application/json; charset=utf-8\r\n" +
                "Content-Length: " + data.length + "\r\n" +
                "Connection: close\r\n\r\n";
        out.write(headers.getBytes(StandardCharsets.UTF_8));
        out.write(data);
        out.flush();
    }
}
