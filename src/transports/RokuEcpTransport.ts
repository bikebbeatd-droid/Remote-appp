import { RemoteTransport } from "./types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../core/types";

const ROKU_KEY_MAP: Partial<Record<RemoteCommandType, string>> = {
  POWER: "Power",
  HOME: "Home",
  BACK: "Back",
  MENU: "Info",
  UP: "Up",
  DOWN: "Down",
  LEFT: "Left",
  RIGHT: "Right",
  OK: "Select",
  VOLUME_UP: "VolumeUp",
  VOLUME_DOWN: "VolumeDown",
  MUTE: "VolumeMute",
  CHANNEL_UP: "ChannelUp",
  CHANNEL_DOWN: "ChannelDown",
  PLAY: "Play",
  PAUSE: "Play",
  PLAY_PAUSE: "Play",
  STOP: "Home",
  PREVIOUS: "InstantReplay",
  NEXT: "Fwd",
  REWIND: "Rev",
  FAST_FORWARD: "Fwd",
  INPUT: "InputTuner",
  INFO: "Info",
  KEYBOARD_ENTER: "Enter",
  KEYBOARD_BACKSPACE: "Backspace"
};

export class RokuEcpTransport implements RemoteTransport {
  id = "roku_ecp";
  name = "Roku External Control Protocol (ECP)";
  supportedPlatforms = ["roku"];

  async connect(device: TvDevice): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const startTime = performance.now();
    const res = await this.request(device, "GET", "/query/device-info");
    return { success: res.ok, latencyMs: Math.round(performance.now() - startTime), error: res.ok ? undefined : (res.error || `Roku verification failed (HTTP ${res.status}).`) };
  }
  async disconnect(_device: TvDevice): Promise<void> {}

  async authenticate(_device: TvDevice): Promise<{ success: boolean; token?: string }> {
    // Roku ECP requires no authentication PIN
    return { success: true };
  }

  private nativeHttp(method: string, url: string, body = ""): any | null {
    try {
      const bridge = (globalThis as any).AndroidRemoteBridge;
      if (typeof bridge?.httpRequest !== "function") return null;
      const raw = bridge.httpRequest(method, url, body);
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private async request(device: TvDevice, method: string, path: string, body = ""): Promise<{ok: boolean; status: number; body?: string; error?: string}> {
    const url = `http://${device.ip}:${device.port || 8060}${path}`;
    const native = this.nativeHttp(method, url, body);
    if (native) return native;
    try {
      const res = await fetch(url, { method, body: body || undefined });
      const text = await res.text();
      return { ok: res.ok, status: res.status, body: text };
    } catch (err: any) {
      return { ok: false, status: 0, error: err?.message || "Roku network request failed" };
    }
  }

  async sendCommand(device: TvDevice, command: RemoteCommandType, value?: any): Promise<CommandExecutionResult> {
    const startTime = performance.now();
    const rokuKey = ROKU_KEY_MAP[command];

    if (!rokuKey && command !== "LAUNCH_APP" && command !== "TEXT_INPUT") {
      return { success: false, command, timestamp: Date.now(), latencyMs: 0, error: `Roku ECP does not expose a native key for ${command}`, protocol: this.name };
    }

    try {
      let res: any = null;
      if (command === "TEXT_INPUT" && value) {
        for (const char of String(value)) {
          res = await this.request(device, "POST", `/keypress/Lit_${encodeURIComponent(char)}`);
          if (!res.ok) break;
        }
      } else {
        const path = command === "LAUNCH_APP" && value
          ? `/launch/${encodeURIComponent(String(value))}`
          : `/keypress/${encodeURIComponent(String(rokuKey || value || command))}`;
        res = await this.request(device, "POST", path);
      }
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: Boolean(res?.ok),
        command,
        value: rokuKey || value,
        timestamp: Date.now(),
        latencyMs,
        protocol: this.name,
        error: res?.ok ? undefined : (res?.error || `Roku rejected command (HTTP ${res?.status || 0}).`)
      };
    } catch (err: any) {
      return { success: false, command, timestamp: Date.now(), latencyMs: Math.round(performance.now() - startTime), error: err?.message || "Roku command failed", protocol: this.name };
    }
  }

  async sendText(device: TvDevice, text: string): Promise<CommandExecutionResult> {
    return this.sendCommand(device, "TEXT_INPUT", text);
  }

  async launchApp(device: TvDevice, appId: string): Promise<CommandExecutionResult> {
    return this.sendCommand(device, "LAUNCH_APP", appId);
  }

  async getCapabilities(device: TvDevice): Promise<DeviceCapabilities> {
    return device.capabilities;
  }

  async getDeviceInfo(device: TvDevice): Promise<{ model?: string; version?: string; isAlive: boolean }> {
    try {
      const res = await this.request(device, "GET", "/query/device-info");
      if (!res.ok) return { isAlive: false };
      const xml = res.body || "";
      const model = xml.match(/<model-name>([^<]+)<\/model-name>/)?.[1] || device.model;
      const version = xml.match(/<software-version>([^<]+)<\/software-version>/)?.[1];
      return { model, version, isAlive: true };
    } catch {
      return { isAlive: false };
    }
  }
}
