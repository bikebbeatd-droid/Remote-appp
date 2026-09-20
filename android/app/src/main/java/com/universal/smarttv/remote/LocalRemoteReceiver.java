package com.universal.smarttv.remote;

import android.content.Context;
import android.os.Environment;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class LocalRemoteReceiver {
    public interface CommandListener {
        void onCommand(String command, String value);
    }

    private static final int PORT = 8765;
    private static final long MAX_FILE_BYTES = 50L * 1024L * 1024L;
    private final CommandListener listener;
    private final SecureRandom random = new SecureRandom();
    private final ExecutorService pool = Executors.newCachedThreadPool();
    private final File filesDir;
    private volatile boolean running = false;
    private volatile ServerSocket serverSocket;
    private volatile String pairingPin;
    private volatile String sessionToken;

    public LocalRemoteReceiver(Context context, CommandListener listener) {
        this.listener = listener;
        File base = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        filesDir = new File(base != null ? base : context.getFilesDir(), "remote-share");
        if (!filesDir.exists()) filesDir.mkdirs();
        rotateCredentials();
    }

    private void rotateCredentials() {
        pairingPin = String.format(Locale.US, "%06d", random.nextInt(1_000_000));
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(64);
        for (byte b : bytes) sb.append(String.format(Locale.US, "%02x", b & 0xff));
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
                        final Socket socket = serverSocket.accept();
                        pool.execute(() -> handle(socket));
                    } catch (IOException ignored) {
                        if (!running) break;
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
    public synchronized void regeneratePin() { rotateCredentials(); }

    private void handle(Socket socket) {
        try (Socket s = socket;
             InputStream in = s.getInputStream();
             OutputStream out = s.getOutputStream()) {
            s.setSoTimeout(15000);
            BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.ISO_8859_1));
            String requestLine = reader.readLine();
            if (requestLine == null) return;
            String[] parts = requestLine.split(" ");
            if (parts.length < 2) { write(out, 400, "{"error":"bad_request"}", null); return; }
            String method = parts[0];
            String path = parts[1];

            int contentLength = 0;
            String auth = "";
            String fileName = "received-" + System.currentTimeMillis();
            String contentType = "application/octet-stream";
            String line;
            while ((line = reader.readLine()) != null && !line.isEmpty()) {
                int colon = line.indexOf(':');
                if (colon <= 0) continue;
                String key = line.substring(0, colon).trim().toLowerCase(Locale.US);
                String value = line.substring(colon + 1).trim();
                if ("content-length".equals(key)) {
                    try { contentLength = Integer.parseInt(value); } catch (Exception ignored) { contentLength = -1; }
                } else if ("authorization".equals(key)) {
                    auth = value;
                } else if ("x-file-name".equals(key)) {
                    fileName = sanitizeFileName(value);
                } else if ("content-type".equals(key)) {
                    contentType = value;
                }
            }

            if ("OPTIONS".equalsIgnoreCase(method)) {
                write(out, 204, "", null);
                return;
            }

            if (contentLength < 0 || contentLength > MAX_FILE_BYTES) {
                write(out, 413, "{"error":"payload_too_large"}", null);
                return;
            }

            if ("/ping".equals(path) && "GET".equalsIgnoreCase(method)) {
                write(out, 200, "{"ok":true,"service":"UniversalSmartTVRemote","version":"2","fileTransfer":true}", null);
                return;
            }

            if ("/pair".equals(path) && "POST".equalsIgnoreCase(method)) {
                String body = readTextBody(in, contentLength);
                String pin = jsonString(body, "pin");
                if (pin != null && pin.equals(pairingPin)) {
                    write(out, 200, "{"ok":true,"token":"" + sessionToken + ""}", null);
                } else {
                    write(out, 401, "{"ok":false,"error":"INVALID_PAIRING_PIN"}", null);
                }
                return;
            }

            if (!("/command".equals(path)) && (path.equals("/files") || path.startsWith("/file/"))) {
                if (!("Bearer " + sessionToken).equals(auth)) {
                    write(out, 401, "{"ok":false,"error":"UNAUTHORIZED"}", null);
                    return;
                }
                if ("GET".equalsIgnoreCase(method) && "/files".equals(path)) {
                    write(out, 200, listFilesJson(), null);
                    return;
                }
                if ("POST".equalsIgnoreCase(method) && "/file".equals(path)) {
                    File target = uniqueTarget(fileName);
                    try (OutputStream fileOut = new BufferedOutputStream(new FileOutputStream(target))) {
                        copyExactly(in, fileOut, contentLength);
                    }
                    String response = "{"ok":true,"id":"" + jsonEscape(target.getName()) + "","name":"" +
                            jsonEscape(fileName) + "","size":" + target.length() + ","contentType":"" +
                            jsonEscape(contentType) + ""}";
                    write(out, 200, response, null);
                    return;
                }
                if ("GET".equalsIgnoreCase(method) && path.startsWith("/file/")) {
                    String id = URLDecoder.decode(path.substring("/file/".length()), StandardCharsets.UTF_8.name());
                    File target = safeFile(id);
                    if (target == null || !target.isFile()) {
                        write(out, 404, "{"error":"not_found"}", null);
                        return;
                    }
                    streamFile(out, target);
                    return;
                }
                if ("DELETE".equalsIgnoreCase(method) && path.startsWith("/file/")) {
                    String id = URLDecoder.decode(path.substring("/file/".length()), StandardCharsets.UTF_8.name());
                    File target = safeFile(id);
                    boolean deleted = target != null && target.isFile() && target.delete();
                    write(out, deleted ? 200 : 404, deleted ? "{"ok":true}" : "{"ok":false,"error":"not_found"}", null);
                    return;
                }
            }

            if ("/command".equals(path) && "POST".equalsIgnoreCase(method)) {
                String body = readTextBody(in, contentLength);
                if (!("Bearer " + sessionToken).equals(auth)) {
                    write(out, 401, "{"ok":false,"error":"UNAUTHORIZED"}", null);
                    return;
                }
                String command = jsonString(body, "command");
                String value = jsonRaw(body, "value");
                if (command == null || command.length() > 80) {
                    write(out, 400, "{"ok":false,"error":"INVALID_COMMAND"}", null);
                    return;
                }
                if (listener != null) listener.onCommand(command, value);
                write(out, 200, "{"ok":true,"command":"" + jsonEscape(command) + ""}", null);
                return;
            }

            write(out, 404, "{"error":"not_found"}", null);
        } catch (Exception ignored) {
        }
    }

    private String listFilesJson() {
        File[] files = filesDir.listFiles(File::isFile);
        StringBuilder json = new StringBuilder("[");
        if (files != null) {
            Arrays.sort(files, Comparator.comparingLong(File::lastModified).reversed());
            boolean first = true;
            for (File f : files) {
                if (!first) json.append(',');
                first = false;
                json.append("{"id":""").append(jsonEscape(f.getName()))
                    .append("","name":""").append(jsonEscape(f.getName()))
                    .append("","size":").append(f.length())
                    .append(","modified":").append(f.lastModified()).append('}');
            }
        }
        return json.append(']').toString();
    }

    private File uniqueTarget(String requested) {
        String safe = sanitizeFileName(requested);
        File target = new File(filesDir, safe);
        int n = 1;
        String base = safe;
        String ext = "";
        int dot = safe.lastIndexOf('.');
        if (dot > 0) { base = safe.substring(0, dot); ext = safe.substring(dot); }
        while (target.exists()) target = new File(filesDir, base + " (" + n++ + ")" + ext);
        return target;
    }

    private File safeFile(String id) throws IOException {
        File target = new File(filesDir, sanitizeFileName(id));
        String root = filesDir.getCanonicalPath() + File.separator;
        String path = target.getCanonicalPath();
        return path.startsWith(root) ? target : null;
    }

    private static String sanitizeFileName(String name) {
        if (name == null || name.trim().isEmpty()) return "received-file";
        String s = name.replace("\\", "_").replace("/", "_").replace(":", "_").trim();
        if (s.equals(".") || s.equals("..")) return "received-file";
        return s.length() > 180 ? s.substring(0, 180) : s;
    }

    private static String readTextBody(InputStream in, int length) throws IOException {
        byte[] data = readBytes(in, length);
        return new String(data, StandardCharsets.UTF_8);
    }

    private static byte[] readBytes(InputStream in, int length) throws IOException {
        if (length <= 0) return new byte[0];
        ByteArrayOutputStream out = new ByteArrayOutputStream(Math.min(length, 16384));
        byte[] buf = new byte[8192];
        int remaining = length;
        while (remaining > 0) {
            int n = in.read(buf, 0, Math.min(buf.length, remaining));
            if (n < 0) throw new EOFException();
            out.write(buf, 0, n);
            remaining -= n;
        }
        return out.toByteArray();
    }

    private static void copyExactly(InputStream in, OutputStream out, int length) throws IOException {
        byte[] buf = new byte[8192];
        int remaining = length;
        while (remaining > 0) {
            int n = in.read(buf, 0, Math.min(buf.length, remaining));
            if (n < 0) throw new EOFException();
            out.write(buf, 0, n);
            remaining -= n;
        }
        out.flush();
    }

    private static void streamFile(OutputStream out, File file) throws IOException {
        long len = file.length();
        String headers = "HTTP/1.1 200 OK\r\n" +
                "Content-Type: application/octet-stream\r\n" +
                "Content-Length: " + len + "\r\n" +
                "Content-Disposition: attachment; filename=\"" + jsonEscape(file.getName()) + "\"\r\n" +
                "Access-Control-Allow-Origin: *\r\n" +
                "Connection: close\r\n\r\n";
        out.write(headers.getBytes(StandardCharsets.UTF_8));
        try (InputStream in = new BufferedInputStream(new FileInputStream(file))) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
        }
        out.flush();
    }

    private static String jsonString(String json, String key) {
        String raw = jsonRaw(json, key);
        if (raw == null || raw.length() < 2 || raw.charAt(0) != '"' || raw.charAt(raw.length() - 1) != '"') return null;
        return raw.substring(1, raw.length() - 1).replace("\\", "\").replace("\"", """);
    }

    private static String jsonRaw(String json, String key) {
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
        return s.replace("\\", "\\\\").replace(""", "\\"");
    }

    private static void write(OutputStream out, int status, String body, String contentType) throws IOException {
        byte[] data = body.getBytes(StandardCharsets.UTF_8);
        String type = contentType == null ? "application/json; charset=utf-8" : contentType;
        String statusText = status == 200 ? "OK" : status == 204 ? "No Content" : status == 400 ? "Bad Request" :
                status == 401 ? "Unauthorized" : status == 404 ? "Not Found" : "Payload Too Large";
        String headers = "HTTP/1.1 " + status + " " + statusText + "\r\n" +
                "Content-Type: " + type + "\r\n" +
                "Content-Length: " + data.length + "\r\n" +
                "Access-Control-Allow-Origin: *\r\n" +
                "Access-Control-Allow-Headers: Authorization, Content-Type, X-File-Name\r\n" +
                "Access-Control-Allow-Methods: GET,POST,DELETE,OPTIONS\r\n" +
                "Connection: close\r\n\r\n";
        out.write(headers.getBytes(StandardCharsets.UTF_8));
        out.write(data);
        out.flush();
    }
}
