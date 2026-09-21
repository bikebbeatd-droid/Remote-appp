import QRCode from "qrcode";
import jsQR from "jsqr";
import { TvDevice } from "../core/types";
import { validateTvTarget } from "../core/networkValidation";

export interface TvPairingPayload {
  type: "USTV_PAIR";
  version: 2;
  deviceId: string;
  name: string;
  ip: string;
  port: number;
  protocol: string;
  pairingRequired: boolean;
  timestamp: number;
}

function isPrivateLanIpv4(ip: string): boolean {
  const parts = ip.trim().split(".").map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function validatePayload(raw: any): { success: boolean; error?: string; data?: TvPairingPayload } {
  if (!raw || raw.type !== "USTV_PAIR" || raw.version !== 2) {
    return { success: false, error: "Unsupported or invalid TV QR format." };
  }

  const ip = typeof raw.ip === "string" ? raw.ip.trim() : "";
  const port = Number(raw.port);
  const protocol = typeof raw.protocol === "string" ? raw.protocol.trim() : "";
  const deviceId = typeof raw.deviceId === "string" ? raw.deviceId.trim() : "";
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 100) : "Smart TV";
  const timestamp = Number(raw.timestamp);

  if (!deviceId || deviceId.length > 128 || !protocol || protocol.length > 100 || !ip) return { success: false, error: "TV QR is missing verified device connection information." };
  if (ip === "127.0.0.1" || ip === "localhost") return { success: false, error: "127.0.0.1/localhost is the phone backend, not the TV." };
  if (!isPrivateLanIpv4(ip)) return { success: false, error: "TV QR must contain a private LAN IPv4 address." };
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { success: false, error: "TV QR contains an invalid port." };
  if (!Number.isFinite(timestamp) || timestamp <= 0) return { success: false, error: "TV QR is missing a valid timestamp." };
  const maxAgeMs = 10 * 60 * 1000;
  if (Math.abs(Date.now() - timestamp) > maxAgeMs) return { success: false, error: "TV QR has expired. Generate a fresh QR code." };

  const target = validateTvTarget(ip, port);
  if (!target.valid) return { success: false, error: target.error || "Unsafe TV target." };

  return {
    success: true,
    data: {
      type: "USTV_PAIR",
      version: 2,
      deviceId,
      name,
      ip,
      port,
      protocol,
      pairingRequired: Boolean(raw.pairingRequired),
      timestamp
    }
  };
}

export class QrPairingService {
  static createPairingPayload(device: Partial<TvDevice> | null): string {
    if (!device?.id || !device?.ip || !device.protocol) {
      throw new Error("A verified TV IP and protocol are required before generating a QR code.");
    }
    const ip = device.ip.trim();
    const port = Number(device.port);
    const validation = validatePayload({
      type: "USTV_PAIR",
      version: 2,
      deviceId: device.id,
      name: device.name || "Smart TV",
      ip,
      port,
      protocol: device.protocol,
      pairingRequired: Boolean(device.requiresPairing && !device.isPaired),
      timestamp: Date.now()
    });
    if (!validation.success || !validation.data) throw new Error(validation.error || "Invalid TV pairing payload.");
    return JSON.stringify(validation.data);
  }

  static async generateQrDataUrl(text: string, size = 256): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: size,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M"
      });
    } catch (err) {
      console.error("Failed to generate QR Code:", err);
      return "";
    }
  }

  static parsePairingPayload(rawText: string): {
    success: boolean;
    data?: TvPairingPayload;
    error?: string;
  } {
    const text = rawText.trim();
    if (!text) return { success: false, error: "Empty QR code data." };

    try {
      if (text.startsWith("remoteapp://pair")) {
        const url = new URL(text);
        const p = url.searchParams;
        const parsed = {
          type: "USTV_PAIR",
          version: Number(p.get("v")),
          deviceId: p.get("dev") || "",
          name: p.get("name") || "Smart TV",
          ip: p.get("ip") || "",
          port: Number(p.get("port")),
          protocol: p.get("proto") || "",
          pairingRequired: p.get("pairing") === "1",
          timestamp: Number(p.get("ts")) || 0
        };
        return validatePayload(parsed);
      }

      if (text.startsWith("{") && text.endsWith("}")) {
        return validatePayload(JSON.parse(text));
      }
    } catch {
      return { success: false, error: "QR data could not be parsed." };
    }

    return {
      success: false,
      error: "This is not a Universal Smart TV QR code. Scan the QR shown by the TV app."
    };
  }

  static decodeFromImageData(imageData: ImageData): string | null {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
      return code ? code.data : null;
    } catch {
      return null;
    }
  }

  static async decodeFromFile(file: File | Blob): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          resolve(this.decodeFromImageData(ctx.getImageData(0, 0, img.width, img.height)));
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }
}
