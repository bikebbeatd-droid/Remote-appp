import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CapabilityEngine } from "../src/core/capabilities/CapabilityEngine.js";
import { TvDevice } from "../src/core/types.js";

const mockRokuDevice: TvDevice = {
  id: "roku_192_168_1_50",
  name: "Living Room Roku",
  manufacturer: "Roku",
  model: "Streaming Stick 4K",
  platform: "roku",
  ip: "192.168.1.50",
  port: 8060,
  protocol: "roku_ecp",
  requiresPairing: false,
  isPaired: true,
  isOnline: true,
  capabilities: {
    power: "SUPPORTED",
    navigation: "SUPPORTED",
    volume: "SUPPORTED",
    media: "SUPPORTED",
    keyboard: "SUPPORTED",
    touchpad: "UNSUPPORTED",
    apps: "SUPPORTED",
    input: "SUPPORTED",
    voice: "SUPPORTED",
    channels: "SUPPORTED",
    ir: "UNSUPPORTED",
    bluetooth: "UNSUPPORTED",
    wifi: "SUPPORTED"
  },
  lastSeen: Date.now()
};

const mockIrDevice: TvDevice = {
  id: "ir_tv_01",
  name: "Legacy CRT TV",
  manufacturer: "Generic",
  model: "Infrared TV",
  platform: "ir_universal",
  ip: "0.0.0.0",
  port: 0,
  protocol: "ir_universal",
  requiresPairing: false,
  isPaired: true,
  isOnline: true,
  capabilities: {
    power: "SUPPORTED",
    navigation: "SUPPORTED",
    volume: "SUPPORTED",
    media: "SUPPORTED",
    keyboard: "UNSUPPORTED",
    touchpad: "UNSUPPORTED",
    apps: "UNSUPPORTED",
    input: "SUPPORTED",
    voice: "UNSUPPORTED",
    channels: "SUPPORTED",
    ir: "SUPPORTED",
    bluetooth: "UNSUPPORTED",
    wifi: "UNSUPPORTED"
  },
  lastSeen: Date.now()
};

describe("CapabilityEngine Tests", () => {
  it("allows supported commands on Roku", () => {
    const powerCheck = CapabilityEngine.checkCommand(mockRokuDevice, "POWER");
    assert.equal(powerCheck.allowed, true);

    const navCheck = CapabilityEngine.checkCommand(mockRokuDevice, "HOME");
    assert.equal(navCheck.allowed, true);

    const volCheck = CapabilityEngine.checkCommand(mockRokuDevice, "VOLUME_UP");
    assert.equal(volCheck.allowed, true);
  });

  it("strictly blocks touchpad on Roku with honest explanation", () => {
    const touchCheck = CapabilityEngine.checkCommand(mockRokuDevice, "TOUCHPAD_MOVE");
    assert.equal(touchCheck.allowed, false);
    assert.equal(touchCheck.status, "UNSUPPORTED");
    assert.match(touchCheck.reason || "", /not supported/i);
  });

  it("blocks voice and keyboard on IR devices", () => {
    const voiceCheck = CapabilityEngine.checkCommand(mockIrDevice, "VOICE_QUERY");
    assert.equal(voiceCheck.allowed, false);
    assert.equal(voiceCheck.status, "UNSUPPORTED");

    const kbCheck = CapabilityEngine.checkCommand(mockIrDevice, "TEXT_INPUT");
    assert.equal(kbCheck.allowed, false);
    assert.equal(kbCheck.status, "UNSUPPORTED");
  });

  it("evaluates remote mode compatibility accurately", () => {
    const classicCheck = CapabilityEngine.checkMode(mockRokuDevice, "classic");
    assert.equal(classicCheck.allowed, true);

    const touchCheck = CapabilityEngine.checkMode(mockRokuDevice, "touchpad");
    assert.equal(touchCheck.allowed, false);
    assert.equal(touchCheck.status, "UNSUPPORTED");
  });
});
