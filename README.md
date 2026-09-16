# Universal Smart TV Remote (`Remote-appp`)

A complete, production-ready, multi-protocol Smart TV remote control platform and Android application supporting Android TV/Google TV, Samsung Tizen, LG webOS, Roku, Sony BRAVIA, Philips, Panasonic, Apple TV, Vizio SmartCast, and Optical Consumer IR (38kHz).

---

## 📱 Android APK Release System

The repository features an automated, production-ready CI/CD release system powered by **GitHub Actions**.

### Pipeline Architecture:

```
Git Tag (v*) / Manual Dispatch
       ↓
GitHub Actions Runner (Ubuntu)
       ↓
JDK 21 + Android SDK Setup
       ↓
npm ci → npm run lint → npm test → npm run build
       ↓
Capacitor Native Sync (npx cap sync android)
       ↓
Gradle Build (assembleRelease with Keystore or Unsigned fallback)
       ↓
APK Verification (Integrity + Size + SHA-256 Checksum)
       ↓
Create GitHub Release + Attach Binary (Remote-appp-vX.Y.Z.apk + SHA256SUMS.txt)
       ↓
Web App "Download App" Modal pulls live release via /api/releases/latest
       ↓
End-user downloads verified APK
```

---

## 🚀 How to Create a Release

### Method 1: Git Release Tag (Recommended)

1. Ensure all code changes and tests pass locally:
   ```bash
   npm test
   npm run build
   ```
2. Create and push a semver tag prefixed with `v`:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions will automatically:
   - Build web assets and sync to native Android.
   - Run Gradle `assembleRelease`.
   - Verify archive integrity and compute SHA-256 checksums.
   - Publish a new **GitHub Release** titled `Remote-appp v1.0.0` with `Remote-appp-v1.0.0.apk` attached.

### Method 2: GitHub Actions Manual Dispatch

1. Navigate to the **Actions** tab on GitHub.
2. Select **Android APK Release**.
3. Click **Run workflow**, choose `release` (or `debug`), and optionally toggle `create_release: true`.

---

## 🔐 Keystore Release Signing Configuration

For official production release signing, configure the following secrets in your GitHub repository (**Settings → Secrets and variables → Actions**):

| Secret Name | Description |
| :--- | :--- |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.keystore` or `.jks` file (`base64 -w 0 release.keystore`) |
| `ANDROID_KEYSTORE_PASSWORD` | Password for the release keystore |
| `ANDROID_KEY_ALIAS` | Key alias name inside the keystore |
| `ANDROID_KEY_PASSWORD` | Password for the specific key alias |

> **Safe Fallback**: If these secrets are not configured, the CI workflow builds an **Unsigned Release** (`Remote-appp-vX.Y.Z-unsigned.apk`) so tests and development builds never fail. Keystores and private keys are never committed to version control.

---

## 🔢 Versioning Rule

Version numbers are strictly synchronized across all platform components:

- **Package Version:** `package.json` (e.g., `"version": "1.0.0"`)
- **Git Tag:** `v1.0.0`
- **Android `versionName`:** `1.0.0`
- **Android `versionCode`:** Deterministic integer calculated as:
  $$\text{versionCode} = (\text{Major} \times 1,000,000) + (\text{Minor} \times 10,000) + (\text{Patch} \times 100)$$
  *Example:* `v1.2.3` $\rightarrow$ `versionCode = 1020300`
- **APK Filename:** `Remote-appp-v1.0.0.apk` (or `Remote-appp-v1.0.0-unsigned.apk`)

---

## 📥 Installation Instructions for Android Users

1. Open the web app and tap **Download App** in the top navigation bar or tool menu.
2. Download `Remote-appp-v1.0.0.apk` directly to your Android device.
3. Open the downloaded APK from your notifications or file manager.
4. If prompted with *"Install unknown apps"*, toggle **"Allow from this source"**.
5. Tap **Install** to complete installation.
6. Connect your phone to your home Wi-Fi network and launch **Universal Smart TV Remote**.

---

## 🛠️ Local Development & Build Commands

```bash
# Install dependencies
npm install

# Run automated tests
npm test

# Lint codebase
npm run lint

# Build web distribution bundle
npm run build

# Build local Android APK (requires local Android SDK & JDK 17/21)
./build-apk.sh release
```

---

## 🌐 Supported Smart TV Protocols

| Platform | Protocol / Transport | Discovery | Pairing Method |
| :--- | :--- | :--- | :--- |
| **Android TV / Google TV** | Remote Service v2 (TLS Port 6467) | mDNS (`_androidtvremote2._tcp`) | 6-digit cryptographic PIN / TLS Cert |
| **Samsung Tizen** | SmartView WebSocket (Ports 8001/8002) | SSDP (`urn:samsung.com:device:RemoteControlReceiver:1`) | On-screen Token Authorization |
| **LG webOS** | SSAP WebSocket (Port 3000 / 3001) | SSDP (`urn:schemas-upnp-org:device:MediaRenderer:1`) | Client-key Pairing Request Prompt |
| **Roku TV / Streaming** | ECP REST API (Port 8060) | SSDP (`roku:ecp`) | Zero-config Instant Binding |
| **Sony BRAVIA** | IRCC REST JSON-RPC (Port 80/443) | SSDP (`urn:schemas-sony-com:service:IRCC:1`) | Pre-Shared Key (PSK) or PIN |
| **Consumer IR** | 38kHz NEC / RC5 / RC6 / Sony Pulse Train | Hardware Emitter | Hardware Optical Transmitter |
| **TV Receiver Mode** | 10-Foot Big Screen Web Receiver | QR Code & PIN | Instant QR Code Sync |
