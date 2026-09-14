import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { IrHardwareManager } from "../../ir/IrHardwareManager";
import { IrDatabaseService } from "../../database/irDatabase";

export class IrUniversalAdapter implements TvAdapter {
  readonly platform = "ir_universal";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "REQUIRES_HARDWARE",
      navigation: "REQUIRES_HARDWARE",
      volume: "REQUIRES_HARDWARE",
      media: "REQUIRES_HARDWARE",
      keyboard: "UNSUPPORTED", // One-way IR cannot provide bidirectional soft-keyboard
      touchpad: "UNSUPPORTED",
      apps: "UNSUPPORTED",
      input: "REQUIRES_HARDWARE",
      voice: "UNSUPPORTED",
      channels: "REQUIRES_HARDWARE",
      ir: "SUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "UNSUPPORTED"
    };
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const startTime = performance.now();

    // 1. Check physical hardware presence
    const hardware = await IrHardwareManager.checkHardware();
    if (!hardware.hasEmitter) {
      return {
        success: false,
        command,
        timestamp: Date.now(),
        latencyMs: 0,
        error: "IR hardware not available on this phone. A built-in IR blaster or USB transceiver is required to send infrared optical signals."
      };
    }

    // 2. Lookup code definition
    const codeSet = device.protocol ? IrDatabaseService.getCodeSetById(device.protocol) : null;
    const codeDef = codeSet?.codes[command];

    if (!codeDef) {
      return {
        success: false,
        command,
        timestamp: Date.now(),
        latencyMs: 0,
        error: `IR code for ${command} is not mapped in the ${codeSet?.name || "selected"} code set.`
      };
    }

    // 3. Transmit pulse via hardware bridge
    const transmitResult = await IrHardwareManager.transmitPulse(
      codeDef.frequencyKhz || 38,
      codeDef.timingPulses || [9000, 4500, 560, 1690]
    );

    const latencyMs = Math.round(performance.now() - startTime);

    if (!transmitResult.success) {
      return {
        success: false,
        command,
        timestamp: Date.now(),
        latencyMs,
        error: transmitResult.error || "Failed to pulse IR diode."
      };
    }

    return {
      success: true,
      command,
      value,
      timestamp: Date.now(),
      latencyMs,
      protocol: "ir_consumer"
    };
  }

  async authenticate(
    _device: TvDevice,
    _pin: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    // IR is open optical broadcast; no pairing handshake
    return {
      success: true,
      token: "ir_broadcast_ready"
    };
  }

  async ping(_device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const hardware = await IrHardwareManager.checkHardware();
    return {
      online: hardware.hasEmitter,
      latencyMs: 1,
      error: hardware.hasEmitter ? undefined : "IR transmitter hardware not detected."
    };
  }
}
