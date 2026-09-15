import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateTvTarget } from "../src/core/networkValidation.js";

describe("Network Validation & SSRF Guard Tests", () => {
  it("accepts valid private LAN IP addresses", () => {
    assert.deepEqual(validateTvTarget("192.168.1.50", 8060), { valid: true });
    assert.deepEqual(validateTvTarget("10.0.0.12", 8002), { valid: true });
    assert.deepEqual(validateTvTarget("172.16.0.5", 3001), { valid: true });
  });

  it("strictly rejects 127.0.0.1 with Termux guidance", () => {
    const result = validateTvTarget("127.0.0.1", 8080);
    assert.equal(result.valid, false);
    assert.match(result.error || "", /Termux local backend/);
  });

  it("strictly rejects other loopback IPs (127.0.0.2, 127.1.2.3)", () => {
    const result = validateTvTarget("127.0.0.2");
    assert.equal(result.valid, false);
    assert.match(result.error || "", /Termux local backend/);
  });

  it("rejects cloud metadata and link-local (169.254.169.254)", () => {
    const result = validateTvTarget("169.254.169.254", 80);
    assert.equal(result.valid, false);
    assert.match(result.error || "", /Link-local/);
  });

  it("rejects 0.0.0.0/8 and broadcast 255.255.255.255", () => {
    assert.equal(validateTvTarget("0.0.0.0").valid, false);
    assert.equal(validateTvTarget("255.255.255.255").valid, false);
  });

  it("rejects multicast addresses (224.0.0.1, 239.255.255.250)", () => {
    assert.equal(validateTvTarget("224.0.0.1").valid, false);
    assert.equal(validateTvTarget("239.255.255.250").valid, false);
  });

  it("rejects invalid IP formats and non-numeric characters", () => {
    assert.equal(validateTvTarget("999.999.999.999").valid, false);
    assert.equal(validateTvTarget("not-an-ip").valid, false);
    assert.equal(validateTvTarget("192.168.1.1.1").valid, false);
  });

  it("validates port boundaries", () => {
    assert.equal(validateTvTarget("192.168.1.100", 0).valid, false);
    assert.equal(validateTvTarget("192.168.1.100", 65536).valid, false);
    assert.equal(validateTvTarget("192.168.1.100", 8060).valid, true);
    assert.equal(validateTvTarget("192.168.1.100", 65535).valid, true);
  });
});
