import { TvPlatform, DeviceCapabilities, RemoteCommandType } from "../core/types";

export type DeviceCategory = 
  | "tv"
  | "streaming_box"
  | "streaming_stick"
  | "set_top_box"
  | "soundbar"
  | "projector"
  | "av_receiver";

export type ConnectionProtocol =
  | "android_tv_v2"
  | "google_cast"
  | "samsung_smartview_ws"
  | "samsung_legacy_tizen"
  | "lg_ssap_ws"
  | "lg_netcast"
  | "roku_ecp"
  | "fire_tv_whisperplay"
  | "sony_ircc_rest"
  | "panasonic_viera_rest"
  | "philips_jointspace_rest"
  | "vizio_smartcast_https"
  | "apple_companion_mrp"
  | "hisense_vidaa_ws"
  | "ir_consumer"
  | "upnp_av_transport";

export type PairingMechanism =
  | "NONE"
  | "PIN_CHALLENGE"
  | "POPUP_CONFIRM"
  | "PSK_SECRET"
  | "RSA_TLS_FINGERPRINT"
  | "IR_CODE_MATCH";

export interface DeviceProfile {
  id: string;
  brand: string;
  series: string;
  model: string;
  yearRange: string;
  category: DeviceCategory;
  platform: TvPlatform;
  protocol: ConnectionProtocol;
  defaultPort: number;
  discoveryMethod: string;
  pairingMethod: PairingMechanism;
  authDescription: string;
  defaultCapabilities: DeviceCapabilities;
  supportedInputSources: string[];
  supportedAppDeepLinks: Array<{ id: string; name: string; appCode?: string }>;
  irCodeSetId?: string;
  notes?: string;
  verified: boolean;
  tvSettingsRequired?: string[];
  phonePermissionsRequired?: string[];
}

export interface IRCodeDefinition {
  command: RemoteCommandType;
  frequencyKhz: number;
  protocolType: "NEC" | "RC5" | "RC6" | "SONY" | "SAMSUNG" | "PRONTO_HEX";
  codeHex: string;
  timingPulses?: number[];
}

export interface IRCodeSet {
  id: string;
  brand: string;
  deviceType: DeviceCategory;
  name: string;
  codes: Partial<Record<RemoteCommandType, IRCodeDefinition>>;
}

export interface GlobalSearchFilter {
  query?: string;
  brand?: string;
  category?: DeviceCategory;
  platform?: TvPlatform;
  year?: string;
}
