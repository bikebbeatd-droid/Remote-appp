import { TvDevice, RemoteCommandType, CommandExecutionResult } from "../types";
import { CapabilityEngine } from "../capabilities/CapabilityEngine";
import { AdapterRegistry } from "../../adapters/AdapterRegistry";
import { globalCommandQueue } from "./CommandQueue";

export class CommandEngine {
  /**
   * Primary pipeline entrance:
   * UI -> COMMAND ENGINE -> CAPABILITY ENGINE -> DEVICE ADAPTER -> TRANSPORT -> REAL TV DEVICE
   */
  static async execute(
    device: TvDevice | null,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const timestamp = Date.now();

    // 1. Device check
    if (!device) {
      return {
        success: false,
        command,
        value,
        timestamp,
        latencyMs: 0,
        error: "No compatible TV found. Please scan or select a TV."
      };
    }

    // 2. Capability Validation
    const capabilityCheck = CapabilityEngine.checkCommand(device, command);
    if (!capabilityCheck.allowed) {
      return {
        success: false,
        command,
        value,
        timestamp,
        latencyMs: 0,
        error: capabilityCheck.reason || "Command not supported on this TV."
      };
    }

    // 3. Resolve Device Adapter
    const adapter = AdapterRegistry.getAdapterForDevice(device);

    // 4. Dispatch through Command Queue (handles debouncing, timeouts, telemetry)
    return await globalCommandQueue.execute(device, command, value, async () => {
      return await adapter.executeCommand(device, command, value);
    });
  }
}
