import { TvDevice, RemoteCommandType, CapabilityStatus } from "../types";
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

      case "REQUIRES_NATIVE_BRIDGE":
        return {
          allowed: false,
          status: "REQUIRES_NATIVE_BRIDGE",
          reason: `Native bridge required: ${CAPABILITY_LABELS[capabilityKey]} requires the Android native companion bridge on this phone.`
        };

      case "DEVICE_DEPENDENT":
        return {
          allowed: false,
          status: "DEVICE_DEPENDENT",
          reason: `${CAPABILITY_LABELS[capabilityKey]} is device-dependent and unverified on this TV model.`
        };

      case "UNKNOWN":
      default:
        return {
          allowed: false,
          status: "UNKNOWN",
          reason: `Capability status for ${CAPABILITY_LABELS[capabilityKey]} is unverified for this device; the app will not claim or send an unverified command.`
        };
    }
  }

  /**
   * Checks whether an entire remote mode is supported by the target device.
   * Composite modes are derived from authoritative device capabilities; they
   * never imply that an individual unsupported command can be executed.
   */
  static checkMode(device: TvDevice | null, mode: string): CapabilityCheckResult {
    if (!device) {
      return {
        allowed: false,
        status: "UNSUPPORTED",
        reason: "No TV is currently connected."
      };
    }

    const capability = (key: keyof typeof device.capabilities): CapabilityCheckResult => {
      const status = device.capabilities[key];
      if (status === "SUPPORTED") {
        return { allowed: true, status: "SUPPORTED" };
      }
      return {
        allowed: false,
        status: status || "UNKNOWN",
        reason: `${String(key)} mode capability is not verified for this device.`
      };
    };

    switch (mode) {
      case "classic":
      case "dpad":
      case "gaming":
      case "accessibility":
        return capability("navigation");

      case "media":
        return capability("media");

      case "keyboard":
        return capability("keyboard");

      case "voice":
        return capability("voice");

      case "apps":
        return capability("apps");

      case "touchpad":
        return capability("touchpad");

      case "numberpad":
        return capability("channels");

      case "custom":
        // The builder itself is usable, but execution remains command/capability
        // validated by CommandEngine. This mode must not advertise unsupported
        // controls as executable.
        return { allowed: true, status: "SUPPORTED" };

      default:
        return { allowed: false, status: "UNKNOWN", reason: `Remote mode "${mode}" is not explicitly verified for this device.` };
    }
  }
}
