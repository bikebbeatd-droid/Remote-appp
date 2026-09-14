/**
 * Deep-Researched Platform Protocol Specifications & Documentation
 * 
 * Defines official discovery protocols, handshake methods, network transports,
 * supported/unsupported capability breakdowns, TV settings requirements,
 * and mobile OS permission models for each supported Smart TV ecosystem.
 */

export interface PlatformProtocolDoc {
  id: string;
  name: string;
  vendor: string;
  marketShare: string;
  summary: string;
  discoveryMethod: {
    protocol: string;
    targetService: string;
    ports: number[];
    multicastAddress?: string;
    details: string;
  };
  pairingAuthMethod: {
    type: "PIN_CHALLENGE" | "POPUP_CONFIRM" | "OPEN_ECP" | "PSK_SECRET" | "RSA_TLS";
    handshakeDescription: string;
    tokenLifetime: string;
    storageMethod: string;
  };
  supportedFeatures: {
    power: { supported: boolean; method: string; notes?: string };
    navigation: { supported: boolean; method: string; notes?: string };
    volume: { supported: boolean; method: string; notes?: string };
    media: { supported: boolean; method: string; notes?: string };
    keyboard: { supported: boolean; method: string; notes?: string };
    touchpad: { supported: boolean; method: string; notes?: string };
    apps: { supported: boolean; method: string; notes?: string };
    input: { supported: boolean; method: string; notes?: string };
    voice: { supported: boolean; method: string; notes?: string };
    channels: { supported: boolean; method: string; notes?: string };
  };
  requiredTvSettings: Array<{ setting: string; path: string; mandatory: boolean; description: string }>;
  requiredPhonePermissions: Array<{ permission: string; reason: string }>;
  unsupportedFeatures: Array<{ feature: string; technicalReason: string }>;
  protocolEndpoints: Array<{ name: string; urlOrPort: string; description: string }>;
}

export const PLATFORM_SPECS: Record<string, PlatformProtocolDoc> = {
  android_tv: {
    id: "android_tv",
    name: "Android TV & Google TV",
    vendor: "Google / Sony / TCL / Philips / Hisense",
    marketShare: "Top 1 Global TV OS",
    summary: "Secured TLS/Protobuf Android TV Remote Protocol v2 utilizing mDNS discovery with 6-digit cryptographic PIN authentication and bidirectional state synchronization.",
    discoveryMethod: {
      protocol: "mDNS / DNS-SD (Bonjour / Zeroconf)",
      targetService: "_androidtvremote2._tcp.local / _googlecast._tcp.local",
      ports: [6466, 6467, 8008, 8009],
      multicastAddress: "224.0.0.251:5353",
      details: "Discovered via ZeroConfig mDNS advertisement. Android TV advertises service name, model, device ID, and pairing certificate capabilities."
    },
    pairingAuthMethod: {
      type: "PIN_CHALLENGE",
      handshakeDescription: "Client initiates TLS session on port 6467 with self-signed X.509 client certificate. TV presents 6-digit alphanumeric PIN. Client hashes certificate public key and secret PIN to exchange AES-256 session token.",
      tokenLifetime: "Persistent until revoked from TV 'Connected Devices' settings.",
      storageMethod: "Secure Token Vault (Encrypted keystore / localStorage)"
    },
    supportedFeatures: {
      power: { supported: true, method: "Protobuf RemoteKeyCode.POWER or HDMI-CEC system standby" },
      navigation: { supported: true, method: "DPAD_UP, DPAD_DOWN, DPAD_LEFT, DPAD_RIGHT, DPAD_CENTER, BACK, HOME" },
      volume: { supported: true, method: "Protobuf VolumeDirection (UP, DOWN, MUTE) & absolute level synchronization" },
      media: { supported: true, method: "MEDIA_PLAY_PAUSE, MEDIA_STOP, MEDIA_NEXT, MEDIA_PREVIOUS, MEDIA_REWIND, MEDIA_FAST_FORWARD" },
      keyboard: { supported: true, method: "IME RemoteTextInputMessage - bidirectional focus & raw UTF-8 string injection" },
      touchpad: { supported: true, method: "RemotePointerEvent / Touchpad relative displacement coordinates (dx, dy)" },
      apps: { supported: true, method: "Android App URI intent dispatch (e.g. https://www.youtube.com/watch?v=... or package names)" },
      input: { supported: true, method: "TV Input Source Manager intents (HDMI1, HDMI2, Composite, Tuner)" },
      voice: { supported: true, method: "Raw 16kHz PCM audio stream over TLS port 6466 or Assistant voice intent dispatch" },
      channels: { supported: true, method: "CHANNEL_UP, CHANNEL_DOWN, direct KEYCODE_0-9 tuner dialing" }
    },
    requiredTvSettings: [
      { setting: "Network Remote Control", path: "Settings > Device Preferences > Remote & Accessories > Allow Remote App", mandatory: true, description: "Must allow local network controllers to connect." },
      { setting: "Network Standby / Wake on LAN", path: "Settings > Network & Internet > Remote Start / Network Standby", mandatory: false, description: "Required for powering ON when TV is in deep sleep." }
    ],
    requiredPhonePermissions: [
      { permission: "ACCESS_FINE_LOCATION / NEARBY_WIFI_DEVICES", reason: "Required on Android 12+ for local Wi-Fi mDNS discovery." },
      { permission: "RECORD_AUDIO", reason: "Required for live voice search and Google Assistant speech input." }
    ],
    unsupportedFeatures: [
      { feature: "Infrared legacy protocols", technicalReason: "Android TV Remote Protocol v2 is strictly Wi-Fi TCP/TLS. Physical IR requires dedicated IR blaster hardware." }
    ],
    protocolEndpoints: [
      { name: "Pairing Service", urlOrPort: "TCP 6467 (TLS)", description: "Handles certificate exchange, PIN challenge, and client registration." },
      { name: "Remote Control Service", urlOrPort: "TCP 6466 (TLS Protobuf)", description: "Transmits remote keycodes, IME text, pointer coordinates, and voice streams." },
      { name: "Cast V2 REST / WebSocket", urlOrPort: "TCP 8008 / 8009", description: "Google Cast receiver session management and app deep linking." }
    ]
  },

  tizen: {
    id: "tizen",
    name: "Samsung Smart TV (Tizen OS)",
    vendor: "Samsung Electronics",
    marketShare: "Top 2 Global TV OS",
    summary: "Samsung SmartView / Tizen Smart TV protocol over secure WebSocket (port 8001 / 8002) using Base64 application identification and on-screen permission prompts or cryptographic tokens.",
    discoveryMethod: {
      protocol: "SSDP (UPnP) / mDNS",
      targetService: "urn:samsung.com:device:RemoteControlReceiver:1 / _smartview._tcp.local",
      ports: [8001, 8002, 7676, 9197],
      multicastAddress: "239.255.255.250:1900",
      details: "Broadcasts UPnP M-SEARCH for Samsung RemoteControlReceiver service, exposing REST device-info API at http://<ip>:8001/api/v2/."
    },
    pairingAuthMethod: {
      type: "POPUP_CONFIRM",
      handshakeDescription: "Mobile app opens WSS connection to wss://<ip>:8002/api/v2/channels/samsung.remote.control?name=<Base64AppName>&token=<Token>. TV displays on-screen 'Allow/Deny' modal; user accepts using physical remote. TV returns token parameter.",
      tokenLifetime: "Permanent per client device ID until removed in TV General > External Device Manager.",
      storageMethod: "TokenVault with device ID association."
    },
    supportedFeatures: {
      power: { supported: true, method: "KEY_POWER (Toggle) or Wake-on-LAN (WoL) Magic Packet for Power ON" },
      navigation: { supported: true, method: "KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_ENTER, KEY_RETURN, KEY_HOME, KEY_MENU" },
      volume: { supported: true, method: "KEY_VOLUP, KEY_VOLDOWN, KEY_MUTE (Direct level via Tizen REST /api/v2/)" },
      media: { supported: true, method: "KEY_PLAY, KEY_PAUSE, KEY_STOP, KEY_REWIND, KEY_FF, KEY_PREV, KEY_NEXT" },
      keyboard: { supported: true, method: "Raw SendEvent with text parameter or individual KEY_0-9, KEY_BACKSPACE" },
      touchpad: { supported: true, method: "ms.channel.emit mouse move event with dx, dy and click (Supported on Tizen 3.0+)" },
      apps: { supported: true, method: "POST http://<ip>:8001/api/v2/applications/<appId> (e.g. 11101200001 for YouTube, 3201907018807 for Netflix)" },
      input: { supported: true, method: "KEY_SOURCE, KEY_HDMI1, KEY_HDMI2, KEY_HDMI3, KEY_COMPONENT" },
      voice: { supported: false, method: "None", notes: "Samsung does NOT expose remote microphone audio injection to 3rd-party Wi-Fi apps." },
      channels: { supported: true, method: "KEY_CHUP, KEY_CHDOWN, KEY_CH_LIST, direct 0-9 dialing" }
    },
    requiredTvSettings: [
      { setting: "Access Notification", path: "Settings > General > External Device Manager > Device Connection Manager > Access Notification", mandatory: true, description: "Set to 'First Time Only' so mobile pairing prompt appears." },
      { setting: "IP Remote", path: "Settings > General > Network > Expert Settings > IP Remote", mandatory: true, description: "Must be enabled to allow network commands." },
      { setting: "Power On with Mobile", path: "Settings > General > Network > Expert Settings > Power On with Mobile", mandatory: false, description: "Required for Wake-on-LAN power on support." }
    ],
    requiredPhonePermissions: [
      { permission: "ACCESS_NETWORK_STATE / CHANGE_WIFI_MULTICAST_STATE", reason: "Required for SSDP UPnP multicast discovery on port 1900." }
    ],
    unsupportedFeatures: [
      { feature: "Live Remote Voice Query", technicalReason: "Samsung Bixby voice channel is proprietary to physical Bluetooth Smart Remotes and not accessible via WebSocket control API." }
    ],
    protocolEndpoints: [
      { name: "Tizen REST Info API", urlOrPort: "http://<ip>:8001/api/v2/", description: "Returns TV model, name, OS version, Wi-Fi MAC, and power state." },
      { name: "SmartView WebSocket", urlOrPort: "wss://<ip>:8002/api/v2/channels/samsung.remote.control", description: "Encrypted remote keypress, mouse movement, and app launch channel." }
    ]
  },

  webos: {
    id: "webos",
    name: "LG Smart TV (webOS)",
    vendor: "LG Electronics",
    marketShare: "Top 3 Global TV OS",
    summary: "LG Second Screen Access Protocol (SSAP) WebSocket API (port 3000 / 3001) using cryptographic client-key handshake, toast notifications, pointer socket, and URI launcher.",
    discoveryMethod: {
      protocol: "SSDP (UPnP) / mDNS",
      targetService: "urn:schemas-upnp-org:device:MediaRenderer:1 / _webos._tcp.local",
      ports: [3000, 3001, 1073],
      multicastAddress: "239.255.255.250:1900",
      details: "Discovered via SSDP M-SEARCH for LG webOS services; XML device description contains UUID and webOS version."
    },
    pairingAuthMethod: {
      type: "PIN_CHALLENGE",
      handshakeDescription: "App sends registration payload type 'register' requesting permissions (CONTROL_INPUT, READ_RUNNING_APPS, WRITE_SETTINGS). TV shows prompt on screen or 4-digit code. TV issues permanent client-key.",
      tokenLifetime: "Permanent per client-key until revoked in TV Mobile TV On settings.",
      storageMethod: "TokenVault storage indexed by TV MAC address."
    },
    supportedFeatures: {
      power: { supported: true, method: "ssap://system/turnOff & Wake-on-LAN Magic Packet for turnOn" },
      navigation: { supported: true, method: "ssap://system.launcher/open or pointer socket (UP, DOWN, LEFT, RIGHT, ENTER, BACK, HOME)" },
      volume: { supported: true, method: "ssap://audio/setVolume (0-100), ssap://audio/volumeUp, ssap://audio/volumeDown, ssap://audio/setMute" },
      media: { supported: true, method: "ssap://media.controls/play, ssap://media.controls/pause, ssap://media.controls/stop, ssap://media.controls/rewind, ssap://media.controls/fastForward" },
      keyboard: { supported: true, method: "ssap://com.webos.service.ime/insertText, deleteCharacters, sendEnter" },
      touchpad: { supported: true, method: "LG Magic Remote Pointer Socket (ws://<ip>:3000/pointer) with move(dx, dy) and click(1)" },
      apps: { supported: true, method: "ssap://system.launcher/launch with id: youtube.leanback.v4, netflix, amazon, etc." },
      input: { supported: true, method: "ssap://tv/switchInput with inputId (HDMI_1, HDMI_2, HDMI_3, COMPONENT)" },
      voice: { supported: true, method: "ssap://voice/search or webOS voice assistant query intent" },
      channels: { supported: true, method: "ssap://tv/channelUp, ssap://tv/channelDown, ssap://tv/openChannel with channelId" }
    },
    requiredTvSettings: [
      { setting: "LG Connect Apps", path: "Settings > Network > LG Connect Apps", mandatory: true, description: "Must be enabled to allow network remote app control." },
      { setting: "Mobile TV On", path: "Settings > General > Mobile TV On > Turn On via Wi-Fi", mandatory: false, description: "Required for Wake-on-LAN remote powering." }
    ],
    requiredPhonePermissions: [
      { permission: "ACCESS_NETWORK_STATE", reason: "Required for SSDP discovery and WebSocket session transport." }
    ],
    unsupportedFeatures: [
      { feature: "Direct HDMI Audio Switching without ARC", technicalReason: "Audio output route is restricted to TV audio profile endpoints." }
    ],
    protocolEndpoints: [
      { name: "SSAP WebSocket Endpoint", urlOrPort: "wss://<ip>:3001", description: "Secure WebSocket handling all commands, subscriptions, and notifications." },
      { name: "Pointer Mouse Stream", urlOrPort: "ws://<ip>:3000/pointer", description: "Low-latency binary packet socket for Magic Remote pointer motion." }
    ]
  },

  roku: {
    id: "roku",
    name: "Roku OS (Streaming Stick, Ultra & Roku TVs)",
    vendor: "Roku Inc. / TCL / Hisense / Sharp / RCA",
    marketShare: "Top 1 North America TV OS",
    summary: "Roku External Control Protocol (ECP) over HTTP REST on port 8060 with instant SSDP discovery, low-latency keypress endpoints, XML device querying, and app launching.",
    discoveryMethod: {
      protocol: "SSDP (UPnP M-SEARCH)",
      targetService: "roku:ecp",
      ports: [8060],
      multicastAddress: "239.255.255.250:1900",
      details: "Client sends M-SEARCH query with ST: roku:ecp. Roku responds with USN, serial number, and LOCATION header pointing to http://<ip>:8060/."
    },
    pairingAuthMethod: {
      type: "OPEN_ECP",
      handshakeDescription: "Roku ECP is authentication-free by default on local subnet. Requires TV setting 'Control by mobile apps' set to 'Default' or 'Permissive'.",
      tokenLifetime: "No token required; verified via device-info endpoint.",
      storageMethod: "No credential storage required."
    },
    supportedFeatures: {
      power: { supported: true, method: "POST /keypress/Power or /keypress/PowerOn, /keypress/PowerOff" },
      navigation: { supported: true, method: "POST /keypress/Home, /keypress/Back, /keypress/Up, /keypress/Down, /keypress/Left, /keypress/Right, /keypress/Select, /keypress/Info" },
      volume: { supported: true, method: "POST /keypress/VolumeUp, /keypress/VolumeDown, /keypress/VolumeMute (Requires Roku TV or Soundbar CEC)" },
      media: { supported: true, method: "POST /keypress/Play, /keypress/Rev, /keypress/Fwd, /keypress/InstantReplay" },
      keyboard: { supported: true, method: "POST /keypress/Lit_<URL_ENCODED_CHAR>, POST /keypress/Backspace, POST /keypress/Enter" },
      touchpad: { supported: false, method: "None", notes: "Roku OS UI is strictly grid-focused and does NOT support mouse pointer coordinates." },
      apps: { supported: true, method: "POST /launch/<appId> (e.g. /launch/837 for YouTube, /launch/12 for Netflix, /launch/13 for Prime)" },
      input: { supported: true, method: "POST /keypress/InputTuner, /keypress/InputHDMI1, /keypress/InputHDMI2, /keypress/InputHDMI3 (Roku TV models only)" },
      voice: { supported: true, method: "POST /search/browse?keyword=<query> or voice search endpoint where supported" },
      channels: { supported: true, method: "POST /keypress/ChannelUp, /keypress/ChannelDown" }
    },
    requiredTvSettings: [
      { setting: "Control by mobile apps", path: "Settings > System > Advanced system settings > Control by mobile apps", mandatory: true, description: "Must be set to 'Default' or 'Permissive'. If set to 'Disabled', all ECP commands will be rejected." },
      { setting: "Fast TV Start", path: "Settings > System > Power > Fast TV start", mandatory: false, description: "Must be enabled for Roku to respond to PowerOn while in standby." }
    ],
    requiredPhonePermissions: [
      { permission: "ACCESS_NETWORK_STATE / CHANGE_WIFI_MULTICAST_STATE", reason: "Required for SSDP M-SEARCH discovery." }
    ],
    unsupportedFeatures: [
      { feature: "Mouse / Pointer navigation", technicalReason: "Roku OS has no cursor rendering engine; UI operates solely on focusable grid items." },
      { feature: "Bluetooth Audio Sniffing", technicalReason: "Private Listening requires Roku proprietary audio streaming protocol with Opus compression." }
    ],
    protocolEndpoints: [
      { name: "Device Info Query", urlOrPort: "GET http://<ip>:8060/query/device-info", description: "Returns model, serial, power mode, and support-remote-control status." },
      { name: "Installed Apps Query", urlOrPort: "GET http://<ip>:8060/query/apps", description: "Returns list of installed channel IDs, app icons, and names." },
      { name: "Keypress Dispatch", urlOrPort: "POST http://<ip>:8060/keypress/<key>", description: "Executes instantaneous button press event." }
    ]
  },

  fire_tv: {
    id: "fire_tv",
    name: "Amazon Fire TV & Fire Stick",
    vendor: "Amazon",
    marketShare: "Top 4 Global TV OS",
    summary: "Amazon Whisperplay, DIAL protocol, and ADB (Android Debug Bridge) over Wi-Fi TCP port 5555 for low-latency keyevent execution and deep link intents.",
    discoveryMethod: {
      protocol: "SSDP / mDNS / DIAL",
      targetService: "_amzn-wplay._tcp.local / urn:dial-multiscreen-org:service:dial:1",
      ports: [5555, 8008, 8009],
      multicastAddress: "239.255.255.250:1900",
      details: "Discovered via Whisperplay mDNS or DIAL SSDP; exposes ADB daemon over port 5555 when ADB debugging is active."
    },
    pairingAuthMethod: {
      type: "RSA_TLS",
      handshakeDescription: "When connecting via ADB or Whisperplay, TV displays RSA key fingerprint prompt 'Allow USB/Network debugging?'. User clicks Always Allow. Auth token is saved.",
      tokenLifetime: "Permanent per RSA public key fingerprint.",
      storageMethod: "Cryptographic RSA keypair in application storage."
    },
    supportedFeatures: {
      power: { supported: true, method: "input keyevent 26 (KEYCODE_POWER) or SLEEP" },
      navigation: { supported: true, method: "input keyevent 19 (UP), 20 (DOWN), 21 (LEFT), 22 (RIGHT), 23 (CENTER), 4 (BACK), 3 (HOME), 82 (MENU)" },
      volume: { supported: true, method: "input keyevent 24 (VOLUME_UP), 25 (VOLUME_DOWN), 164 (VOLUME_MUTE)" },
      media: { supported: true, method: "input keyevent 85 (PLAY_PAUSE), 86 (STOP), 87 (NEXT), 88 (PREV), 89 (REW), 90 (FF)" },
      keyboard: { supported: true, method: "input text '<string>' or IME broadcast" },
      touchpad: { supported: false, method: "None", notes: "Fire OS launcher does not provide active cursor overlay by default." },
      apps: { supported: true, method: "am start -a android.intent.action.VIEW -d <URI> or package launch intent" },
      input: { supported: true, method: "input keyevent 178 (TV_INPUT) on Fire TV Edition sets" },
      voice: { supported: false, method: "None", notes: "Alexa Voice remote requires Amazon proprietary encrypted BLE microphone channel." },
      channels: { supported: true, method: "input keyevent 166 (CHANNEL_UP), 167 (CHANNEL_DOWN)" }
    },
    requiredTvSettings: [
      { setting: "ADB Debugging", path: "Settings > My Fire TV > Developer Options > ADB Debugging", mandatory: true, description: "Must be toggled ON to accept remote network commands." },
      { setting: "Apps from Unknown Sources", path: "Settings > My Fire TV > Developer Options > Install unknown apps", mandatory: false, description: "Optional for custom companion installation." }
    ],
    requiredPhonePermissions: [
      { permission: "INTERNET / ACCESS_WIFI_STATE", reason: "Direct TCP socket to Fire TV IP port 5555." }
    ],
    unsupportedFeatures: [
      { feature: "Live Alexa Microphone Injection", technicalReason: "Amazon Alexa voice pipe is restricted to authorized hardware remotes with proprietary encryption." }
    ],
    protocolEndpoints: [
      { name: "ADB Daemon Socket", urlOrPort: "TCP 5555", description: "Direct shell command and keyevent dispatcher." },
      { name: "DIAL Multi-screen API", urlOrPort: "http://<ip>:8008/apps/", description: "REST endpoint for launching YouTube and Netflix." }
    ]
  },

  sony_bravia: {
    id: "sony_bravia",
    name: "Sony Bravia Smart TV (Android/Google TV with IRCC REST)",
    vendor: "Sony Corporation",
    marketShare: "Premium Tier Global TV",
    summary: "Sony Bravia IRCC-IP (Infra-Red Compatible Control over IP) REST API with Pre-Shared Key (PSK) or PIN challenge, combined with Android TV Remote protocol.",
    discoveryMethod: {
      protocol: "SSDP / mDNS",
      targetService: "urn:schemas-sony-com:service:IRCC:1 / _androidtvremote2._tcp.local",
      ports: [80, 20060, 6466],
      multicastAddress: "239.255.255.250:1900",
      details: "Discovered via Sony IRCC UPnP description at http://<ip>/sony/webapi/ssdp/dd.xml."
    },
    pairingAuthMethod: {
      type: "PSK_SECRET",
      handshakeDescription: "Allows either a Pre-Shared Key (PSK) configured in TV settings (e.g. '0000' or custom key) transmitted via 'X-Auth-PSK' HTTP header, or cookie-based PIN authentication via /sony/accessControl.",
      tokenLifetime: "Indefinite while PSK matches TV configuration.",
      storageMethod: "Secure Token Vault (PSK header)."
    },
    supportedFeatures: {
      power: { supported: true, method: "IRCC code AAAAAQAAAAEAAAAVAw== (TvPower) or REST /sony/system" },
      navigation: { supported: true, method: "IRCC codes for Up, Down, Left, Right, Confirm, Home, Return, Options" },
      volume: { supported: true, method: "REST /sony/audio setAudioVolume or IRCC VolumeUp, VolumeDown, Mute" },
      media: { supported: true, method: "IRCC codes for Play, Pause, Stop, Rewind, Forward, Prev, Next" },
      keyboard: { supported: true, method: "REST /sony/system setText or Android TV IME channel" },
      touchpad: { supported: true, method: "Supported when operating via Android TV TLS Remote port 6466" },
      apps: { supported: true, method: "REST /sony/appControl getApplicationList & setActiveApp" },
      input: { supported: true, method: "REST /sony/avContent setPlayContent with extInput:hdmi?port=1" },
      voice: { supported: true, method: "Google Assistant voice stream via Android TV port 6466" },
      channels: { supported: true, method: "IRCC Num0-Num9, ChannelUp, ChannelDown" }
    },
    requiredTvSettings: [
      { setting: "Pre-Shared Key (PSK)", path: "Settings > Network > Home Network Setup > IP Control > Pre-Shared Key", mandatory: true, description: "Set a 4+ digit PSK passcode for instant authorization." },
      { setting: "Remote Device / Renderer", path: "Settings > Network > Home Network Setup > Remote Device/Renderer", mandatory: true, description: "Must be enabled to accept network control packets." }
    ],
    requiredPhonePermissions: [
      { permission: "ACCESS_NETWORK_STATE", reason: "Required for HTTP REST communication." }
    ],
    unsupportedFeatures: [
      { feature: "Analog tuner direct RF tuning without channel map", technicalReason: "Requires active digital channel lineup scanning." }
    ],
    protocolEndpoints: [
      { name: "Sony IRCC-IP Service", urlOrPort: "http://<ip>/sony/ircc", description: "SOAP / REST command endpoint for XML IRCC code execution." },
      { name: "Sony System API", urlOrPort: "http://<ip>/sony/system", description: "REST endpoint for power status, remote controller info, and network settings." }
    ]
  }
};
