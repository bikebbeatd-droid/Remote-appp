# AGENTS.md

## IMPORTANT — TERMUX LOCAL BACKEND

The application may use a Termux local backend running on the Android phone.

127.0.0.1 / localhost may be used ONLY for communication between the mobile app and the local Termux backend.

Never interpret 127.0.0.1 as the Smart TV's IP address.

### Architecture:

```
Mobile App
    ↓
Termux Local API (127.0.0.1:<PORT>)
    ↓
Discovery / Adapter / Transport Layer
    ↓
Actual TV IP or discovered TV service
    ↓
Smart TV
```

The TV must be discovered independently using real network discovery, mDNS/NSD, supported protocols, or manually supplied address where appropriate.

Display the actual TV name/platform and real connection state in the UI.

### Example UI Display:

```
Google TV (Living Room)
ANDROID_TV • 192.168.1.25
● Connected
```

**NOT:**

```
Google TV (Living Room)
ANDROID_TV • 127.0.0.1
```

*(unless the actual TV service genuinely runs on localhost).*

Termux localhost is the backend endpoint, not the TV endpoint.
