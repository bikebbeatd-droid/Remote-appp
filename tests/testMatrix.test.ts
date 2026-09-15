import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { validateTvTarget } from "../src/core/networkValidation";
import { TokenVault } from "../src/pairing/tokenVault";
import { CapabilityEngine } from "../src/core/capabilities/CapabilityEngine";
import { CommandQueue } from "../src/core/commands/CommandQueue";
import { TvDevice } from "../src/core/types";

describe("Comprehensive Remote App Test Matrix", () => {
  // --------------------------------------------------------------------------
  // 1. Startup & Resilience Guarantees
  // --------------------------------------------------------------------------
  describe("Matrix 1: Startup & Resilience", () => {
    test("TokenVault safely handles storage initialization without throwing", () => {
      assert.doesNotThrow(() => {
        const isDone = TokenVault.isOnboardingCompleted();
        assert.equal(typeof isDone, "boolean");
      });
    });

    test("TokenVault returns clean empty device array on clean installation", () => {
      TokenVault.saveDevices([]);
      const devices = TokenVault.getSavedDevices();
      assert.ok(Array.isArray(devices));
      assert.equal(devices.length, 0);
    });

    test("Onboarding state toggle persists correctly in storage", () => {
      TokenVault.setOnboardingCompleted(false);
      assert.equal(TokenVault.isOnboardingCompleted(), false);
      TokenVault.setOnboardingCompleted(true);
      assert.equal(TokenVault.isOnboardingCompleted(), true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Discovery & Network Security Matrix
  // --------------------------------------------------------------------------
  describe("Matrix 2: Discovery & SSRF Security Boundaries", () => {
    test("rejects Termux local loopback 127.0.0.1", () => {
      const res = validateTvTarget("127.0.0.1");
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("Termux local backend"));
    });

    test("rejects cloud metadata link-local address 169.254.169.254", () => {
      const res = validateTvTarget("169.254.169.254");
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("SECURITY_VIOLATION"));
    });

    test("rejects multicast discovery addresses for direct unicast", () => {
      const res = validateTvTarget("239.255.255.250");
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("Multicast"));
    });

    test("accepts valid home LAN IP addresses", () => {
      const validIps = ["192.168.1.55", "10.0.0.12", "172.16.0.40"];
      for (const ip of validIps) {
        const res = validateTvTarget(ip);
        assert.equal(res.valid, true, `Expected ${ip} to be valid`);
      }
    });

    test("rejects out of boundary TCP ports", () => {
      assert.equal(validateTvTarget("192.168.1.50", 0).valid, false);
      assert.equal(validateTvTarget("192.168.1.50", 70000).valid, false);
      assert.equal(validateTvTarget("192.168.1.50", -1).valid, false);
      assert.equal(validateTvTarget("192.168.1.50", 8080).valid, true);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Pairing & Token Integrity Matrix
  // --------------------------------------------------------------------------
  describe("Matrix 3: Pairing & Token Vault Integrity", () => {
    const testDevId = "tv_test_matrix_dev_01";
    const testToken = "secure_token_abc_123";

    test("stores token and verifies paired state", () => {
      TokenVault.saveToken(testDevId, testToken);
      assert.equal(TokenVault.isDevicePaired(testDevId), true);
      assert.equal(TokenVault.getToken(testDevId), testToken);
    });

    test("removes token and updates paired state to false", () => {
      TokenVault.removeToken(testDevId);
      assert.equal(TokenVault.isDevicePaired(testDevId), false);
      assert.equal(TokenVault.getToken(testDevId), null);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Command Pipeline & Capability Matrix
  // --------------------------------------------------------------------------
  describe("Matrix 4: Command Pipeline & Capabilities", () => {
    const rokuDev: TvDevice = {
      id: "roku_device_test",
      name: "Roku Ultra",
      brand: "Roku",
      model: "4800X",
      platform: "roku",
      ip: "192.168.1.45",
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

    test("permits supported commands on Roku", () => {
      const check = CapabilityEngine.checkCommand(rokuDev, "POWER");
      assert.equal(check.allowed, true);
    });

    test("strictly rejects unsupported touchpad gestures on Roku with clear explanation", () => {
      const check = CapabilityEngine.checkCommand(rokuDev, "TOUCHPAD_MOVE");
      assert.equal(check.allowed, false);
      assert.ok(check.reason?.includes("not supported by ROKU"));
    });

    test("CommandQueue debounces duplicate rapid non-repeatable commands", async () => {
      const queue = new CommandQueue();
      let callCount = 0;
      const fakeSender = async () => {
        callCount++;
        return { success: true, command: "MUTE" as const, timestamp: Date.now(), latencyMs: 10 };
      };

      const r1 = await queue.execute(rokuDev, "MUTE", undefined, fakeSender);
      const r2 = await queue.execute(rokuDev, "MUTE", undefined, fakeSender);

      assert.equal(r1.success, true);
      assert.equal(r2.success, false);
      assert.match(r2.error || "", /Debounced duplicate tap/);
      assert.equal(callCount, 1);
    });

    test("CommandQueue allows rapid directional buttons without debouncing", async () => {
      const queue = new CommandQueue();
      let callCount = 0;
      const fakeSender = async () => {
        callCount++;
        return { success: true, command: "UP", timestamp: Date.now(), latencyMs: 5 };
      };

      const p1 = queue.execute(rokuDev, "UP", undefined, fakeSender);
      const p2 = queue.execute(rokuDev, "UP", undefined, fakeSender);
      const [r1, r2] = await Promise.all([p1, p2]);

      assert.equal(r1.success, true);
      assert.equal(r2.success, true);
      assert.equal(callCount, 2);
    });
  });
});
