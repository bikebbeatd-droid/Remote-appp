import { RemoteTransport } from "./types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../core/types";

export class SamsungTizenTransport implements RemoteTransport {
  id = "samsung_tizen_ws";
  name = "Samsung SmartView WebSocket Protocol (Port 8002)";
  supportedPlatforms = ["tizen"];

  async connect(_device: TvDevice): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    return { success: false, latencyMs: 0, error: "SamsungTizenTransport legacy transport disabled; use the verified platform adapter." };
  }

  async disconnect(_device: TvDevice): Promise<void> {}

  async authenticate(_device: TvDevice, _credential: string): Promise<{ success: boolean; token?: string; error?: string }> {
    return { success: false, error: "SamsungTizenTransport legacy authentication disabled; use the verified platform adapter." };
  }

  async sendCommand(_device: TvDevice, command: RemoteCommandType, value?: any): Promise<CommandExecutionResult> {
    return { success: false, command, value, timestamp: Date.now(), latencyMs: 0, error: "SamsungTizenTransport legacy command transport disabled." };
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
    return { model: device.model, version: undefined, isAlive: false };
  }
}

export class LgWebOsTransport implements RemoteTransport {
  id = "lg_webos_ssap";
  name = "LG webOS SSAP WebSocket Protocol (Port 3001)";
  supportedPlatforms = ["webos"];

  async connect(_device: TvDevice): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    return { success: false, latencyMs: 0, error: "LgWebOsTransport legacy transport disabled; use the verified platform adapter." };
  }

  async disconnect(_device: TvDevice): Promise<void> {}

  async authenticate(_device: TvDevice, _credential: string): Promise<{ success: boolean; token?: string; error?: string }> {
    return { success: false, error: "LgWebOsTransport legacy authentication disabled; use the verified platform adapter." };
  }

  async sendCommand(_device: TvDevice, command: RemoteCommandType, value?: any): Promise<CommandExecutionResult> {
    return { success: false, command, value, timestamp: Date.now(), latencyMs: 0, error: "LgWebOsTransport legacy command transport disabled." };
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
    return { model: device.model, version: undefined, isAlive: false };
  }
}

export class SonyBraviaTransport implements RemoteTransport {
  id = "sony_ircc_rest";
  name = "Sony BRAVIA IRCC / REST API";
  supportedPlatforms = ["sony_bravia"];

  async connect(_device: TvDevice): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    return { success: false, latencyMs: 0, error: "SonyBraviaTransport legacy transport disabled; use the verified platform adapter." };
  }

  async disconnect(_device: TvDevice): Promise<void> {}

  async authenticate(_device: TvDevice, _credential: string): Promise<{ success: boolean; token?: string; error?: string }> {
    return { success: false, error: "SonyBraviaTransport legacy authentication disabled; use the verified platform adapter." };
  }

  async sendCommand(_device: TvDevice, command: RemoteCommandType, value?: any): Promise<CommandExecutionResult> {
    return { success: false, command, value, timestamp: Date.now(), latencyMs: 0, error: "SonyBraviaTransport legacy command transport disabled." };
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
    return { model: device.model, version: undefined, isAlive: false };
  }
}
