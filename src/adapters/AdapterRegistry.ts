import { TvAdapter } from "./types";
import { AndroidTvAdapter } from "./android_tv/AndroidTvAdapter";
import { RokuAdapter } from "./roku/RokuAdapter";
import { SamsungTizenAdapter } from "./samsung/SamsungTizenAdapter";
import { LgWebOsAdapter } from "./lg/LgWebOsAdapter";
import { SonyBraviaAdapter } from "./sony/SonyBraviaAdapter";
import { FireTvAdapter, GenericAdapter } from "./generic/GenericAdapter";
import { TvPlatform, TvDevice } from "../core/types";

export class AdapterRegistry {
  private static adapters: Map<string, TvAdapter> = new Map();

  static initialize() {
    if (this.adapters.size > 0) return;

    const androidTv = new AndroidTvAdapter();
    const roku = new RokuAdapter();
    const tizen = new SamsungTizenAdapter();
    const webos = new LgWebOsAdapter();
    const sony = new SonyBraviaAdapter();
    const fireTv = new FireTvAdapter();
    const generic = new GenericAdapter();

    this.adapters.set("android_tv", androidTv);
    this.adapters.set("google_tv", androidTv);
    this.adapters.set("roku", roku);
    this.adapters.set("tizen", tizen);
    this.adapters.set("webos", webos);
    this.adapters.set("sony_bravia", sony);
    this.adapters.set("fire_tv", fireTv);
    this.adapters.set("generic", generic);
  }

  static getAdapter(platform: TvPlatform | string): TvAdapter {
    this.initialize();
    return this.adapters.get(platform) || this.adapters.get("generic")!;
  }

  static getAdapterForDevice(device: TvDevice): TvAdapter {
    this.initialize();
    if (device.platform && this.adapters.has(device.platform)) {
      return this.adapters.get(device.platform)!;
    }
    return this.adapters.get("generic")!;
  }
}
