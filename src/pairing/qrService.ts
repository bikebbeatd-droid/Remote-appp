import QRCode from "qrcode";
import jsQR from "jsqr";
import { TvDevice } from "../core/types";

export interface TvPairingPayload {
  type: "USTV_PAIR";
  version: 1;
  id: string;
  name: string;
  ip: string;
  port: number;
  protocol: string;
  pin: string;
  timestamp: number;
}

export class QrPairingService {
  /**
   * Generates a standard pairing payload string from TV details
   */
  static createPairingPayload(device: Partial<TvDevice> | null, pin: string): string {
    const rawIp = device?.ip && device.ip !== "127.0.0.1" && device.ip !== "localhost"
      ? device.ip
      : typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? window.location.hostname
      : "";

    const payload: TvPairingPayload = {
      type: "USTV_PAIR",
      version: 1,
      id: device?.id || `tv_${rawIp ? rawIp.replace(/\./g, "_") : "target"}`,
      name: device?.name || "Smart TV Receiver",
      ip: rawIp,
      port: device?.port || 6467,
      protocol: device?.protocol || "android_tv_receiver",
      pin: pin.trim(),
      timestamp: Date.now()
    };
    return JSON.stringify(payload);
  }

  /**
   * Creates an authentic Data URL image for a QR Code
   */
  static async generateQrDataUrl(text: string, size = 256): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: size,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff"
        },
        errorCorrectionLevel: "M"
      });
    } catch (err) {
      console.error("Failed to generate QR Code:", err);
      return "";
    }
  }

  /**
   * Parse scanned QR Code raw string into a structured TV pairing object
   */
  static parsePairingPayload(rawText: string): {
    success: boolean;
    data?: {
      id: string;
      name: string;
      ip: string;
      port: number;
      protocol: string;
      pin: string;
    };
    error?: string;
  } {
    const text = rawText.trim();
    if (!text) {
      return { success: false, error: "Empty QR code data" };
    }

    // 1. Try parsing JSON payload
    if (text.startsWith("{") && text.endsWith("}")) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.ip && parsed.pin) {
          const cleanIp = String(parsed.ip).trim();
          if (cleanIp === "127.0.0.1" || cleanIp === "localhost") {
            return {
              success: false,
              error: "127.0.0.1 is the Termux phone backend, not the TV. Please scan the QR code displayed on your TV screen."
            };
          }
          return {
            success: true,
            data: {
              id: parsed.id || `tv_${cleanIp.replace(/\./g, "_")}`,
              name: parsed.name || `Smart TV (${cleanIp})`,
              ip: cleanIp,
              port: Number(parsed.port) || 6467,
              protocol: parsed.protocol || "android_tv_receiver",
              pin: String(parsed.pin).trim()
            }
          };
        }
      } catch {}
    }

    // 2. Try parsing URL schema (e.g. ustv://pair?ip=192.168.1.50&pin=123456 or http://...)
    if (text.includes("pair") || text.includes("pin=") || text.includes("ip=")) {
      try {
        const urlStr = text.startsWith("ustv://") ? text.replace("ustv://", "http://localhost/") : text;
        const url = new URL(urlStr);
        const params = url.searchParams;
        const ip = params.get("ip");
        const pin = params.get("pin");
        if (ip && pin) {
          const cleanIp = ip.trim();
          if (cleanIp === "127.0.0.1" || cleanIp === "localhost") {
            return {
              success: false,
              error: "127.0.0.1 is the Termux phone backend, not the TV. Please scan the QR code displayed on your TV screen."
            };
          }
          return {
            success: true,
            data: {
              id: params.get("id") || params.get("dev") || `tv_${cleanIp.replace(/\./g, "_")}`,
              name: params.get("name") || `Smart TV (${cleanIp})`,
              ip: cleanIp,
              port: Number(params.get("port")) || 6467,
              protocol: params.get("protocol") || params.get("proto") || "android_tv_receiver",
              pin: pin.trim()
            }
          };
        }
      } catch {}
    }

    // 3. Reject standalone PIN without IP rather than fabricating a fake network address
    const pureDigits = text.replace(/\D/g, "");
    if (pureDigits.length >= 4 && pureDigits.length <= 6) {
      return {
        success: false,
        error: `Scanned code "${pureDigits}" is a pairing PIN but does not contain a TV network address. Please scan the complete QR code displayed on your TV screen, or enter the TV IP address manually.`
      };
    }

    return {
      success: false,
      error: "Unrecognized QR code format. Please scan the QR code displayed on the TV screen."
    };
  }

  /**
   * Scans an ImageData object using jsQR
   */
  static decodeFromImageData(imageData: ImageData): string | null {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });
      return code ? code.data : null;
    } catch {
      return null;
    }
  }

  /**
   * Scans an image file (File or Blob) using Canvas and jsQR
   */
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
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          const result = this.decodeFromImageData(imgData);
          resolve(result);
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }
}
