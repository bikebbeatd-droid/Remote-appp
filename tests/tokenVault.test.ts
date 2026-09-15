import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

// In Node.js test environment, setup a lightweight in-memory storage if global.localStorage is undefined
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] || null,
    get length() { return store.size; }
  } as any;
}

import { TokenVault } from "../src/pairing/tokenVault.js";
import { TvDevice } from "../src/core/types.js";

describe("TokenVault Security & Storage Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves TV authentication tokens with integrity check", () => {
    const deviceId = "tizen_192_168_1_45";
    const token = "samsung_auth_token_99182312";

    TokenVault.saveToken(deviceId, token);
    const retrieved = TokenVault.getToken(deviceId);
    assert.equal(retrieved, token);
    assert.equal(TokenVault.isDevicePaired(deviceId), true);
  });

  it("returns null and reports unpaired for unknown device", () => {
    assert.equal(TokenVault.getToken("unknown_device"), null);
    assert.equal(TokenVault.isDevicePaired("unknown_device"), false);
  });

  it("removes token correctly when unpaired", () => {
    const deviceId = "webos_192_168_1_60";
    TokenVault.saveToken(deviceId, "client_key_12345");
    assert.equal(TokenVault.isDevicePaired(deviceId), true);

    TokenVault.removeToken(deviceId);
    assert.equal(TokenVault.getToken(deviceId), null);
    assert.equal(TokenVault.isDevicePaired(deviceId), false);
  });

  it("filters out legacy mock device IDs from persistence", () => {
    const mockList = [
      { id: "atv_living_room_01", name: "Fake ATV", platform: "android_tv" },
      { id: "real_tv_192_168_1_99", name: "Real Sony", platform: "sony_bravia" }
    ];
    localStorage.setItem("ustv_saved_devices", JSON.stringify(mockList));

    const saved = TokenVault.getSavedDevices();
    assert.equal(saved.length, 1);
    assert.equal(saved[0].id, "real_tv_192_168_1_99");
  });
});
