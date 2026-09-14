import { RemoteTransport } from "./types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../core/types";

export class SamsungTizenTransport implements RemoteTransport {
  id = "samsung_tizen_ws";
  name = "Samsung SmartView WebSocket Protocol (Port 8002)";
  supportedPlatforms = ["tizen"];

  async connect(device: TvDevice): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const startTime = performance.now();
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 8002, protocol: "samsung_tizen_ws" })
      });
      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);
      if (!res.ok || !data.success) {
        return { success: false, latencyMs, error: data.error || `Could not connect to Samsung TV at ${device.ip}` };
      }
      return { success: true, latencyMs };
    } catch (err: any) {
      return { success: false, latencyMs: Math.round(performance.now() - startTime), error: err.message };
    }
  }

  async disconnect(_device: TvDevice): Promise<void> {}

  async authenticate(device: TvDevice, pin: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch("/api/devices/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: device.id, pin, clientName: "Universal Remote" })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Samsung pairing failed." };
      }
      return { success: true, token: data.token };
    } catch (err: any) {
      return { success: false, error: err.message };
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
          protocol: "samsung_tizen_ws"
        })
      });
      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);
      if (!res.ok || !data.success) {
        return {
          success: false,
          command,
          value,
          timestamp: Date.now(),
          latencyMs,
          error: data.error || `Samsung TV rejected command: ${command}`
        };
      }
      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: this.name
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach Samsung TV: ${err.message}`
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
    return { model: device.model || "Samsung Smart TV", version: "Tizen OS", isAlive: true };
  }
}

export class LgWebOsTransport implements RemoteTransport {
  id = "lg_webos_ssap";
  name = "LG webOS SSAP WebSocket Protocol (Port 3001)";
  supportedPlatforms = ["webos"];

  async connect(device: TvDevice): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const startTime = performance.now();
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 3001, protocol: "lg_webos_ssap" })
      });
      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);
      if (!res.ok || !data.success) {
        return { success: false, latencyMs, error: data.error || `Could not connect to LG webOS TV at ${device.ip}` };
      }
      return { success: true, latencyMs };
    } catch (err: any) {
      return { success: false, latencyMs: Math.round(performance.now() - startTime), error: err.message };
    }
  }

  async disconnect(_device: TvDevice): Promise<void> {}

  async authenticate(device: TvDevice, pin: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch("/api/devices/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: device.id, pin, clientName: "Universal Remote" })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "LG webOS pairing rejected." };
      }
      return { success: true, token: data.token };
    } catch (err: any) {
      return { success: false, error: err.message };
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
          protocol: "lg_webos_ssap"
        })
      });
      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);
      if (!res.ok || !data.success) {
        return {
          success: false,
          command,
          value,
          timestamp: Date.now(),
          latencyMs,
          error: data.error || `LG webOS TV rejected command: ${command}`
        };
      }
      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: this.name
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach LG TV: ${err.message}`
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
    return { model: device.model || "LG OLED / NanoCell", version: "webOS", isAlive: true };
  }
}

export class SonyBraviaTransport implements RemoteTransport {
  id = "sony_ircc_rest";
  name = "Sony BRAVIA IRCC / REST API";
  supportedPlatforms = ["sony_bravia"];

  async connect(device: TvDevice): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const startTime = performance.now();
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 80, protocol: "sony_ircc_rest" })
      });
      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);
      if (!res.ok || !data.success) {
        return { success: false, latencyMs, error: data.error || `Could not connect to Sony BRAVIA TV at ${device.ip}` };
      }
      return { success: true, latencyMs };
    } catch (err: any) {
      return { success: false, latencyMs: Math.round(performance.now() - startTime), error: err.message };
    }
  }

  async disconnect(_device: TvDevice): Promise<void> {}

  async authenticate(device: TvDevice, psk: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch("/api/devices/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: device.id, pin: psk, clientName: "Universal Remote" })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Sony BRAVIA PSK authentication failed." };
      }
      return { success: true, token: data.token };
    } catch (err: any) {
      return { success: false, error: err.message };
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
          protocol: "sony_ircc_rest"
        })
      });
      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);
      if (!res.ok || !data.success) {
        return {
          success: false,
          command,
          value,
          timestamp: Date.now(),
          latencyMs,
          error: data.error || `Sony BRAVIA command failed: ${command}`
        };
      }
      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: this.name
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach Sony TV: ${err.message}`
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
    return { model: device.model || "Sony BRAVIA", version: "Sony IRCC / Google TV", isAlive: true };
  }
}
