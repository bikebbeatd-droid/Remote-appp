/**
 * Local credential vault.
 *
 * Browser localStorage is not a secure keystore. Native Android builds should
 * replace this storage with an OS-backed secure store when available.
 * We never treat a checksum/obfuscation value as encryption.
 */
import { TvDevice } from "../core/types";

const STORAGE_PREFIX = "ustv_vault_";
const DEVICES_KEY = "ustv_saved_devices";
const ACTIVE_DEVICE_KEY = "ustv_active_device_id";
const memStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
  } catch {
    // Fall back to process memory when persistent storage is unavailable.
  }
  return memStore.get(key) || null;
}
function safeSetItem(key: string, value: string): void {
  try { if (typeof localStorage !== "undefined") localStorage.setItem(key, value); } catch {}
  memStore.set(key, value);
}
function safeRemoveItem(key: string): void {
  try { if (typeof localStorage !== "undefined") localStorage.removeItem(key); } catch {}
  memStore.delete(key);
}

export class TokenVault {
  static saveToken(deviceId: string, token: string): void {
    if (!deviceId || !token) return;
    safeSetItem(`${STORAGE_PREFIX}${deviceId}`, JSON.stringify({ token, savedAt: Date.now() }));
  }

  static getToken(deviceId: string): string | null {
    try {
      const raw = safeGetItem(`${STORAGE_PREFIX}${deviceId}`);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return typeof data?.token === "string" && data.token.length > 0 ? data.token : null;
    } catch {
      return null;
    }
  }

  static removeToken(deviceId: string): void {
    safeRemoveItem(`${STORAGE_PREFIX}${deviceId}`);
  }

  static isDevicePaired(deviceId: string): boolean {
    return !!this.getToken(deviceId);
  }

  static getSavedDevices(): TvDevice[] {
    try {
      const raw = safeGetItem(DEVICES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const legacyMockIds = new Set([
        "atv_living_room_01",
        "roku_streaming_stick_02",
        "samsung_qled_living_03",
        "lg_oled_c2_bedroom_04"
      ]);
      const validDevices = parsed.filter((d: any) => d && typeof d.id === "string" && !legacyMockIds.has(d.id));
      if (validDevices.length !== parsed.length) this.saveDevices(validDevices);

      return validDevices.map((d: TvDevice) => ({
        ...d,
        isPaired: d.requiresPairing ? this.isDevicePaired(d.id) : Boolean(d.isPaired)
      }));
    } catch {
      return [];
    }
  }

  static saveDevices(devices: TvDevice[]): void {
    if (!Array.isArray(devices)) return;
    safeSetItem(DEVICES_KEY, JSON.stringify(devices));
  }

  static saveDevice(device: TvDevice): void {
    const list = this.getSavedDevices();
    const idx = list.findIndex(d => d.id === device.id);
    if (idx >= 0) list[idx] = device;
    else list.push(device);
    this.saveDevices(list);
  }

  static removeDevice(deviceId: string): void {
    this.saveDevices(this.getSavedDevices().filter(d => d.id !== deviceId));
    this.removeToken(deviceId);
    if (this.getActiveDeviceId() === deviceId) safeRemoveItem(ACTIVE_DEVICE_KEY);
  }

  static getActiveDeviceId(): string | null {
    return safeGetItem(ACTIVE_DEVICE_KEY);
  }

  static getActiveDevice(): TvDevice | null {
    const id = this.getActiveDeviceId();
    const list = this.getSavedDevices();
    return (id && list.find(d => d.id === id)) || list[0] || null;
  }

  static setActiveDeviceId(id: string): void {
    if (id) safeSetItem(ACTIVE_DEVICE_KEY, id);
  }

  static isOnboardingCompleted(): boolean {
    return safeGetItem("ustv_onboarding_completed") === "true";
  }

  static setOnboardingCompleted(completed: boolean): void {
    safeSetItem("ustv_onboarding_completed", completed ? "true" : "false");
  }

  static resetOnboarding(): void {
    safeRemoveItem("ustv_onboarding_completed");
  }
}
