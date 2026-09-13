import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../core/types";

export interface RemoteTransport {
  id: string;
  name: string;
  supportedPlatforms: string[];

  connect(device: TvDevice): Promise<{ success: boolean; latencyMs: number; error?: string }>;
  disconnect(device: TvDevice): Promise<void>;
  authenticate(device: TvDevice, pinOrKey: string): Promise<{ success: boolean; token?: string; error?: string }>;
  sendCommand(device: TvDevice, command: RemoteCommandType, value?: any): Promise<CommandExecutionResult>;
  sendText(device: TvDevice, text: string): Promise<CommandExecutionResult>;
  launchApp(device: TvDevice, appId: string): Promise<CommandExecutionResult>;
  getCapabilities(device: TvDevice): Promise<DeviceCapabilities>;
  getDeviceInfo(device: TvDevice): Promise<{ model?: string; version?: string; isAlive: boolean }>;
}
