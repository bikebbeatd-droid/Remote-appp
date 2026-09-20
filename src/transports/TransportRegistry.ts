import { RemoteTransport } from "./types";
import { AndroidTvReceiverTransport } from "./AndroidTvReceiverTransport";
import { RokuEcpTransport } from "./RokuEcpTransport";
import { SamsungTizenTransport, LgWebOsTransport, SonyBraviaTransport } from "./OtherPlatformTransports";
import { TvDevice } from "../core/types";

export class TransportRegistry {
  private static transports: Map<string, RemoteTransport> = new Map();

  static initialize() {
    if (this.transports.size > 0) return;

    const androidTv = new AndroidTvReceiverTransport();
    const roku = new RokuEcpTransport();
    const tizen = new SamsungTizenTransport();
    const webos = new LgWebOsTransport();
    const sony = new SonyBraviaTransport();

    this.transports.set("android_tv_receiver", androidTv);
    this.transports.set("android_tv", androidTv);
    this.transports.set("google_tv", androidTv);
    this.transports.set("android tv remote service v2", androidTv);
    this.transports.set("android tv remote service", androidTv);

    this.transports.set("roku", roku);
    this.transports.set("roku_ecp", roku);
    this.transports.set("roku ecp", roku);
    this.transports.set("roku external control protocol", roku);

    this.transports.set("tizen", tizen);
    this.transports.set("samsung_tizen_ws", tizen);
    this.transports.set("samsung smart tv websocket", tizen);
    this.transports.set("samsung tizen websocket", tizen);

    this.transports.set("webos", webos);
    this.transports.set("lg_webos_ssap", webos);
    this.transports.set("lg webos ssap", webos);
    this.transports.set("lg webos", webos);

    this.transports.set("sony_bravia", sony);
    this.transports.set("sony_ircc_rest", sony);
    this.transports.set("sony bravia ircc", sony);
  }

  static getTransportForDevice(device: TvDevice): RemoteTransport {
    this.initialize();

    const rawProtocol = String(device.protocol || "").trim();
    const exactProtocol = rawProtocol.toLowerCase();

    if (rawProtocol && this.transports.has(rawProtocol)) {
      return this.transports.get(rawProtocol)!;
    }

    if (exactProtocol && this.transports.has(exactProtocol)) {
      return this.transports.get(exactProtocol)!;
    }

    // QR codes and discovery sources can use descriptive protocol names.
    // Normalize only known vendor/protocol families; never fall back to a
    // different vendor's transport.
    const normalized = exactProtocol.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

    if (normalized.includes("roku") && (normalized.includes("ecp") || normalized.includes("external control"))) {
      return this.transports.get("roku")!;
    }
    if (normalized.includes("android tv") && normalized.includes("remote")) {
      return this.transports.get("android_tv")!;
    }
    if (normalized.includes("samsung") && (normalized.includes("tizen") || normalized.includes("websocket"))) {
      return this.transports.get("tizen")!;
    }
    if (normalized.includes("lg") && normalized.includes("webos")) {
      return this.transports.get("webos")!;
    }
    if (normalized.includes("sony") && normalized.includes("bravia")) {
      return this.transports.get("sony_bravia")!;
    }

    if (device.platform && this.transports.has(device.platform)) {
      return this.transports.get(device.platform)!;
    }

    throw new Error(
      `No verified transport for device platform "${device.platform || "unknown"}" and protocol "${rawProtocol || "unknown"}".`
    );
  }
}
