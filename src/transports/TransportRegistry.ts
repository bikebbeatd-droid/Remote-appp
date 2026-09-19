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
    this.transports.set("roku", roku);
    this.transports.set("roku_ecp", roku);
    this.transports.set("tizen", tizen);
    this.transports.set("samsung_tizen_ws", tizen);
    this.transports.set("webos", webos);
    this.transports.set("lg_webos_ssap", webos);
    this.transports.set("sony_bravia", sony);
    this.transports.set("sony_ircc_rest", sony);
  }

  static getTransportForDevice(device: TvDevice): RemoteTransport {
    this.initialize();

    // Check by specific protocol first
    if (device.protocol && this.transports.has(device.protocol)) {
      return this.transports.get(device.protocol)!;
    }

    // Check by platform
    if (device.platform && this.transports.has(device.platform)) {
      return this.transports.get(device.platform)!;
    }

    // Never silently route an unknown device to Android TV.
    // An incorrect fallback can send commands to the wrong protocol.
    throw new Error(
      `No verified transport for device platform "${device.platform || "unknown"}" and protocol "${device.protocol || "unknown"}".`
    );
  }
}
