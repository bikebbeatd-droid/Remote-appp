import { RemoteProfile, AutomationScene, TvDevice } from "./types";

export const POPULAR_TV_APPS = [
  {
    id: "youtube",
    name: "YouTube",
    appId: "com.google.android.youtube.tv",
    rokuAppId: "12",
    tizenAppId: "9Ur5IzDKqV.TizenYouTube",
    webOsAppId: "youtube.leanback.v4",
    iconColor: "text-red-500",
    bgColor: "bg-red-500/10 border-red-500/30",
    badge: "Free / 4K"
  },
  {
    id: "netflix",
    name: "Netflix",
    appId: "com.netflix.ninja",
    rokuAppId: "12",
    tizenAppId: "3201907018807",
    webOsAppId: "netflix",
    iconColor: "text-red-600",
    bgColor: "bg-red-600/10 border-red-600/30",
    badge: "Sub required"
  },
  {
    id: "disney_plus",
    name: "Disney+",
    appId: "com.disney.disneyplus",
    rokuAppId: "291097",
    tizenAppId: "MCmhhUXZav.DisneyPlus",
    webOsAppId: "com.disney.disneyplus-prod",
    iconColor: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    badge: "IMAX Enhanced"
  },
  {
    id: "prime_video",
    name: "Prime Video",
    appId: "com.amazon.amazonvideo.livingroom",
    rokuAppId: "13",
    tizenAppId: "3201512006785",
    webOsAppId: "amazon",
    iconColor: "text-sky-400",
    bgColor: "bg-sky-500/10 border-sky-500/30",
    badge: "HDR10+"
  },
  {
    id: "spotify",
    name: "Spotify",
    appId: "com.spotify.tv.android",
    rokuAppId: "22271",
    tizenAppId: "3201606009684",
    webOsAppId: "spotify-beehive",
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
    badge: "Music"
  },
  {
    id: "twitch",
    name: "Twitch",
    appId: "tv.twitch.android.app",
    rokuAppId: "102812",
    tizenAppId: "3201710015037",
    webOsAppId: "twitch",
    iconColor: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/30",
    badge: "Live"
  },
  {
    id: "plex",
    name: "Plex",
    appId: "com.plexapp.android",
    rokuAppId: "13535",
    tizenAppId: "3201512006963",
    webOsAppId: "cdx-plex",
    iconColor: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/30",
    badge: "Local / Free"
  },
  {
    id: "browser",
    name: "Web Browser",
    appId: "com.android.chrome",
    rokuAppId: "browser",
    tizenAppId: "org.tizen.browser",
    webOsAppId: "com.webos.app.browser",
    iconColor: "text-teal-400",
    bgColor: "bg-teal-500/10 border-teal-500/30",
    badge: "Web"
  },
  {
    id: "settings",
    name: "System Settings",
    appId: "com.android.tv.settings",
    rokuAppId: "settings",
    tizenAppId: "org.tizen.settings",
    webOsAppId: "com.webos.app.settings",
    iconColor: "text-zinc-400",
    bgColor: "bg-zinc-500/10 border-zinc-500/30",
    badge: "System"
  }
];

// Production: No hardcoded fake devices. Devices must come from real network discovery or manual probe.
export const DEFAULT_DEVICES: TvDevice[] = [];


export const DEFAULT_PROFILES: RemoteProfile[] = [
  {
    id: "profile_default",
    name: "Standard Remote",
    description: "Full classic layout with volume, navigation, media, and source controls.",
    iconName: "Tv",
    defaultMode: "classic",
    buttonMappings: {}
  },
  {
    id: "profile_movie",
    name: "Cinema / Streaming",
    description: "Optimized for Netflix, Disney+, and streaming with fast rewind and audio controls.",
    iconName: "Film",
    defaultMode: "media",
    buttonMappings: {}
  },
  {
    id: "profile_youtube",
    name: "YouTube & Content",
    description: "Instant access to search, keyboard, pause, and rapid skip.",
    iconName: "PlaySquare",
    defaultMode: "apps",
    buttonMappings: {}
  },
  {
    id: "profile_gaming",
    name: "Gaming Pad",
    description: "Ergonomic dual-hand layout for Android TV and cloud gaming on your TV.",
    iconName: "Gamepad2",
    defaultMode: "gaming",
    buttonMappings: {}
  }
];

export const DEFAULT_SCENES: AutomationScene[] = [
  {
    id: "scene_movie_night",
    name: "Movie Night",
    description: "Switches TV input to HDMI 1, sets volume to 28%, and launches Netflix.",
    iconName: "Film",
    actions: [
      { command: "SET_INPUT", value: "HDMI 1", label: "Switch to HDMI 1", delayMs: 400 },
      { command: "SET_VOLUME", value: 28, label: "Set Volume to 28%", delayMs: 300 },
      { command: "LAUNCH_APP", value: "com.netflix.ninja", label: "Launch Netflix", delayMs: 600 }
    ]
  },
  {
    id: "scene_game_mode",
    name: "Game Mode",
    description: "Switches to HDMI 2 (Console), sets volume to 22%, and un-mutes.",
    iconName: "Gamepad2",
    actions: [
      { command: "SET_INPUT", value: "HDMI 2", label: "Switch to HDMI 2 (Consoles)", delayMs: 400 },
      { command: "SET_VOLUME", value: 22, label: "Set Volume to 22%", delayMs: 300 }
    ]
  },
  {
    id: "scene_night_quiet",
    name: "Quiet Night",
    description: "Lowers volume to 8% for late night listening without waking the house.",
    iconName: "Moon",
    actions: [
      { command: "SET_VOLUME", value: 8, label: "Set Volume to 8%", delayMs: 200 }
    ]
  }
];
