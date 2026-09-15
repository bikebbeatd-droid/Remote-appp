import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommandQueue } from "../src/core/commands/CommandQueue.js";
import { TvDevice } from "../src/core/types.js";

const testDevice: TvDevice = {
  id: "test_tv_01",
  name: "Test TV",
  manufacturer: "TestCorp",
  model: "T-100",
  platform: "android_tv",
  ip: "192.168.1.88",
  port: 6467,
  protocol: "android_tv_receiver",
  requiresPairing: false,
  isPaired: true,
  isOnline: true,
  capabilities: {
    power: "SUPPORTED",
    navigation: "SUPPORTED",
    volume: "SUPPORTED",
    media: "SUPPORTED",
    keyboard: "SUPPORTED",
    touchpad: "SUPPORTED",
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

describe("CommandQueue Tests", () => {
  it("executes command with valid result and latency tracking", async () => {
    const queue = new CommandQueue();
    let executed = false;

    const result = await queue.execute(testDevice, "POWER", undefined, async () => {
      executed = true;
      return {
        success: true,
        command: "POWER",
        timestamp: Date.now()
      };
    });

    assert.equal(executed, true);
    assert.equal(result.success, true);
    assert.equal(result.command, "POWER");
    assert.ok(typeof result.latencyMs === "number");
  });

  it("debounces rapid duplicate clicks of non-rapid commands", async () => {
    const queue = new CommandQueue();
    let executeCount = 0;

    const executor = async () => {
      executeCount++;
      return {
        success: true,
        command: "MUTE",
        timestamp: Date.now()
      };
    };

    // First click
    const res1 = await queue.execute(testDevice, "MUTE", undefined, executor);
    assert.equal(res1.success, true);
    assert.equal(executeCount, 1);

    // Immediate second click of MUTE within debounce window
    const res2 = await queue.execute(testDevice, "MUTE", undefined, executor);
    assert.equal(res2.success, false);
    assert.match(res2.error || "", /Debounced duplicate tap/);
    assert.equal(executeCount, 1);
  });

  it("does not debounce rapid volume adjustment or directional buttons", async () => {
    const queue = new CommandQueue();
    let volCount = 0;

    const volExecutor = async () => {
      volCount++;
      return {
        success: true,
        command: "VOLUME_UP",
        timestamp: Date.now()
      };
    };

    const res1 = await queue.execute(testDevice, "VOLUME_UP", undefined, volExecutor);
    const res2 = await queue.execute(testDevice, "VOLUME_UP", undefined, volExecutor);

    assert.equal(res1.success, true);
    assert.equal(res2.success, true);
    assert.equal(volCount, 2);
  });
});
