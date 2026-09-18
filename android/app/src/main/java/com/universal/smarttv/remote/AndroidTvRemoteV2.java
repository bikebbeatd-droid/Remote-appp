package com.universal.smarttv.remote;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.Security;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.concurrent.ConcurrentHashMap;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

public final class AndroidTvRemoteV2 {
    private static final int PAIR_PORT = 6467;
    private static final int REMOTE_PORT = 6466;
    private static final int TIMEOUT_MS = 7000;
    private static final String PREFS = "android_tv_remote_v2";
    private static final String KEY_KEY = "client_key";
    private static final String KEY_CERT = "client_cert";

    private final Context context;
    private final SharedPreferences prefs;
    private final ConcurrentHashMap<String, SSLSocket> sessions = new ConcurrentHashMap<>();

    public AndroidTvRemoteV2(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = this.context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    public boolean ping(String ip, int port) {
        if (!validIp(ip)) return false;
        int p = port == PAIR_PORT || port == REMOTE_PORT ? port : PAIR_PORT;
        try {
            if (p == REMOTE_PORT) {
                SSLSocket s = openTls(ip, REMOTE_PORT);
                s.setSoTimeout(TIMEOUT_MS);
                s.close();
                return true;
            }
            Socket s = new Socket();
            s.connect(new InetSocketAddress(ip, PAIR_PORT), TIMEOUT_MS);
            s.close();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public synchronized String pair(String ip, String pin, String clientName) {
        if (!validIp(ip)) return json(false, "Invalid IPv4 address.");
        String normalized = pin == null ? "" : pin.trim().toUpperCase();
        if (!normalized.matches("[0-9A-F]{6}")) {
            return json(false, "Pairing PIN must be 6 hexadecimal characters.");
        }
        try {
            Identity identity = loadOrCreateIdentity();
            SSLSocket socket = openTlsWithIdentity(ip, PAIR_PORT, identity);
            socket.setSoTimeout(TIMEOUT_MS);

            writeFrame(socket, pairingRequest(clientName));
            boolean sentSecret = false;
            while (true) {
                byte[] payload = readFrame(socket);
                if (payload == null) throw new Exception("TV closed pairing connection.");
                int nested = findPairingField(payload);
                if (nested == 11) {
                    writeFrame(socket, pairingOption());
                } else if (nested == 20) {
                    writeFrame(socket, pairingConfiguration());
                } else if (nested == 31) {
                    byte[] secret = computePairingSecret(identity, socket, normalized);
                    writeFrame(socket, pairingSecret(secret));
                    sentSecret = true;
                } else if (nested == 41) {
                    socket.close();
                    return json(true, "Paired successfully.");
                } else if (sentSecret) {
                    socket.close();
                    return json(false, "TV rejected the pairing secret.");
                }
            }
        } catch (Exception e) {
            return json(false, safeMessage(e));
        }
    }

    public boolean sendKey(String ip, int keyCode, String direction) {
        if (!validIp(ip)) return false;
        try {
            SSLSocket socket = getSession(ip);
            writeFrame(socket, remoteKey(keyCode, direction));
            return true;
        } catch (Exception e) {
            closeSession(ip);
            return false;
        }
    }

    public boolean launchApp(String ip, String appLink) {
        if (!validIp(ip) || appLink == null || appLink.trim().isEmpty()) return false;
        try {
            SSLSocket socket = getSession(ip);
            writeFrame(socket, remoteAppLink(appLink));
            return true;
        } catch (Exception e) {
            closeSession(ip);
            return false;
        }
    }

    public boolean sendText(String ip, String text) {
        // IME injection needs the TV's current RemoteImeKeyInject state. Do not
        // pretend arbitrary text is supported until that state machine is wired.
        return false;
    }

    private SSLSocket getSession(String ip) throws Exception {
        SSLSocket existing = sessions.get(ip);
        if (existing != null && existing.isConnected() && !existing.isClosed()) return existing;
        Identity identity = loadOrCreateIdentity();
        SSLSocket socket = openTlsWithIdentity(ip, REMOTE_PORT, identity);
        socket.setSoTimeout(12000);
        sessions.put(ip, socket);
        Thread reader = new Thread(() -> remoteReader(ip, socket), "android-tv-remote-" + ip);
        reader.setDaemon(true);
        reader.start();
        return socket;
    }

    private void remoteReader(String ip, SSLSocket socket) {
        try {
            while (!socket.isClosed()) {
                byte[] payload = readFrame(socket);
                if (payload == null) break;
                int field = firstField(payload);
                if (field == 1) {
                    writeFrame(socket, remoteConfigure());
                } else if (field == 2) {
                    writeFrame(socket, remoteSetActive(622));
                } else if (field == 8) {
                    int value = firstVarintFromNested(payload, 8, 1);
                    writeFrame(socket, remotePingResponse(value));
                }
            }
        } catch (Exception ignored) {
        } finally {
            closeSession(ip);
        }
    }

    private void closeSession(String ip) {
        SSLSocket s = sessions.remove(ip);
        if (s != null) {
            try { s.close(); } catch (Exception ignored) {}
        }
    }

    private Identity loadOrCreateIdentity() throws Exception {
        String keyB64 = prefs.getString(KEY_KEY, null);
        String certB64 = prefs.getString(KEY_CERT, null);
        if (keyB64 != null && certB64 != null) {
            byte[] keyBytes = Base64.decode(keyB64, Base64.NO_WRAP);
            byte[] certBytes = Base64.decode(certB64, Base64.NO_WRAP);
            PrivateKey key = KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
            X509Certificate cert = (X509Certificate) CertificateFactory.getInstance("X.509")
                    .generateCertificate(new ByteArrayInputStream(certBytes));
            return new Identity(key, cert);
        }

        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048, new java.security.SecureRandom());
        KeyPair kp = generator.generateKeyPair();

        long now = System.currentTimeMillis();
        X500Name name = new X500Name("CN=Universal Smart TV Remote");
        X509v3CertificateBuilder builder = new JcaX509v3CertificateBuilder(
                name,
                java.math.BigInteger.valueOf(now),
                new java.util.Date(now - 60000L),
                new java.util.Date(now + 3650L * 24L * 60L * 60L * 1000L),
                name,
                kp.getPublic()
        );
        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .build(kp.getPrivate());
        X509CertificateHolder holder = builder.build(signer);
        X509Certificate cert = new JcaX509CertificateConverter()
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .getCertificate(holder);
        cert.checkValidity();
        cert.verify(kp.getPublic());

        prefs.edit()
                .putString(KEY_KEY, Base64.encodeToString(kp.getPrivate().getEncoded(), Base64.NO_WRAP))
                .putString(KEY_CERT, Base64.encodeToString(cert.getEncoded(), Base64.NO_WRAP))
                .apply();
        return new Identity(kp.getPrivate(), cert);
    }

    private SSLSocket openTls(String ip, int port) throws Exception {
        return openTlsWithIdentity(ip, port, loadOrCreateIdentity());
    }

    private SSLSocket openTlsWithIdentity(String ip, int port, Identity identity) throws Exception {
        KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        java.security.KeyStore ks = java.security.KeyStore.getInstance("PKCS12");
        ks.load(null, null);
        ks.setKeyEntry("client", identity.key, new char[0], new java.security.cert.Certificate[]{identity.cert});
        kmf.init(ks, new char[0]);

        TrustManager[] trust = new TrustManager[]{new X509TrustManager() {
            public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
            public void checkClientTrusted(X509Certificate[] c, String a) {}
            public void checkServerTrusted(X509Certificate[] c, String a) {}
        }};
        SSLContext ctx = SSLContext.getInstance("TLS");
        ctx.init(kmf.getKeyManagers(), trust, new java.security.SecureRandom());

        SSLSocket socket = (SSLSocket) ctx.getSocketFactory().createSocket();
        socket.setEnabledProtocols(new String[]{"TLSv1.3", "TLSv1.2"});
        socket.connect(new InetSocketAddress(ip, port), TIMEOUT_MS);
        socket.startHandshake();
        return socket;
    }

    private byte[] computePairingSecret(Identity identity, SSLSocket socket, String pin) throws Exception {
        X509Certificate server = (X509Certificate) socket.getSession().getPeerCertificates()[0];
        RSAPublicKey clientKey = (RSAPublicKey) identity.cert.getPublicKey();
        RSAPublicKey serverKey = (RSAPublicKey) server.getPublicKey();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        writeUnsigned(out, clientKey.getModulus());
        writeUnsigned(out, clientKey.getPublicExponent());
        writeUnsigned(out, serverKey.getModulus());
        writeUnsigned(out, serverKey.getPublicExponent());
        byte[] pinBytes = hexToBytes(pin.substring(2));
        out.write(pinBytes);

        byte[] hash = MessageDigest.getInstance("SHA-256").digest(out.toByteArray());
        byte[] fullPin = hexToBytes(pin);
        if ((hash[0] & 0xff) != (fullPin[0] & 0xff)) {
            throw new Exception("Pairing PIN is incorrect.");
        }
        return hash;
    }

    private static void writeUnsigned(ByteArrayOutputStream out, java.math.BigInteger n) {
        byte[] b = n.toByteArray();
        int start = (b.length > 1 && b[0] == 0) ? 1 : 0;
        out.write(b, start, b.length - start);
    }

    private static byte[] pairingRequest(String clientName) {
        byte[] request = concat(fieldString(1, "androidtv-remote"), fieldString(2,
                clientName == null || clientName.isEmpty() ? "Universal Smart TV Remote" : clientName));
        return concat(varint((2 << 3) | 2), varint(request.length), request,
                fieldVarint(2, 200), fieldVarint(1, 2));
    }

    private static byte[] pairingOption() {
        byte[] enc = concat(fieldVarint(1, 3), fieldVarint(2, 6));
        byte[] option = concat(fieldBytes(1, enc), fieldVarint(3, 1));
        return concat(fieldBytes(20, option), fieldVarint(2, 200), fieldVarint(1, 2));
    }

    private static byte[] pairingConfiguration() {
        byte[] enc = concat(fieldVarint(1, 3), fieldVarint(2, 6));
        byte[] cfg = concat(fieldBytes(1, enc), fieldVarint(2, 1));
        return concat(fieldBytes(30, cfg), fieldVarint(2, 200), fieldVarint(1, 2));
    }

    private static byte[] pairingSecret(byte[] secret) {
        return concat(fieldBytes(40, fieldBytes(1, secret)), fieldVarint(2, 200), fieldVarint(1, 2));
    }

    private static byte[] remoteConfigure() {
        byte[] info = concat(
                fieldString(1, "Universal Smart TV Remote"),
                fieldString(2, "Universal"),
                fieldVarint(3, 1),
                fieldString(4, "1"),
                fieldString(5, "com.universal.smarttv.remote"),
                fieldString(6, "1.0.0")
        );
        byte[] cfg = concat(fieldVarint(1, 622), fieldBytes(2, info));
        return fieldBytes(1, cfg);
    }

    private static byte[] remoteSetActive(int active) {
        return fieldBytes(2, fieldVarint(1, active));
    }

    private static byte[] remotePingResponse(int val) {
        return fieldBytes(9, fieldVarint(1, val));
    }

    private static byte[] remoteKey(int keyCode, String direction) {
        int d = "START_LONG".equalsIgnoreCase(direction) ? 1 :
                "END_LONG".equalsIgnoreCase(direction) ? 2 : 3;
        byte[] key = concat(fieldVarint(1, keyCode), fieldVarint(2, d));
        return fieldBytes(10, key);
    }

    private static byte[] remoteAppLink(String link) {
        return fieldBytes(90, fieldString(1, link));
    }

    private static int findPairingField(byte[] payload) {
        return firstField(payload);
    }

    private static int firstField(byte[] payload) {
        if (payload == null || payload.length == 0) return -1;
        int[] pos = new int[]{0};
        long tag = readVarint(payload, pos);
        return (int)(tag >>> 3);
    }

    private static int firstVarintFromNested(byte[] payload, int outerField, int innerField) {
        try {
            int[] pos = new int[]{0};
            long tag = readVarint(payload, pos);
            if ((tag >>> 3) != outerField) return 1;
            int len = (int)readVarint(payload, pos);
            byte[] nested = new byte[len];
            System.arraycopy(payload, pos[0], nested, 0, len);
            int[] p = new int[]{0};
            long inner = readVarint(nested, p);
            if ((inner >>> 3) != innerField) return 1;
            return (int)readVarint(nested, p);
        } catch (Exception e) {
            return 1;
        }
    }

    private static byte[] readFrame(SSLSocket socket) throws Exception {
        int length = readVarint(socket);
        if (length < 0 || length > 1024 * 1024) throw new Exception("Invalid protobuf frame length.");
        byte[] payload = new byte[length];
        int off = 0;
        while (off < length) {
            int n = socket.getInputStream().read(payload, off, length - off);
            if (n < 0) return null;
            off += n;
        }
        return payload;
    }

    private static int readVarint(Socket socket) throws Exception {
        long result = 0;
        int shift = 0;
        while (shift < 35) {
            int b = socket.getInputStream().read();
            if (b < 0) return -1;
            result |= (long)(b & 0x7f) << shift;
            if ((b & 0x80) == 0) return (int)result;
            shift += 7;
        }
        throw new Exception("Invalid varint.");
    }

    private static long readVarint(byte[] data, int[] pos) {
        long result = 0;
        int shift = 0;
        while (pos[0] < data.length && shift < 64) {
            int b = data[pos[0]++] & 0xff;
            result |= (long)(b & 0x7f) << shift;
            if ((b & 0x80) == 0) return result;
            shift += 7;
        }
        return 0;
    }

    private static void writeFrame(SSLSocket socket, byte[] payload) throws Exception {
        byte[] len = varint(payload.length);
        socket.getOutputStream().write(len);
        socket.getOutputStream().write(payload);
        socket.getOutputStream().flush();
    }

    private static byte[] fieldVarint(int field, long value) {
        return concat(varint((field << 3)), varint(value));
    }

    private static byte[] fieldString(int field, String value) {
        return fieldBytes(field, value.getBytes(StandardCharsets.UTF_8));
    }

    private static byte[] fieldBytes(int field, byte[] value) {
        return concat(varint((field << 3) | 2), varint(value.length), value);
    }

    private static byte[] varint(long value) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        long v = value;
        while ((v & ~0x7FL) != 0) {
            out.write((int)((v & 0x7F) | 0x80));
            v >>>= 7;
        }
        out.write((int)v);
        return out.toByteArray();
    }

    private static byte[] concat(byte[]... parts) {
        int total = 0;
        for (byte[] p : parts) total += p.length;
        byte[] out = new byte[total];
        int pos = 0;
        for (byte[] p : parts) {
            System.arraycopy(p, 0, out, pos, p.length);
            pos += p.length;
        }
        return out;
    }

    private static byte[] hexToBytes(String hex) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (int i = 0; i + 1 < hex.length(); i += 2) {
            out.write(Integer.parseInt(hex.substring(i, i + 2), 16));
        }
        return out.toByteArray();
    }

    private static boolean validIp(String ip) {
        if (ip == null || !ip.matches("(\\d{1,3}\\.){3}\\d{1,3}")) return false;
        String[] parts = ip.split("\\.");
        for (String p : parts) {
            int n;
            try { n = Integer.parseInt(p); } catch (Exception e) { return false; }
            if (n < 0 || n > 255) return false;
        }
        return true;
    }

    private static String json(boolean success, String message) {
        String m = message == null ? "" : message.replace("\\", "\\\\").replace("\"", "\\\"");
        return "{\"success\":" + (success ? "true" : "false") + ",\"message\":\"" + m + "\"}";
    }

    private static String safeMessage(Exception e) {
        String m = e.getMessage();
        return m == null || m.isEmpty() ? e.getClass().getSimpleName() : m;
    }

    private static final class Identity {
        final PrivateKey key;
        final X509Certificate cert;
        Identity(PrivateKey key, X509Certificate cert) {
            this.key = key;
            this.cert = cert;
        }
    }
}
