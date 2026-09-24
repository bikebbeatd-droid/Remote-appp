import { RemoteTransport } from "./types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../core/types";
import { AndroidTVAdapter } from "../adapters/AndroidTVAdapter";

/**
 * Compatibility transport wrapper.
 * The Android APK uses the real native Android TV Remote Service v2 bridge.
 * It never treats the local web backend health endpoint as TV connectivity.
 */
export class AndroidTvReceiverTransport implements RemoteTransport {
  id = "android_tv_receiver";
  name = "Android TV / Google TV Remote Service v2";
  supportedPlatforms = ["android_tv", "google_tv"];

  private readonly adapter = new AndroidTVAdapter();

  async connect(device: TvDevice): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const start = performance.now();
    const result = await this.adapter.ping(device);
    return {
      success: result.online,
      latencyMs: result.latencyMs ?? Math.round(performance.now() - start),
      error: result.error
    };
  }

  async disconnect(_device: TvDevice): Promise<void> {}

  async authenticate(device: TvDevice, pin: string): Promise<{ success: boolean; token?: string; error?: string }> {
    return this.adapter.authenticate(device, pin, "Android Mobile Remote");
  }

  async sendCommand(device: TvDevice, command: RemoteCommandType, value?: any): Promise<CommandExecutionResult> {
    return this.adapter.executeCommand(device, command, value);
  }

  async sendText(device: TvDevice, text: string): Promise<CommandExecutionResult> {
    return this.adapter.executeCommand(device, "TEXT_INPUT", text);
  }

  async launchApp(device: TvDevice, appId: string): Promise<CommandExecutionResult> {
    return this.adapter.executeCommand(device, "LAUNCH_APP", appId);
  }

  async getCapabilities(device: TvDevice): Promise<DeviceCapabilities> {
    return this.adapter.getCapabilities(device);
  }

  async getDeviceInfo(device: TvDevice): Promise<{ model?: string; version?: string; isAlive: boolean }> {
    const ping = await this.adapter.ping(device);
    return { model: device.model, version: "Android TV Remote Service v2", isAlive: ping.online };
  }
}
