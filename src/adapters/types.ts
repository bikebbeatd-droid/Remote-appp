import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../core/types";

export interface TvAdapter {
  readonly platform: string;
  
  /**
   * Returns default/verified capabilities for this TV platform
   */
  getCapabilities(device?: TvDevice): DeviceCapabilities;

  /**
   * Executes a command on the target TV device using its real protocol
   */
  executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult>;

  /**
   * Authenticates / pairs with the target TV
   */
  authenticate(
    device: TvDevice,
    pin: string,
    clientName?: string
  ): Promise<{ success: boolean; token?: string; error?: string }>;

  /**
   * Checks if the device is currently reachable and responding
   */
  ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }>;
}
