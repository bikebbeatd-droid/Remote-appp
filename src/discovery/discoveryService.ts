import { TvDevice } from "../core/types";
import { DEFAULT_DEVICES } from "../core/constants";
import { TokenVault } from "../pairing/tokenVault";
import { AdapterRegistry } from "../adapters/AdapterRegistry";
import { validateTvTarget } from "../core/networkValidation";

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
            isOnline: false,
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
    const target = validateTvTarget(ip, port);
    if (!target.valid) return { success: false, error: target.error || "Invalid TV target." };

    const normalizedProtocol = String(protocol || "").toLowerCase();
    const platform: TvDevice["platform"] =
      normalizedProtocol.includes("roku") ? "roku" :
      normalizedProtocol.includes("tizen") || normalizedProtocol.includes("samsung") ? "tizen" :
      normalizedProtocol.includes("webos") || normalizedProtocol.includes("lg") ? "webos" :
      normalizedProtocol.includes("sony") ? "sony_bravia" :
      normalizedProtocol.includes("android") || normalizedProtocol.includes("google") ? "android_tv" :
      "generic";

    if (platform === "generic" || !AdapterRegistry.hasAdapter(platform)) {
      return {
        success: false,
        error: "No verified direct adapter is available for this protocol. Select Roku, Samsung Tizen, LG webOS, Sony BRAVIA, or Android TV."
      };
    }

    const defaults: Record<string, { port: number; protocol: string; name: string; brand: string; requiresPairing: boolean }> = {
      roku: { port: 8060, protocol: "roku_ecp", name: "Roku", brand: "Roku", requiresPairing: false },
      tizen: { port: 8001, protocol: "samsung_tizen_ws", name: "Samsung Smart TV", brand: "Samsung", requiresPairing: false },
      webos: { port: 3000, protocol: "lg_webos_ssap", name: "LG Smart TV", brand: "LG", requiresPairing: true },
      sony_bravia: { port: 80, protocol: "sony_ircc_rest", name: "Sony BRAVIA", brand: "Sony", requiresPairing: true },
      android_tv: { port: 6467, protocol: "android_tv_receiver", name: "Android TV / Google TV", brand: "Android TV", requiresPairing: true }
    };
    const d = defaults[platform];
    const actualPort = port || d.port;
    const actualProtocol = protocol || d.protocol;
    const id = platform + "-" + ip.replace(/\./g, "-") + "-" + actualPort;
    const storedToken = TokenVault.getToken(id);

    const candidate: TvDevice = {
      id,
      name: d.name,
      brand: d.brand,
      manufacturer: d.brand,
      model: "Pending verification",
      platform,
      ip,
      port: actualPort,
      protocol: actualProtocol,
      requiresPairing: platform === "roku" ? false : d.requiresPairing,
      isPaired: platform === "roku" ? true : Boolean(storedToken),
      isOnline: false,
      token: storedToken || undefined,
      capabilities: AdapterRegistry.getAdapter(platform).getCapabilities()
    };

    try {
      const adapter = AdapterRegistry.getAdapter(platform);
      const ping = await adapter.ping(candidate);
      if (!ping.online) {
        return {
          success: false,
          error: ping.error || "No verified response from " + d.name + " at " + ip + ":" + actualPort + "."
        };
      }

      return {
        success: true,
        device: {
          ...candidate,
          isOnline: true,
          lastSeen: Date.now()
        }
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to verify " + d.name + " at " + ip + ":" + actualPort + "."
      };
    }
  }}
