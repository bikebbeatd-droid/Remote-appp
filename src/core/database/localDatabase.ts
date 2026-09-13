import { TvDevice } from "../types";

export interface RemoteProfile {
  id: string;
  name: string;
  deviceId?: string;
  accentColor: string;
  hapticFeedback: boolean;
  repeatRateMs: number;
}

export interface CustomButtonMapping {
  id: string;
  label: string;
  icon?: string;
  command: string;
  value?: any;
}

export class LocalDatabase {
  private static readonly DEVICES_KEY = "usr_saved_devices_v2";
  private static readonly ACTIVE_ID_KEY = "usr_active_device_id_v2";
  private static readonly PROFILES_KEY = "usr_profiles_v2";
  private static readonly MAPPINGS_KEY = "usr_button_mappings_v2";

  static getDevices(): TvDevice[] {
    try {
      const data = localStorage.getItem(this.DEVICES_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static saveDevices(devices: TvDevice[]): void {
    try {
      localStorage.setItem(this.DEVICES_KEY, JSON.stringify(devices || []));
    } catch {}
  }

  static getActiveDeviceId(): string | null {
    try {
      return localStorage.getItem(this.ACTIVE_ID_KEY);
    } catch {
      return null;
    }
  }

  static setActiveDeviceId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(this.ACTIVE_ID_KEY, id);
      } else {
        localStorage.removeItem(this.ACTIVE_ID_KEY);
      }
    } catch {}
  }

  static getProfiles(): RemoteProfile[] {
    try {
      const data = localStorage.getItem(this.PROFILES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: "profile_default",
        name: "Standard Remote",
        accentColor: "indigo",
        hapticFeedback: true,
        repeatRateMs: 150
      }
    ];
  }

  static saveProfiles(profiles: RemoteProfile[]): void {
    try {
      localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles || []));
    } catch {}
  }

  static getCustomButtonMappings(): CustomButtonMapping[] {
    try {
      const data = localStorage.getItem(this.MAPPINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  static saveCustomButtonMappings(mappings: CustomButtonMapping[]): void {
    try {
      localStorage.setItem(this.MAPPINGS_KEY, JSON.stringify(mappings || []));
    } catch {}
  }
}
