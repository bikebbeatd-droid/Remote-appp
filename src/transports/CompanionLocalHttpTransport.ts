import { RemoteTransport } from "./types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../core/types";
import { CompanionWebReceiverAdapter } from "../adapters/companion/CompanionAdapter";

export class CompanionLocalHttpTransport implements RemoteTransport {
  id = "companion_local_http";
  name = "Universal Smart TV Local Wi-Fi Receiver";
  supportedPlatforms = ["companion_web_receiver"];

  private adapter = new CompanionWebReceiverAdapter();

  async connect(device: TvDevice) {
    const started = performance.now();
    const result = await this.adapter.ping(device);
    return { success: result.online, latencyMs: Math.round(performance.now() - started), error: result.error };
  }
  async disconnect(_device: TvDevice) {}
  async authenticate(device: TvDevice, pinOrKey: string) { return this.adapter.authenticate(device, pinOrKey); }
  async sendCommand(device: TvDevice, command: RemoteCommandType, value?: any) { return this.adapter.executeCommand(device, command, value); }
  async sendText(device: TvDevice, text: string) { return this.adapter.executeCommand(device, "TEXT_INPUT" as RemoteCommandType, text); }
  async launchApp(device: TvDevice, appId: string) { return this.adapter.executeCommand(device, "LAUNCH_APP" as RemoteCommandType, appId); }
  async getCapabilities(_device: TvDevice): Promise<DeviceCapabilities> { return this.adapter.getCapabilities(); }
  async getDeviceInfo(device: TvDevice) { return this.adapter.getDeviceInfo(device); }
}
