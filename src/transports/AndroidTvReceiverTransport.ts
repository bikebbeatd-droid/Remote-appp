import { RemoteTransport } from "./types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../core/types";

export class AndroidTvReceiverTransport implements RemoteTransport {
  id = "android_tv_receiver";
  name = "Android TV / Google TV Companion Protocol";
  supportedPlatforms = ["android_tv", "google_tv"];

  async connect(device: TvDevice): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const startTime = performance.now();
    try {
      const res = await fetch("/api/health");
      const latencyMs = Math.round(performance.now() - startTime);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true, latencyMs };
    } catch (err: any) {
      return { success: false, latencyMs: 0, error: err.message || "Failed to reach TV receiver" };
    }
  }

  async disconnect(_device: TvDevice): Promise<void> {
    // Graceful disconnect
  }

  async authenticate(device: TvDevice, pin: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch("/api/devices/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: device.id, pin, clientName: "Android Mobile Remote" })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Authentication failed" };
      }
      return { success: true, token: data.token };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error during pairing" };
    }
  }

  async sendCommand(device: TvDevice, command: RemoteCommandType, value?: any): Promise<CommandExecutionResult> {
    const startTime = performance.now();
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          value,
          token: device.token,
          clientName: "Android Mobile Remote"
        })
      });
      const latencyMs = Math.round(performance.now() - startTime);
      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          command,
          value,
          timestamp: Date.now(),
          latencyMs,
          error: data.error || "Command rejected by TV Receiver",
          protocol: this.name
        };
      }

      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: this.name,
        rawPayload: data
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: err.message || "Network connection failure",
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
    try {
      const res = await fetch("/api/receiver/state");
      const data = await res.json();
      return {
        model: data.state?.model || device.model,
        version: "Android TV OS 14.0",
        isAlive: true
      };
    } catch {
      return { isAlive: false };
    }
  }
}
