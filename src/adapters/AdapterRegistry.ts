import { TvAdapter } from "./types";
import { AndroidTVAdapter } from "./AndroidTVAdapter";
import { RokuAdapter } from "./roku/RokuAdapter";
import { SamsungTizenAdapter } from "./samsung/SamsungTizenAdapter";
import { LgWebOsAdapter } from "./lg/LgWebOsAdapter";
import { SonyBraviaAdapter } from "./sony/SonyBraviaAdapter";
import { FireTvAdapter, GenericAdapter } from "./generic/GenericAdapter";
import { PanasonicVieraAdapter } from "./panasonic/PanasonicVieraAdapter";
import { PhilipsJointSpaceAdapter } from "./philips/PhilipsJointSpaceAdapter";
import { VizioSmartCastAdapter } from "./vizio/VizioSmartCastAdapter";
import { AppleTvAdapter } from "./apple/AppleTvAdapter";
import { HisenseVidaaAdapter } from "./hisense/HisenseVidaaAdapter";
import { IrUniversalAdapter } from "./ir/IrUniversalAdapter";
import { CompanionWebReceiverAdapter } from "./companion/CompanionAdapter";
import { TvPlatform, TvDevice } from "../core/types";

export class AdapterRegistry {
  private static adapters: Map<string, TvAdapter> = new Map();

  static initialize() {
    if (this.adapters.size > 0) return;

    const androidTv = new AndroidTVAdapter();
    const roku = new RokuAdapter();
    const tizen = new SamsungTizenAdapter();
    const webos = new LgWebOsAdapter();
    const sony = new SonyBraviaAdapter();
    const fireTv = new FireTvAdapter();
    const panasonic = new PanasonicVieraAdapter();
    const philips = new PhilipsJointSpaceAdapter();
    const vizio = new VizioSmartCastAdapter();
    const appleTv = new AppleTvAdapter();
    const hisense = new HisenseVidaaAdapter();
    const irUniversal = new IrUniversalAdapter();
    const companion = new CompanionWebReceiverAdapter();
    const generic = new GenericAdapter();

    this.adapters.set("android_tv", androidTv);
    this.adapters.set("google_tv", androidTv);
    this.adapters.set("roku", roku);
    this.adapters.set("tizen", tizen);
    this.adapters.set("webos", webos);
    this.adapters.set("sony_bravia", sony);
    this.adapters.set("fire_tv", fireTv);
    this.adapters.set("panasonic_viera", panasonic);
    this.adapters.set("philips", philips);
    this.adapters.set("vizio_smartcast", vizio);
    this.adapters.set("apple_tv", appleTv);
    this.adapters.set("hisense_vidaa", hisense);
    this.adapters.set("ir_universal", irUniversal);
    this.adapters.set("companion_web_receiver", companion);
    this.adapters.set("generic", generic);
  }

  static hasAdapter(platform: string): boolean {
    this.initialize();
    return this.adapters.has(platform);
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
