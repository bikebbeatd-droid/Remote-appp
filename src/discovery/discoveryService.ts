import { TvDevice } from "../core/types";
import { DEFAULT_DEVICES } from "../core/constants";
import { TokenVault } from "../pairing/tokenVault";

export class DiscoveryService {
  static async scanNetwork(): Promise<TvDevice[]> {
    try {
      const res = await fetch("/api/devices");
      if (!res.ok) throw new Error("Failed to scan devices");
      const data = await res.json();
      
      const devices: TvDevice[] = (data.devices || []).map((dev: any) => {
        const storedToken = TokenVault.getToken(dev.id);
        const isPaired = !dev.requiresPairing || !!storedToken;
        return {
          ...dev,
          isPaired,
          token: storedToken || dev.token
        };
      });

      return devices;
    } catch {
      // Return empty array when network scan finds no active devices
      return [];
    }
  }

  static async probeIp(ip: string, port?: number, protocol?: string): Promise<{ success: boolean; device?: TvDevice; error?: string }> {
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, port, protocol })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Device not found at specified IP." };
      }

      const dev = data.device;
      const storedToken = TokenVault.getToken(dev.id);
      const isPaired = !dev.requiresPairing || !!storedToken;
      const device: TvDevice = {
        id: dev.id,
        name: dev.name,
        model: dev.model || "Network Smart TV",
        platform: dev.platform || "generic",
        ip: dev.ip,
        port: dev.port,
        protocol: dev.protocol,
        requiresPairing: dev.requiresPairing ?? true,
        isPaired,
        isOnline: true,
        token: storedToken || dev.token,
        capabilities: dev.capabilities || {
          power: "SUPPORTED",
          navigation: "SUPPORTED",
          volume: "SUPPORTED",
          media: "SUPPORTED",
          keyboard: "UNKNOWN",
          touchpad: "UNSUPPORTED",
          apps: "SUPPORTED",
          input: "SUPPORTED",
          voice: "UNSUPPORTED",
          channels: "SUPPORTED",
          ir: "UNSUPPORTED",
          bluetooth: "UNSUPPORTED",
          wifi: "SUPPORTED"
        }
      };

      return { success: true, device };
    } catch (err: any) {
      return { success: false, error: err.message || "Network probe failed" };
    }
  }
}
