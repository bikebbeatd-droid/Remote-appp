import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";

function baseUrl(device: TvDevice): string {
  if (!device.ip || device.ip === "127.0.0.1" || device.ip === "localhost") {
    throw new Error("LOCAL_RECEIVER_REQUIRES_REAL_TV_LAN_IP");
  }
  const port = Number(device.port) || 8765;
  return `http://${device.ip}:${port}`;
}

export class CompanionWebReceiverAdapter implements TvAdapter {
  readonly platform = "companion_web_receiver";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "SUPPORTED", navigation: "SUPPORTED",
      volume: "SUPPORTED", media: "SUPPORTED",
      keyboard: "SUPPORTED", touchpad: "UNSUPPORTED",
      apps: "SUPPORTED", input: "SUPPORTED",
      voice: "UNSUPPORTED", channels: "SUPPORTED",
      ir: "UNSUPPORTED", bluetooth: "UNSUPPORTED", wifi: "SUPPORTED"
    };
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const started = performance.now();
    try {
      if (!device.token) throw new Error("PAIRING_REQUIRED");
      const response = await fetch(`${baseUrl(device)}/command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${device.token}`
        },
        body: JSON.stringify({ command, value })
      });
      const latencyMs = Math.round(performance.now() - started);
      const body = await response.json().catch(() => ({}));
      return {
        success: response.ok && body?.ok === true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "companion_local_http",
        error: response.ok && body?.ok === true ? undefined : String(body?.error || `HTTP_${response.status}`),
        deviceId: device.id
      } as CommandExecutionResult;
    } catch (error: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - started),
        protocol: "companion_local_http",
        error: error?.message || "LOCAL_RECEIVER_UNREACHABLE",
        deviceId: device.id
      } as CommandExecutionResult;
    }
  }

  async authenticate(device: TvDevice, pin: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const response = await fetch(`${baseUrl(device)}/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.ok !== true || typeof body?.token !== "string" || body.token.length < 32) {
        return { success: false, error: String(body?.error || `PAIRING_HTTP_${response.status}`) };
      }
      return { success: true, token: body.token };
    } catch (error: any) {
      return { success: false, error: error?.message || "LOCAL_RECEIVER_UNREACHABLE" };
    }
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const started = performance.now();
    try {
      const response = await fetch(`${baseUrl(device)}/ping`, { method: "GET", cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      return {
        online: response.ok && body?.ok === true,
        latencyMs: Math.round(performance.now() - started),
        error: response.ok && body?.ok === true ? undefined : `HTTP_${response.status}`
      };
    } catch (error: any) {
      return { online: false, latencyMs: Math.round(performance.now() - started), error: error?.message || "LOCAL_RECEIVER_UNREACHABLE" };
    }
  }

  async getDeviceInfo(device: TvDevice) {
    const ping = await this.ping(device);
    return { isAlive: ping.online, model: "Universal Smart TV Remote Receiver", manufacturer: "Universal Smart TV Remote" };
  }
}
