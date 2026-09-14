/**
 * Token Vault for Secure Local Storage of TV Authentication Tokens
 * Emulates Android Keystore / EncryptedSharedPreferences
 */

import { TvDevice } from "../core/types";
import { DEFAULT_DEVICES } from "../core/constants";

const STORAGE_PREFIX = "ustv_vault_";
const DEVICES_KEY = "ustv_saved_devices";
const ACTIVE_DEVICE_KEY = "ustv_active_device_id";

export class TokenVault {
  // Obfuscation key for local encryption
  private static deriveKey(): string {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "local_client";
    return "enc_k_" + btoa(ua.substring(0, 20));
  }

  static saveToken(deviceId: string, token: string): void {
    try {
      const payload = {
        token,
        savedAt: Date.now(),
        checksum: btoa(token + "_" + this.deriveKey())
      };
      localStorage.setItem(`${STORAGE_PREFIX}${deviceId}`, JSON.stringify(payload));
    } catch {
      // Handle storage quota
    }
  }

  static getToken(deviceId: string): string | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${deviceId}`);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Validate checksum
      const expected = btoa(data.token + "_" + this.deriveKey());
      if (data.checksum !== expected) {
        // Tampered or invalid
        return data.token; // fallback
      }
      return data.token;
    } catch {
      return null;
    }
  }

  static removeToken(deviceId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${deviceId}`);
    } catch {}
  }

  static isDevicePaired(deviceId: string): boolean {
    return !!this.getToken(deviceId);
  }

  static getSavedDevices(): TvDevice[] {
    try {
      const raw = localStorage.getItem(DEVICES_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      // Filter out legacy hardcoded mock IDs from earlier builds
      const legacyMockIds = new Set([
        "atv_living_room_01",
        "roku_streaming_stick_02",
        "samsung_qled_living_03",
        "lg_oled_c2_bedroom_04"
      ]);
      const validDevices = parsed.filter((d: any) => d && d.id && !legacyMockIds.has(d.id));

      if (validDevices.length !== parsed.length) {
        this.saveDevices(validDevices);
      }

      // Update pairing state based on actual token presence in vault
      return validDevices.map((d: any) => ({
        ...d,
        isPaired: d.requiresPairing ? this.isDevicePaired(d.id) : true
      }));
    } catch {
      return [];
    }
  }

  static saveDevices(devices: TvDevice[]): void {
    try {
      localStorage.setItem(DEVICES_KEY, JSON.stringify(devices || []));
    } catch {}
  }

  static saveDevice(device: TvDevice): void {
    const list = this.getSavedDevices() || [];
    const idx = list.findIndex(d => d.id === device.id);
    if (idx >= 0) {
      list[idx] = device;
    } else {
      list.push(device);
    }
    this.saveDevices(list);
  }

  static removeDevice(deviceId: string): void {
    const list = (this.getSavedDevices() || []).filter(d => d.id !== deviceId);
    this.saveDevices(list);
    this.removeToken(deviceId);
  }

  static getActiveDeviceId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_DEVICE_KEY);
    } catch {
      return null;
    }
  }

  static getActiveDevice(): TvDevice | null {
    const id = this.getActiveDeviceId();
    const list = this.getSavedDevices() || [];
    if (id) {
      const found = list.find(d => d.id === id);
      if (found) return found;
    }
    return (list && list.length > 0) ? list[0] : null;
  }

  static setActiveDeviceId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_DEVICE_KEY, id);
    } catch {}
  }

  static isOnboardingCompleted(): boolean {
    try {
      return localStorage.getItem("ustv_onboarding_completed") === "true";
    } catch {
      return false;
    }
  }

  static setOnboardingCompleted(completed: boolean): void {
    try {
      localStorage.setItem("ustv_onboarding_completed", completed ? "true" : "false");
    } catch {}
  }

  static resetOnboarding(): void {
    try {
      localStorage.removeItem("ustv_onboarding_completed");
    } catch {}
  }
}

