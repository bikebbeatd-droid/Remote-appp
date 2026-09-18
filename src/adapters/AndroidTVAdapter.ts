import { TvAdapter } from "./types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../core/types";

/**
 * Android TV / Google TV Remote Service v2.
 *
 * IMPORTANT:
 * The v2 protocol is mutual-TLS + protobuf on TCP 6467 (pairing) / 6466
 * (remote control). A browser/WebView fetch() cannot implement this protocol.
 * The APK must use the native Android bridge for the actual socket.
 */
export const ANDROID_TV_KEYCODES: Record<string, number> = {
  POWER: 26, HOME: 3, BACK: 4, UP: 19, DOWN: 20, LEFT: 21, RIGHT: 22,
  OK: 23, SELECT: 23, ENTER: 66, VOLUME_UP: 24, VOLUME_DOWN: 25,
  MUTE: 164, PLAY: 126, PAUSE: 127, PLAY_PAUSE: 85, STOP: 86,
  NEXT: 87, PREV: 88, REWIND: 89, FAST_FORWARD: 90,
  CHANNEL_UP: 166, CHANNEL_DOWN: 167, MENU: 82, SETTINGS: 176,
  INPUT: 178, INFO: 165, GUIDE: 172, VOICE: 219, CAPTIONS: 175,
  RED: 183, GREEN: 184, YELLOW: 185, BLUE: 186,
  NUM_0: 7, NUM_1: 8, NUM_2: 9, NUM_3: 10, NUM_4: 11,
  NUM_5: 12, NUM_6: 13, NUM_7: 14, NUM_8: 15, NUM_9: 16
};

export const ANDROID_TV_PACKAGES: Record<string, string> = {
  youtube: "com.google.android.youtube.tv",
  netflix: "com.netflix.ninja",
  prime_video: "com.amazon.amazonvideo.livingroom",
  disney_plus: "com.disney.disneyplus",
  spotify: "com.spotify.tv.android",
  plex: "com.plexapp.android",
  twitch: "tv.twitch.android.app",
  max: "com.wbd.stream",
  hulu: "com.hulu.livingroomplus",
  apple_tv: "com.apple.atve.androidtv.appletv",
  google_play: "com.google.android.videos",
  settings: "com.android.tv.settings"
};

type NativeAndroidRemoteBridge = {
  isAvailable?: () => boolean;
  ping?: (ip: string, port: number) => boolean;
  pair?: (ip: string, pin: string, clientName: string) => string;
  sendKey?: (ip: string, keyCode: number, direction: string) => boolean;
  sendText?: (ip: string, text: string) => boolean;
  launchApp?: (ip: string, appLink: string) => boolean;
};

function getNativeBridge(): NativeAndroidRemoteBridge | null {
  try {
    const bridge = (globalThis as any).AndroidRemoteBridge as NativeAndroidRemoteBridge | undefined;
    if (!bridge) return null;
    if (typeof bridge.isAvailable === "function" && !bridge.isAvailable()) return null;
    return bridge;
  } catch {
    return null;
  }
}

export class AndroidTVAdapter implements TvAdapter {
  readonly platform = "android_tv";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    const native = getNativeBridge();
    const ready = !!native;
    return {
      power: ready ? "SUPPORTED" : "REQUIRES_NATIVE_BRIDGE",
      navigation: ready ? "SUPPORTED" : "REQUIRES_NATIVE_BRIDGE",
      volume: ready ? "SUPPORTED" : "REQUIRES_NATIVE_BRIDGE",
      media: ready ? "SUPPORTED" : "REQUIRES_NATIVE_BRIDGE",
      keyboard: ready ? "SUPPORTED" : "REQUIRES_NATIVE_BRIDGE",
      touchpad: "UNSUPPORTED",
      apps: ready ? "SUPPORTED" : "REQUIRES_NATIVE_BRIDGE",
      input: ready ? "SUPPORTED" : "REQUIRES_NATIVE_BRIDGE",
      voice: "DEVICE_DEPENDENT",
      channels: ready ? "SUPPORTED" : "REQUIRES_NATIVE_BRIDGE",
      ir: "UNSUPPORTED",
      bluetooth: "DEVICE_DEPENDENT",
      wifi: "SUPPORTED"
    };
  }

  async verifySocketReachability(
    ip: string,
    port = 6467
  ): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    const native = getNativeBridge();

    if (!native?.ping) {
      return {
        online: false,
        latencyMs: Math.round(performance.now() - start),
        error: "Android TV Remote Service requires the native Android transport. No native bridge is available."
      };
    }

    try {
      const online = !!native.ping(ip, port);
      return { online, latencyMs: Math.round(performance.now() - start), error: online ? undefined : "Android TV Remote Service is not reachable." };
    } catch (err: any) {
      return { online: false, latencyMs: Math.round(performance.now() - start), error: err?.message || "Native Android TV probe failed." };
    }
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const start = performance.now();
    const native = getNativeBridge();

    if (!native) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - start),
        protocol: "Android TV Remote Service v2",
        error: "Android TV requires the native Android Remote Service v2 bridge. The APK must not fall back to a backend /api/command call."
      };
    }

    try {
      if (command === "TEXT_INPUT" && native.sendText) {
        const ok = !!native.sendText(device.ip, String(value ?? ""));
        return { success: ok, command, value, timestamp: Date.now(), latencyMs: Math.round(performance.now() - start), protocol: "Android TV Remote Service v2", error: ok ? undefined : "Native text input failed." };
      }

      if (command === "LAUNCH_APP" && native.launchApp) {
        const normalized = String(value ?? "").toLowerCase().replace(/\s+/g, "_");
        const link = ANDROID_TV_PACKAGES[normalized] || String(value ?? "");
        const ok = !!native.launchApp(device.ip, link);
        return { success: ok, command, value, timestamp: Date.now(), latencyMs: Math.round(performance.now() - start), protocol: "Android TV Remote Service v2", error: ok ? undefined : "Native app launch failed." };
      }

      const keycode = ANDROID_TV_KEYCODES[command];
      if (keycode == null || !native.sendKey) {
        return {
          success: false,
          command,
          value,
          timestamp: Date.now(),
          latencyMs: Math.round(performance.now() - start),
          protocol: "Android TV Remote Service v2",
          error: `Command ${command} is not mapped to Android TV Remote Service v2 yet.`
        };
      }

      const ok = !!native.sendKey(device.ip, keycode, "SHORT");
      return {
        success: ok,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - start),
        protocol: "Android TV Remote Service v2",
        error: ok ? undefined : `Android TV rejected keycode ${keycode}.`
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - start),
        protocol: "Android TV Remote Service v2",
        error: err?.message || "Native Android TV command failed."
      };
    }
  }

  async authenticate(
    device: TvDevice,
    pin: string,
    clientName = "Universal Android TV Remote"
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    const native = getNativeBridge();

    if (!native?.pair) {
      return {
        success: false,
        error: "Android TV pairing requires the native mutual-TLS Remote Service v2 bridge. No backend pairing fallback is used."
      };
    }

    try {
      const result = native.pair(device.ip, pin.trim(), clientName);
      const parsed = result ? JSON.parse(result) : null;
      if (parsed?.success) {
        return { success: true, token: parsed.token || "androidtv_native_v2" };
      }
      return { success: false, error: parsed?.error || "Android TV pairing failed. Check the PIN shown on the TV." };
    } catch (err: any) {
      return { success: false, error: err?.message || "Native Android TV pairing failed." };
    }
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return this.verifySocketReachability(device.ip, device.port || 6467);
  }
}
