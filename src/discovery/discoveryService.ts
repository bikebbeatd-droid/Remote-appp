import { TvDevice } from "../core/types";
import { DEFAULT_DEVICES } from "../core/constants";
import { TokenVault } from "../pairing/tokenVault";
import { AdapterRegistry } from "../adapters/AdapterRegistry";

interface NativeAndroidTvBridge {
  isAvailable?: () => boolean;
  startAndroidTvDiscovery?: () => boolean;
  stopAndroidTvDiscovery?: () => void;
  getAndroidTvDiscoveredDevices?: () => string;
}

function getNativeAndroidTvBridge(): NativeAndroidTvBridge | null {
  try {
    const bridge = (globalThis as any).AndroidRemoteBridge as NativeAndroidTvBridge | undefined;
    if (!bridge) return null;
    if (typeof bridge.isAvailable === "function" && !bridge.isAvailable()) return null;
    return bridge;
  } catch {
    return null;
  }
}


export class DiscoveryService {
  static async scanNativeAndroidTv(timeoutMs = 5000): Promise<TvDevice[]> {
    const bridge = getNativeAndroidTvBridge();
    if (!bridge?.startAndroidTvDiscovery || !bridge.getAndroidTvDiscoveredDevices) return [];

    try {
      if (!bridge.startAndroidTvDiscovery()) return [];
      await new Promise((resolve) => setTimeout(resolve, timeoutMs));
      const raw = bridge.getAndroidTvDiscoveredDevices();
      bridge.stopAndroidTvDiscovery?.();
      const found = JSON.parse(raw || "[]");
      if (!Array.isArray(found)) return [];

      return found
        .filter((dev: any) => typeof dev?.host === "string" && dev.host.length > 0)
        .map((dev: any): TvDevice => {
          const id = `androidtv-${dev.host}`;
          const storedToken = TokenVault.getToken(id);
          return {
            id,
            name: dev.name || "Android TV / Google TV",
            model: dev.model || "Android TV / Google TV",
            brand: dev.brand,
            manufacturer: dev.manufacturer,
            platform: "android_tv",
            ip: dev.host,
            port: Number(dev.port) || 6467,
            protocol: "Android TV Remote Service v2",
            requiresPairing: !storedToken,
            isPaired: !!storedToken,
            isOnline: true,
            token: storedToken || undefined,
            // mDNS discovery proves that an Android TV Remote v2 service is advertised;
            // it does not prove that individual remote capabilities are usable. Capabilities
            // are therefore left UNKNOWN until the authenticated native v2 bridge verifies them.
            capabilities: {
              power: "UNKNOWN", navigation: "UNKNOWN", volume: "UNKNOWN",
              media: "UNKNOWN", keyboard: "UNKNOWN", touchpad: "UNSUPPORTED",
              apps: "UNKNOWN", input: "UNKNOWN", voice: "UNKNOWN",
              channels: "UNKNOWN", ir: "UNSUPPORTED", bluetooth: "UNKNOWN",
              wifi: "UNKNOWN"
            },
            lastSeen: Date.now()
          };
        });
    } catch {
      try { bridge.stopAndroidTvDiscovery?.(); } catch {}
      return [];
    }
  }

  static async scanNetwork(): Promise<TvDevice[]> {
    const nativeAndroidTv = await this.scanNativeAndroidTv();
    try {
      const res = await fetch("/api/devices");
      if (!res.ok) throw new Error("Failed to scan devices");
      const data = await res.json();
      
      const devices: TvDevice[] = (data.devices || []).filter((dev: any) => {
        const platform = typeof dev?.platform === "string" ? dev.platform : "generic";
        // Backend discovery is optional; only accept platforms that have a real adapter.
        // Unknown/generic backend records must not become connectable devices.
        return platform !== "generic" && !!dev?.ip && AdapterRegistry.hasAdapter(platform);
      }).map((dev: any) => {
        const storedToken = TokenVault.getToken(dev.id);
        const isPaired = !dev.requiresPairing || !!storedToken;
        return {
          ...dev,
          isPaired,
          token: storedToken || dev.token
        };
      });

      const merged = new Map<string, TvDevice>();
      for (const device of nativeAndroidTv) merged.set(device.id, device);
      for (const device of devices) {
        const existing = Array.from(merged.values()).find((d) => d.ip === device.ip && d.platform === device.platform);
        if (existing) merged.set(existing.id, { ...existing, ...device, capabilities: existing.capabilities });
        else merged.set(device.id, device);
      }
      return Array.from(merged.values());
    } catch {
      // Native Android TV discovery still works when the optional backend scan is unavailable.
      return nativeAndroidTv;
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
        platform,
        ip: dev.ip,
        port: dev.port,
        protocol: dev.protocol,
        requiresPairing: dev.requiresPairing ?? true,
        isPaired,
        isOnline: true,
        token: storedToken || dev.token,
        // Never invent capabilities when a probe did not verify them.
        capabilities: dev.capabilities || {
          power: "UNKNOWN",
          navigation: "UNKNOWN",
          volume: "UNKNOWN",
          media: "UNKNOWN",
          keyboard: "UNKNOWN",
          touchpad: "UNKNOWN",
          apps: "UNKNOWN",
          input: "UNKNOWN",
          voice: "UNKNOWN",
          channels: "UNKNOWN",
          ir: "UNKNOWN",
          bluetooth: "UNKNOWN",
          wifi: "UNKNOWN"
        }
      };

      return { success: true, device };
    } catch (err: any) {
      return { success: false, error: err.message || "Network probe failed" };
    }
  }
}
