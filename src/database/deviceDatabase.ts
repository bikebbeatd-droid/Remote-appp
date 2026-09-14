import { DeviceProfile, GlobalSearchFilter } from "./types";

export const GLOBAL_DEVICE_DATABASE: DeviceProfile[] = [
  // ==========================================
  // SAMSUNG (TIZEN OS)
  // ==========================================
  {
    id: "samsung_neo_qled_qn90c",
    brand: "Samsung",
    series: "Neo QLED 4K",
    model: "QN90C / QN95C",
    yearRange: "2023 - 2024",
    category: "tv",
    platform: "tizen",
    protocol: "samsung_smartview_ws",
    defaultPort: 8002,
    discoveryMethod: "SSDP / mDNS (_samsungmsf._tcp)",
    pairingMethod: "POPUP_CONFIRM",
    authDescription: "On-screen authorization popup or Token challenge on port 8002 (WSS with TLS certificate verification).",
    verified: true,
    supportedInputSources: ["HDMI 1 (eARC)", "HDMI 2", "HDMI 3", "HDMI 4", "Live TV", "Ambient Mode"],
    supportedAppDeepLinks: [
      { id: "netflix", name: "Netflix", appCode: "3201907018807" },
      { id: "youtube", name: "YouTube", appCode: "111299001912" },
      { id: "prime", name: "Prime Video", appCode: "3201512006785" },
      { id: "disney", name: "Disney+", appCode: "3201901017640" },
      { id: "apple_tv", name: "Apple TV", appCode: "3201807016597" },
      { id: "spotify", name: "Spotify", appCode: "3201606009684" }
    ],
    irCodeSetId: "ir_samsung_tv_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED", // Voice microphone streaming is restricted to proprietary Samsung Smart Control remote
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    },
    tvSettingsRequired: ["General > External Device Manager > Device Connect Manager > Access Notification: First Time Only", "Power and Energy Saving > Standby Wake on Wireless LAN: ON"],
    phonePermissionsRequired: ["Local Network / Wi-Fi Multicast Access"]
  },
  {
    id: "samsung_oled_s95c",
    brand: "Samsung",
    series: "OLED Flagship",
    model: "S95C / S90C",
    yearRange: "2023 - 2024",
    category: "tv",
    platform: "tizen",
    protocol: "samsung_smartview_ws",
    defaultPort: 8002,
    discoveryMethod: "SSDP / mDNS (_samsungmsf._tcp)",
    pairingMethod: "POPUP_CONFIRM",
    authDescription: "WSS token handshake on port 8002 with on-screen Allow prompt.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3 (eARC)", "HDMI 4", "TV Tuner"],
    supportedAppDeepLinks: [
      { id: "netflix", name: "Netflix", appCode: "3201907018807" },
      { id: "youtube", name: "YouTube", appCode: "111299001912" },
      { id: "hulu", name: "Hulu", appCode: "3201601007250" },
      { id: "max", name: "Max", appCode: "3202302029431" }
    ],
    irCodeSetId: "ir_samsung_tv_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "samsung_frame_ls03b",
    brand: "Samsung",
    series: "The Frame Lifestyle TV",
    model: "LS03B / LS03C",
    yearRange: "2022 - 2024",
    category: "tv",
    platform: "tizen",
    protocol: "samsung_smartview_ws",
    defaultPort: 8002,
    discoveryMethod: "SSDP / mDNS",
    pairingMethod: "POPUP_CONFIRM",
    authDescription: "WSS port 8002 token storage.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3 (eARC)", "HDMI 4", "Art Mode"],
    supportedAppDeepLinks: [
      { id: "art_store", name: "Samsung Art Store", appCode: "3201710015037" },
      { id: "youtube", name: "YouTube", appCode: "111299001912" },
      { id: "netflix", name: "Netflix", appCode: "3201907018807" }
    ],
    irCodeSetId: "ir_samsung_tv_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "samsung_crystal_uhd_cu8000",
    brand: "Samsung",
    series: "Crystal UHD 4K",
    model: "CU8000 / AU8000 / TU8000",
    yearRange: "2020 - 2023",
    category: "tv",
    platform: "tizen",
    protocol: "samsung_smartview_ws",
    defaultPort: 8002,
    discoveryMethod: "SSDP / mDNS",
    pairingMethod: "POPUP_CONFIRM",
    authDescription: "SmartView WebSocket channel.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3", "TV"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "111299001912" },
      { id: "netflix", name: "Netflix", appCode: "3201907018807" }
    ],
    irCodeSetId: "ir_samsung_tv_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  },

  // ==========================================
  // LG (webOS)
  // ==========================================
  {
    id: "lg_oled_g3_c3",
    brand: "LG",
    series: "OLED evo",
    model: "G3 / C3 / B3 (webOS 23)",
    yearRange: "2023 - 2024",
    category: "tv",
    platform: "webos",
    protocol: "lg_ssap_ws",
    defaultPort: 3001,
    discoveryMethod: "SSDP (urn:lge-com:service:webos-second-screen:1) / mDNS",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Secure SSAP WebSocket with on-screen Prompt or 8-digit PIN registration.",
    verified: true,
    supportedInputSources: ["HDMI_1", "HDMI_2", "HDMI_3", "HDMI_4", "Live TV", "AirPlay / Screen Share"],
    supportedAppDeepLinks: [
      { id: "netflix", name: "Netflix", appCode: "netflix" },
      { id: "youtube", name: "YouTube", appCode: "youtube.leanback.v4" },
      { id: "prime", name: "Prime Video", appCode: "amazon" },
      { id: "disney", name: "Disney+", appCode: "com.disney.disneyplus-prod" },
      { id: "apple_tv", name: "Apple TV", appCode: "com.apple.appletv" }
    ],
    irCodeSetId: "ir_lg_tv_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED", // LG Magic Remote pointer protocol
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    },
    tvSettingsRequired: ["General > Devices > External Devices > Connect to LG ThinQ / Mobile TV ON", "General > Network > LG Connected Apps: ON"]
  },
  {
    id: "lg_oled_c2_c1_cx",
    brand: "LG",
    series: "OLED Cinema 4K",
    model: "C2 / C1 / CX (webOS 6.0 / 5.0)",
    yearRange: "2020 - 2022",
    category: "tv",
    platform: "webos",
    protocol: "lg_ssap_ws",
    defaultPort: 3000,
    discoveryMethod: "SSDP / mDNS",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "SSAP protocol over WS port 3000 / WSS port 3001.",
    verified: true,
    supportedInputSources: ["HDMI_1", "HDMI_2", "HDMI_3", "HDMI_4", "Live TV"],
    supportedAppDeepLinks: [
      { id: "netflix", name: "Netflix", appCode: "netflix" },
      { id: "youtube", name: "YouTube", appCode: "youtube.leanback.v4" },
      { id: "disney", name: "Disney+", appCode: "com.disney.disneyplus-prod" }
    ],
    irCodeSetId: "ir_lg_tv_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "lg_qned_nanocell",
    brand: "LG",
    series: "QNED / NanoCell 4K",
    model: "QNED85 / NanoCell 90 / UR9000",
    yearRange: "2021 - 2024",
    category: "tv",
    platform: "webos",
    protocol: "lg_ssap_ws",
    defaultPort: 3001,
    discoveryMethod: "SSDP / mDNS",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "SSAP handshake.",
    verified: true,
    supportedInputSources: ["HDMI_1", "HDMI_2", "HDMI_3", "Live TV"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "youtube.leanback.v4" },
      { id: "netflix", name: "Netflix", appCode: "netflix" }
    ],
    irCodeSetId: "ir_lg_tv_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  },

  // ==========================================
  // SONY (BRAVIA IRCC / ANDROID TV)
  // ==========================================
  {
    id: "sony_bravia_xr_a95l",
    brand: "Sony",
    series: "Bravia XR QD-OLED Master",
    model: "A95L / A80L / X90L",
    yearRange: "2023 - 2024",
    category: "tv",
    platform: "sony_bravia",
    protocol: "sony_ircc_rest",
    defaultPort: 80,
    discoveryMethod: "mDNS (_androidtvremote2._tcp / _sony_bravia._tcp) / SSDP",
    pairingMethod: "PSK_SECRET",
    authDescription: "Pre-Shared Key (X-Auth-PSK) configured in TV Network Settings or TLS PIN challenge.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3 (eARC)", "HDMI 4", "TV Tuner", "Composite"],
    supportedAppDeepLinks: [
      { id: "netflix", name: "Netflix", appCode: "com.netflix.ninja" },
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" },
      { id: "prime", name: "Prime Video", appCode: "com.amazon.amazonvideo.livingroom" },
      { id: "bravia_core", name: "Sony Pictures Core", appCode: "com.sony.dtv.braviacore" }
    ],
    irCodeSetId: "ir_sony_tv_sirc",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    },
    tvSettingsRequired: ["Settings > Network & Internet > Remote device settings > Pre-Shared Key: Set PSK", "Settings > Network & Internet > Remote start: ON"]
  },
  {
    id: "sony_bravia_x900h_x85k",
    brand: "Sony",
    series: "Bravia 4K HDR",
    model: "X900H / X85K / X80K",
    yearRange: "2020 - 2022",
    category: "tv",
    platform: "sony_bravia",
    protocol: "sony_ircc_rest",
    defaultPort: 80,
    discoveryMethod: "SSDP / mDNS",
    pairingMethod: "PSK_SECRET",
    authDescription: "Sony REST IRCC-IP service.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3", "HDMI 4", "TV"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" },
      { id: "netflix", name: "Netflix", appCode: "com.netflix.ninja" }
    ],
    irCodeSetId: "ir_sony_tv_sirc",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  },

  // ==========================================
  // GOOGLE TV & ANDROID TV ECOSYSTEM
  // (Chromecast, Xiaomi, OnePlus, Realme, Skyworth, Haier, Vu, TCL, Hisense, etc.)
  // ==========================================
  {
    id: "chromecast_google_tv_4k",
    brand: "Google",
    series: "Chromecast",
    model: "Chromecast with Google TV (4K & HD)",
    yearRange: "2020 - 2024",
    category: "streaming_stick",
    platform: "google_tv",
    protocol: "android_tv_v2",
    defaultPort: 6467,
    discoveryMethod: "mDNS (_androidtvremote2._tcp.local.)",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "TLS certificate exchange with 6-digit on-screen cryptographic alphanumeric PIN pairing (Protobuf v2 over port 6466/6467).",
    verified: true,
    supportedInputSources: ["Home Dashboard", "Google Play Movies & TV", "Live Tab"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" },
      { id: "netflix", name: "Netflix", appCode: "com.netflix.ninja" },
      { id: "prime", name: "Prime Video", appCode: "com.amazon.amazonvideo.livingroom" },
      { id: "disney", name: "Disney+", appCode: "com.disney.disneyplus" },
      { id: "spotify", name: "Spotify", appCode: "com.spotify.tv.android" },
      { id: "twitch", name: "Twitch", appCode: "tv.twitch.android.app" },
      { id: "plex", name: "Plex", appCode: "com.plexapp.android" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED", // Real bidirectional IME sync
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "UNSUPPORTED", // Chromecast is a dongle; volume/power pass via HDMI-CEC
      voice: "SUPPORTED",
      channels: "UNSUPPORTED",
      ir: "UNSUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    },
    tvSettingsRequired: ["Settings > System > Cast > Always allow remote control", "Network & Internet > Fast pair / Remote: Enabled"]
  },
  {
    id: "nvidia_shield_tv_pro",
    brand: "NVIDIA",
    series: "Shield TV",
    model: "Shield Android TV Pro / Tube",
    yearRange: "2019 - 2024",
    category: "streaming_box",
    platform: "android_tv",
    protocol: "android_tv_v2",
    defaultPort: 6467,
    discoveryMethod: "mDNS (_androidtvremote2._tcp)",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Android TV Remote Protocol v2 (TLS 6466/6467).",
    verified: true,
    supportedInputSources: ["Android TV Home", "GeForce NOW"],
    supportedAppDeepLinks: [
      { id: "geforce_now", name: "GeForce NOW", appCode: "com.nvidia.geforcenow" },
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" },
      { id: "plex", name: "Plex Media Server", appCode: "com.plexapp.android" },
      { id: "kodi", name: "Kodi", appCode: "org.xbmc.kodi" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "UNSUPPORTED",
      voice: "SUPPORTED",
      channels: "UNSUPPORTED",
      ir: "UNSUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "xiaomi_tv_mi_box",
    brand: "Xiaomi",
    series: "Mi TV / Xiaomi TV Box",
    model: "Xiaomi TV Q2 / Mi Box S 4K / PatchWall",
    yearRange: "2021 - 2024",
    category: "tv",
    platform: "android_tv",
    protocol: "android_tv_v2",
    defaultPort: 6467,
    discoveryMethod: "mDNS / SSDP",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Android TV Remote protocol v2 TLS PIN pairing.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3", "AV", "PatchWall Home"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" },
      { id: "netflix", name: "Netflix", appCode: "com.netflix.ninja" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "tcl_google_tv_qm8",
    brand: "TCL",
    series: "QD-Mini LED / Q Series",
    model: "QM8 / Q7 / C845 (Google TV)",
    yearRange: "2023 - 2024",
    category: "tv",
    platform: "google_tv",
    protocol: "android_tv_v2",
    defaultPort: 6467,
    discoveryMethod: "mDNS (_androidtvremote2._tcp)",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Standard Google TV v2 TLS pairing protocol.",
    verified: true,
    supportedInputSources: ["HDMI 1 (144Hz)", "HDMI 2 (120Hz)", "HDMI 3", "HDMI 4 (eARC)", "Antenna TV"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" },
      { id: "netflix", name: "Netflix", appCode: "com.netflix.ninja" },
      { id: "tcl_channel", name: "TCL Channel", appCode: "com.tcl.waterfall" }
    ],
    irCodeSetId: "ir_tcl_tv_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "hisense_google_tv_u8k",
    brand: "Hisense",
    series: "ULED Mini-LED",
    model: "U8K / U7K / U6K (Google TV)",
    yearRange: "2023 - 2024",
    category: "tv",
    platform: "google_tv",
    protocol: "android_tv_v2",
    defaultPort: 6467,
    discoveryMethod: "mDNS",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Android TV Remote v2 TLS PIN challenge.",
    verified: true,
    supportedInputSources: ["HDMI 1 (144Hz)", "HDMI 2", "HDMI 3 (eARC)", "HDMI 4", "Live TV"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" },
      { id: "netflix", name: "Netflix", appCode: "com.netflix.ninja" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "hisense_vidaa_u7h",
    brand: "Hisense",
    series: "VIDAA Smart TV",
    model: "U7H / A6G / A4G (VIDAA OS)",
    yearRange: "2021 - 2024",
    category: "tv",
    platform: "hisense_vidaa",
    protocol: "hisense_vidaa_ws",
    defaultPort: 5757,
    discoveryMethod: "SSDP / mDNS",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Hisense RemoteNOW WebSocket protocol on port 5757 with 4-digit TV PIN.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3", "TV"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "youtube" },
      { id: "netflix", name: "Netflix", appCode: "netflix" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "oneplus_tv_q1_pro",
    brand: "OnePlus",
    series: "QLED / U Series",
    model: "OnePlus TV Q1 Pro / U1S / Y1S",
    yearRange: "2020 - 2023",
    category: "tv",
    platform: "android_tv",
    protocol: "android_tv_v2",
    defaultPort: 6467,
    discoveryMethod: "mDNS",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Android TV Remote Protocol v2.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3", "OxygenPlay"],
    supportedAppDeepLinks: [
      { id: "oxygenplay", name: "OxygenPlay", appCode: "com.oneplus.tv.launcher" },
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "realme_smart_tv_4k",
    brand: "Realme",
    series: "Smart TV",
    model: "Realme Smart TV 4K 50\" / Neo",
    yearRange: "2021 - 2024",
    category: "tv",
    platform: "android_tv",
    protocol: "android_tv_v2",
    defaultPort: 6467,
    discoveryMethod: "mDNS",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Android TV Remote Protocol v2.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3", "AV", "Live TV"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" },
      { id: "netflix", name: "Netflix", appCode: "com.netflix.ninja" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "vu_cinema_tv_qled",
    brand: "Vu",
    series: "Masterpiece / Cinema TV",
    model: "Masterpiece QLED / GloLED 4K",
    yearRange: "2021 - 2024",
    category: "tv",
    platform: "google_tv",
    protocol: "android_tv_v2",
    defaultPort: 6467,
    discoveryMethod: "mDNS",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Google TV Remote v2.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3", "Antenna"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" },
      { id: "hotstar", name: "Disney+ Hotstar", appCode: "in.startv.hotstar.dplus" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "haier_skyworth_android_tv",
    brand: "Haier",
    series: "Smart AI TV",
    model: "K6600 / OLED C900 / Skyworth XC9000",
    yearRange: "2020 - 2024",
    category: "tv",
    platform: "android_tv",
    protocol: "android_tv_v2",
    defaultPort: 6467,
    discoveryMethod: "mDNS",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Android TV Remote v2 TLS PIN pairing.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3", "TV"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    }
  },

  // ==========================================
  // ROKU (ROKU OS & ROKU TVS)
  // ==========================================
  {
    id: "roku_ultra_streaming_stick",
    brand: "Roku",
    series: "Roku OS Streaming",
    model: "Roku Ultra / Streaming Stick 4K / Express 4K+",
    yearRange: "2020 - 2024",
    category: "streaming_box",
    platform: "roku",
    protocol: "roku_ecp",
    defaultPort: 8060,
    discoveryMethod: "SSDP (roku:ecp) / mDNS (_roku-ecp._tcp)",
    pairingMethod: "NONE",
    authDescription: "Standard open HTTP ECP REST API over port 8060. Requires 'Control by mobile apps: Default/Permissive' in Roku System Settings.",
    verified: true,
    supportedInputSources: ["Roku Home Screen", "The Roku Channel"],
    supportedAppDeepLinks: [
      { id: "netflix", name: "Netflix", appCode: "12" },
      { id: "youtube", name: "YouTube", appCode: "837" },
      { id: "prime", name: "Prime Video", appCode: "13" },
      { id: "hulu", name: "Hulu", appCode: "2285" },
      { id: "disney", name: "Disney+", appCode: "291097" },
      { id: "max", name: "Max", appCode: "61322" },
      { id: "apple_tv", name: "Apple TV", appCode: "551012" }
    ],
    irCodeSetId: "ir_roku_player_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED", // Roku OS does not support a mouse cursor pointer protocol
      apps: "SUPPORTED",
      input: "UNSUPPORTED",
      voice: "SUPPORTED", // Search query string dispatch
      channels: "UNSUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    },
    tvSettingsRequired: ["Settings > System > Advanced system settings > Control by mobile apps > Network access: Default or Permissive"]
  },
  {
    id: "tcl_hisense_rca_roku_tv",
    brand: "TCL",
    series: "Roku TV",
    model: "4-Series / 5-Series / Hisense R6 / RCA Roku TV",
    yearRange: "2019 - 2024",
    category: "tv",
    platform: "roku",
    protocol: "roku_ecp",
    defaultPort: 8060,
    discoveryMethod: "SSDP (roku:ecp)",
    pairingMethod: "NONE",
    authDescription: "Roku ECP TV protocol with input switching and volume control.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3", "HDMI 4 (eARC)", "Antenna TV", "AV"],
    supportedAppDeepLinks: [
      { id: "netflix", name: "Netflix", appCode: "12" },
      { id: "youtube", name: "YouTube", appCode: "837" },
      { id: "disney", name: "Disney+", appCode: "291097" }
    ],
    irCodeSetId: "ir_tcl_tv_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  },

  // ==========================================
  // AMAZON (FIRE TV OS)
  // ==========================================
  {
    id: "fire_tv_cube_stick_4k_max",
    brand: "Amazon",
    series: "Fire TV",
    model: "Fire TV Cube 3rd Gen / Stick 4K Max / Omni Series",
    yearRange: "2021 - 2024",
    category: "streaming_box",
    platform: "fire_tv",
    protocol: "fire_tv_whisperplay",
    defaultPort: 8009,
    discoveryMethod: "mDNS (_amzn-wplay._tcp / _whisperplay._tcp) / SSDP",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Amazon Whisperplay / DIAL protocol or ADB network transport over port 5555.",
    verified: true,
    supportedInputSources: ["Fire TV Home", "Live Guide", "HDMI 1", "HDMI 2"],
    supportedAppDeepLinks: [
      { id: "prime", name: "Prime Video", appCode: "com.amazon.amazonvideo.livingroom" },
      { id: "netflix", name: "Netflix", appCode: "com.netflix.ninja" },
      { id: "youtube", name: "YouTube", appCode: "com.amazon.firetv.youtube" },
      { id: "disney", name: "Disney+", appCode: "com.disney.disneyplus" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "UNSUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    },
    tvSettingsRequired: ["Settings > My Fire TV > Developer Options > ADB Debugging: ON (Optional)", "Settings > Preferences > Whispersync for Voice: ON"]
  },

  // ==========================================
  // PANASONIC (VIERA SMART TV)
  // ==========================================
  {
    id: "panasonic_viera_oled_mz2000",
    brand: "Panasonic",
    series: "OLED Master Series",
    model: "MZ2000 / LZ2000 / HZ1500 / EX750",
    yearRange: "2018 - 2024",
    category: "tv",
    platform: "panasonic_viera",
    protocol: "panasonic_viera_rest",
    defaultPort: 55000,
    discoveryMethod: "SSDP (urn:panasonic-com:service:p00NetworkControl:1)",
    pairingMethod: "NONE",
    authDescription: "Panasonic VIERA NRC Network Remote Control HTTP/SOAP API over port 55000.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3", "HDMI 4", "TV Tuner"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "0070000200000001" },
      { id: "netflix", name: "Netflix", appCode: "0010000200000001" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    },
    tvSettingsRequired: ["Menu > Network > TV Remote App Settings > TV Remote: ON", "Menu > Network > TV Remote App Settings > Networked Standby: ON"]
  },

  // ==========================================
  // PHILIPS (JOINT SPACE & ANDROID TV)
  // ==========================================
  {
    id: "philips_ambilight_oled908",
    brand: "Philips",
    series: "Ambilight OLED+",
    model: "OLED+908 / OLED808 / The One 8808",
    yearRange: "2019 - 2024",
    category: "tv",
    platform: "philips",
    protocol: "philips_jointspace_rest",
    defaultPort: 1925,
    discoveryMethod: "SSDP / mDNS (_philipstv._tcp)",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Philips JointSpace REST JSON API (port 1925/1926) with HMAC-SHA256 4-digit PIN authentication or Android TV Remote v2.",
    verified: true,
    supportedInputSources: ["HDMI 1", "HDMI 2", "HDMI 3", "HDMI 4", "TV Tuner", "Ambilight Suite"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "com.google.android.youtube.tv" },
      { id: "netflix", name: "Netflix", appCode: "com.netflix.ninja" }
    ],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  },

  // ==========================================
  // VIZIO (SMARTCAST OS)
  // ==========================================
  {
    id: "vizio_smartcast_p_series",
    brand: "Vizio",
    series: "P-Series / M-Series Quantum",
    model: "P-Series Quantum X / M-Series / V-Series",
    yearRange: "2018 - 2024",
    category: "tv",
    platform: "vizio_smartcast",
    protocol: "vizio_smartcast_https",
    defaultPort: 7345,
    discoveryMethod: "SSDP / mDNS (_viziocast._tcp)",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Vizio SmartCast HTTPS REST API on port 7345 with 4-digit PIN exchange providing an AuthToken.",
    verified: true,
    supportedInputSources: ["CAST", "HDMI-1", "HDMI-2", "HDMI-3", "HDMI-4", "COMP"],
    supportedAppDeepLinks: [
      { id: "youtube", name: "YouTube", appCode: "youtube" },
      { id: "netflix", name: "Netflix", appCode: "netflix" },
      { id: "disney", name: "Disney+", appCode: "disneyplus" }
    ],
    irCodeSetId: "ir_vizio_tv_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    },
    tvSettingsRequired: ["Menu > System > Mobile Devices > Pair Device: Ready", "Power Mode: Quick Start (for Power On over Wi-Fi)"]
  },

  // ==========================================
  // APPLE (APPLE TV TVOS)
  // ==========================================
  {
    id: "apple_tv_4k_3rd_gen",
    brand: "Apple",
    series: "Apple TV 4K",
    model: "Apple TV 4K (3rd Gen) / 2nd Gen / HD",
    yearRange: "2021 - 2024",
    category: "streaming_box",
    platform: "apple_tv",
    protocol: "apple_companion_mrp",
    defaultPort: 49152,
    discoveryMethod: "mDNS (_companion-link._tcp / _mediaremotetv._tcp)",
    pairingMethod: "PIN_CHALLENGE",
    authDescription: "Apple MediaRemote Protocol (MRP) over TLS with HomeKit 4-digit SRP PIN challenge.",
    verified: true,
    supportedInputSources: ["Apple TV Home", "Control Center"],
    supportedAppDeepLinks: [
      { id: "apple_tv", name: "Apple TV App", appCode: "com.apple.TVWatchList" },
      { id: "youtube", name: "YouTube", appCode: "com.google.ios.youtube" },
      { id: "netflix", name: "Netflix", appCode: "com.netflix.Netflix" },
      { id: "apple_music", name: "Apple Music", appCode: "com.apple.TVMusic" }
    ],
    irCodeSetId: "ir_apple_tv_nec",
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "UNSUPPORTED",
      voice: "SUPPORTED",
      channels: "UNSUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    }
  },

  // ==========================================
  // SET-TOP BOXES & CABLE/SATELLITE
  // ==========================================
  {
    id: "comcast_xfinity_x1",
    brand: "Xfinity",
    series: "X1 / Flex",
    model: "X1 TV Box / Xi6 / XG1v4",
    yearRange: "2018 - 2024",
    category: "set_top_box",
    platform: "ir_universal",
    protocol: "ir_consumer",
    defaultPort: 0,
    discoveryMethod: "Manual / IR Code Matching",
    pairingMethod: "IR_CODE_MATCH",
    authDescription: "RC6 infrared protocol (36kHz) or Xfinity Home API.",
    verified: true,
    supportedInputSources: ["Cable TV Live", "On Demand", "Guide"],
    supportedAppDeepLinks: [],
    irCodeSetId: "ir_comcast_xfinity_rc6",
    defaultCapabilities: {
      power: "REQUIRES_HARDWARE",
      navigation: "REQUIRES_HARDWARE",
      volume: "REQUIRES_HARDWARE",
      media: "REQUIRES_HARDWARE",
      keyboard: "UNSUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "UNSUPPORTED",
      input: "REQUIRES_HARDWARE",
      voice: "UNSUPPORTED",
      channels: "REQUIRES_HARDWARE",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "UNSUPPORTED"
    }
  },
  {
    id: "directv_genie_hr54",
    brand: "DirecTV",
    series: "Genie / Stream",
    model: "Genie HR54 / Genie Mini / DirecTV Stream Box",
    yearRange: "2017 - 2024",
    category: "set_top_box",
    platform: "generic",
    protocol: "upnp_av_transport",
    defaultPort: 8080,
    discoveryMethod: "SSDP / UPnP",
    pairingMethod: "NONE",
    authDescription: "DirecTV SHEF HTTP REST API over port 8080 or physical IR.",
    verified: true,
    supportedInputSources: ["Satellite Guide", "Recorded DVR", "Live Channel"],
    supportedAppDeepLinks: [],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "UNSUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "UNSUPPORTED",
      input: "UNSUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "dish_network_hopper",
    brand: "Dish",
    series: "Hopper",
    model: "Hopper 3 / Joey 4",
    yearRange: "2018 - 2024",
    category: "set_top_box",
    platform: "generic",
    protocol: "upnp_av_transport",
    defaultPort: 8080,
    discoveryMethod: "SSDP",
    pairingMethod: "NONE",
    authDescription: "Dish EVE HTTP JSON protocol or IR emitter.",
    verified: true,
    supportedInputSources: ["DISH Guide", "DVR", "Live TV"],
    supportedAppDeepLinks: [],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "UNSUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "UNSUPPORTED",
      input: "UNSUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  },
  {
    id: "sky_q_set_top_box",
    brand: "Sky",
    series: "Sky Q",
    model: "Sky Q 2TB / Sky Q Mini / Sky Stream",
    yearRange: "2018 - 2024",
    category: "set_top_box",
    platform: "generic",
    protocol: "upnp_av_transport",
    defaultPort: 49160,
    discoveryMethod: "SSDP / UPnP",
    pairingMethod: "NONE",
    authDescription: "Sky Q TCP Raw Command port 5900 or UPnP port 49160.",
    verified: true,
    supportedInputSources: ["Sky TV Guide", "Recordings", "Catch Up"],
    supportedAppDeepLinks: [],
    defaultCapabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "UNSUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "UNSUPPORTED",
      input: "UNSUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    }
  }
];

export class DeviceDatabaseService {
  static getAllProfiles(): DeviceProfile[] {
    return GLOBAL_DEVICE_DATABASE;
  }

  static getProfileById(id: string): DeviceProfile | undefined {
    return GLOBAL_DEVICE_DATABASE.find(p => p.id === id);
  }

  static getAllBrands(): string[] {
    const brands = new Set(GLOBAL_DEVICE_DATABASE.map(p => p.brand));
    return Array.from(brands).sort();
  }

  static getAllCategories(): string[] {
    const cats = new Set(GLOBAL_DEVICE_DATABASE.map(p => p.category));
    return Array.from(cats).sort();
  }

  static searchProfiles(filter: GlobalSearchFilter): DeviceProfile[] {
    return GLOBAL_DEVICE_DATABASE.filter(profile => {
      if (filter.brand && profile.brand.toLowerCase() !== filter.brand.toLowerCase()) {
        return false;
      }
      if (filter.category && profile.category !== filter.category) {
        return false;
      }
      if (filter.platform && profile.platform !== filter.platform) {
        return false;
      }
      if (filter.query) {
        const q = filter.query.toLowerCase().trim();
        const matchBrand = profile.brand.toLowerCase().includes(q);
        const matchModel = profile.model.toLowerCase().includes(q);
        const matchSeries = profile.series.toLowerCase().includes(q);
        const matchPlatform = profile.platform.toLowerCase().includes(q);
        const matchProtocol = profile.protocol.toLowerCase().includes(q);
        if (!matchBrand && !matchModel && !matchSeries && !matchPlatform && !matchProtocol) {
          return false;
        }
      }
      return true;
    });
  }
}
