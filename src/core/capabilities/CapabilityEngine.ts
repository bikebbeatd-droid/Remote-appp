import { TvDevice, RemoteCommandType, CapabilityStatus, DeviceCapabilities } from "../types";
import { COMMAND_CAPABILITY_MAP, CAPABILITY_LABELS } from "../capabilities";

export interface CapabilityCheckResult {
  allowed: boolean;
  status: CapabilityStatus;
  reason?: string;
}

export class CapabilityEngine {
  /**
   * Checks whether a specific command is supported by the target TV device.
   * Never assumes or fakes functionality.
   */
  static checkCommand(device: TvDevice | null, command: RemoteCommandType): CapabilityCheckResult {
    if (!device) {
      return {
        allowed: false,
        status: "UNSUPPORTED",
        reason: "No TV is currently connected. Please scan Wi-Fi or select a device first."
      };
    }

    if (device.requiresPairing && !device.isPaired) {
      return {
        allowed: false,
        status: "REQUIRES_PAIRING",
        reason: `Pairing required: Please authenticate with ${device.name} before sending commands.`
      };
    }

    const capabilityKey = COMMAND_CAPABILITY_MAP[command];
    if (!capabilityKey) {
      return { allowed: true, status: "SUPPORTED" };
    }

    const status = device.capabilities[capabilityKey];

    switch (status) {
      case "SUPPORTED":
        return { allowed: true, status: "SUPPORTED" };

      case "UNSUPPORTED":
        return {
          allowed: false,
          status: "UNSUPPORTED",
          reason: `${CAPABILITY_LABELS[capabilityKey]} is not supported by ${device.platform.replace(/_/g, " ").toUpperCase()} on this TV.`
        };

      case "REQUIRES_HARDWARE":
        return {
          allowed: false,
          status: "REQUIRES_HARDWARE",
          reason: `Hardware required: Your phone or TV lacks the physical hardware (e.g., IR blaster) for ${CAPABILITY_LABELS[capabilityKey]}.`
        };

      case "REQUIRES_PAIRING":
        return {
          allowed: false,
          status: "REQUIRES_PAIRING",
          reason: `Security handshake required for ${CAPABILITY_LABELS[capabilityKey]}.`
        };

      case "UNKNOWN":
      default:
        return {
          allowed: true,
          status: "UNKNOWN",
          reason: `Capability status for ${CAPABILITY_LABELS[capabilityKey]} is unverified for this device.`
        };
    }
  }

  /**
   * Checks whether an entire remote mode is supported by the target device.
   */
  static checkMode(device: TvDevice | null, mode: string): CapabilityCheckResult {
    if (!device) {
      return {
        allowed: false,
        status: "UNSUPPORTED",
        reason: "No TV is currently connected."
      };
    }

    switch (mode) {
      case "touchpad":
        if (device.capabilities.touchpad !== "SUPPORTED") {
          return {
            allowed: false,
            status: device.capabilities.touchpad || "UNSUPPORTED",
            reason: "Touchpad isn't supported by this TV."
          };
        }
        return { allowed: true, status: "SUPPORTED" };

      case "keyboard":
        if (device.capabilities.keyboard === "UNSUPPORTED") {
          return {
            allowed: false,
            status: "UNSUPPORTED",
            reason: "Keyboard text input is not supported by this TV."
          };
        }
        return { allowed: true, status: device.capabilities.keyboard };

      case "voice":
        if (device.capabilities.voice !== "SUPPORTED") {
          return {
            allowed: false,
            status: device.capabilities.voice || "UNSUPPORTED",
            reason: "Voice control is not supported by this TV."
          };
        }
        return { allowed: true, status: "SUPPORTED" };

      case "apps":
        if (device.capabilities.apps !== "SUPPORTED") {
          return {
            allowed: false,
            status: device.capabilities.apps || "UNSUPPORTED",
            reason: "Direct app launching is not supported by this TV."
          };
        }
        return { allowed: true, status: "SUPPORTED" };

      default:
        return { allowed: true, status: "SUPPORTED" };
    }
  }
}
