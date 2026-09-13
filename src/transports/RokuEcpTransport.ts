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
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: device.id, command: "INFO" })
      });
      const latencyMs = Math.round(performance.now() - startTime);
      return { success: res.ok, latencyMs };
    } catch (err: any) {
      return { success: false, latencyMs: 0, error: err.message };
    }
  }

  async disconnect(_device: TvDevice): Promise<void> {}

  async authenticate(_device: TvDevice): Promise<{ success: boolean; token?: string }> {
    // Roku ECP requires no authentication PIN
    return { success: true, token: "roku_no_auth" };
  }

  async sendCommand(device: TvDevice, command: RemoteCommandType, value?: any): Promise<CommandExecutionResult> {
    const startTime = performance.now();
    const rokuKey = ROKU_KEY_MAP[command];

    if (!rokuKey && command !== "LAUNCH_APP" && command !== "TEXT_INPUT") {
      return {
        success: false,
        command,
        timestamp: Date.now(),
        latencyMs: 0,
        error: `Roku ECP does not expose a native key for ${command}`,
        protocol: this.name
      };
    }

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          value: value || rokuKey,
          protocol: "roku_ecp"
        })
      });
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: res.ok,
        command,
        value: rokuKey || value,
        timestamp: Date.now(),
        latencyMs,
        protocol: this.name
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: err.message,
        protocol: this.name
      };
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
    return { model: device.model || "Roku Ultra", version: "Roku OS 13.5", isAlive: true };
  }
}
