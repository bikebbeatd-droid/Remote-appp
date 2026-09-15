import QRCode from "qrcode";
import { TvDevice } from "../core/types";

export interface TvPairingPayload {
  type: "USTV_PAIR";
  version: number;
  deviceId: string;
  name: string;
  ip: string;
  port: number;
  protocol: string;
  pin?: string | null;
  timestamp: number;
  connectUrl: string;
}

/**
 * Construct universal pairing payload and link for Smart TVs
 */
export function buildTvPairingPayload(
  device: TvDevice | null,
  pairingPin?: string | null
): { payload: TvPairingPayload; pairingUrl: string; rawJson: string } {
  const resolvedIp = device?.ip && device.ip !== "127.0.0.1" && device.ip !== "localhost"
    ? device.ip
    : typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? window.location.hostname
    : "";
  const port = device?.port || 6467;
  const protocol = device?.protocol || "android_tv_receiver";
  const deviceId = device?.id || `tv_${resolvedIp ? resolvedIp.replace(/\./g, "_") : "target"}`;
  const name = device?.name || "Smart TV";
  const pin = pairingPin || "4821";

  // Build standard deep link / web link that auto-connects
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pairingUrl = `${origin}/?pair=true&dev=${encodeURIComponent(deviceId)}&name=${encodeURIComponent(name)}&ip=${encodeURIComponent(resolvedIp)}&port=${port}&proto=${encodeURIComponent(protocol)}&pin=${encodeURIComponent(pin)}`;

  const payload: TvPairingPayload = {
    type: "USTV_PAIR",
    version: 1,
    deviceId,
    name,
    ip: resolvedIp,
    port,
    protocol,
    pin,
    timestamp: Date.now(),
    connectUrl: pairingUrl
  };

  return {
    payload,
    pairingUrl,
    rawJson: JSON.stringify(payload)
  };
}

/**
 * Generate real, crisp QR code as PNG data URL
 */
export async function generateQrDataUrl(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      scale: 8,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff"
      },
      ...options
    });
  } catch (err) {
    console.error("Error generating QR data URL:", err);
    return "";
  }
}

/**
 * Generate real, scalable QR code as SVG string
 */
export async function generateQrSvgString(
  text: string,
  options?: QRCode.QRCodeToStringOptions
): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff"
      },
      ...options
    });
  } catch (err) {
    console.error("Error generating QR SVG:", err);
    return "";
  }
}
