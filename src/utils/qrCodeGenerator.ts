import QRCode from "qrcode";
import { TvDevice } from "../core/types";

export interface TvPairingPayload {
  type: "USTV_PAIR";
  version: 2;
  deviceId: string;
  name: string;
  ip?: string;
  port?: number;
  protocol: string;
  pairingRequired: boolean;
  timestamp: number;
  connectUrl: string;
}

function isUsableTvIp(ip?: string): ip is string {
  if (!ip) return false;
  const value = ip.trim();
  return value !== "" && value !== "127.0.0.1" && value !== "localhost";
}

/**
 * Builds a versioned QR payload containing only verified connection metadata.
 * Pairing secrets/PINs are deliberately excluded.
 */
export function buildTvPairingPayload(device: TvDevice | null): {
  payload: TvPairingPayload;
  pairingUrl: string;
  rawJson: string;
} {
  if (!device?.id || !device.protocol) {
    throw new Error("A verified TV device is required before generating a pairing QR code.");
  }

  const params = new URLSearchParams();
  params.set("v", "2");
  params.set("dev", device.id);
  params.set("name", device.name);
  params.set("proto", device.protocol);
  params.set("pairing", device.requiresPairing ? "1" : "0");
  params.set("ts", String(Date.now()));

  if (isUsableTvIp(device.ip)) params.set("ip", device.ip);
  if (Number.isInteger(device.port) && device.port > 0 && device.port <= 65535) {
    params.set("port", String(device.port));
  }

  const pairingUrl = `remoteapp://pair?${params.toString()}`;
  const payload: TvPairingPayload = {
    type: "USTV_PAIR",
    version: 2,
    deviceId: device.id,
    name: device.name,
    ...(isUsableTvIp(device.ip) ? { ip: device.ip } : {}),
    ...(Number.isInteger(device.port) && device.port > 0 && device.port <= 65535 ? { port: device.port } : {}),
    protocol: device.protocol,
    pairingRequired: Boolean(device.requiresPairing && !device.isPaired),
    timestamp: Date.now(),
    connectUrl: pairingUrl
  };

  return { payload, pairingUrl, rawJson: JSON.stringify(payload) };
}

export async function generateQrDataUrl(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      scale: 8,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
      ...options
    });
  } catch (err) {
    console.error("Error generating QR data URL:", err);
    return "";
  }
}

export async function generateQrSvgString(
  text: string,
  options?: QRCode.QRCodeToStringOptions
): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
      ...options
    });
  } catch (err) {
    console.error("Error generating QR SVG:", err);
    return "";
  }
}
