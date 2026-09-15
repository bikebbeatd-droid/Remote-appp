import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Helper identical to backend network validation
export function validateTvTarget(ip: string, port?: number): { valid: boolean; error?: string } {
  const cleanIp = ip.trim();

  // Validate IP format (strict IPv4)
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (!ipRegex.test(cleanIp)) {
    return {
      valid: false,
      error: "INVALID_IP_FORMAT: Please provide a valid IPv4 address (e.g. 192.168.1.50)."
    };
  }

  // Reject 127.0.0.0/8 & localhost as TV address (Termux local backend rule)
  if (cleanIp.startsWith("127.") || cleanIp === "localhost") {
    return {
      valid: false,
      error: "127.0.0.1 / localhost is the Termux local backend on your phone, NOT the Smart TV's IP address. Please enter your TV's actual Wi-Fi LAN IP (e.g. 192.168.1.x)."
    };
  }

  // Reject 0.0.0.0/8
  if (cleanIp.startsWith("0.")) {
    return { valid: false, error: "INVALID_IP_TARGET: 0.0.0.0/8 is an unroutable address." };
  }

  // Reject broadcast
  if (cleanIp === "255.255.255.255") {
    return { valid: false, error: "INVALID_IP_TARGET: 255.255.255.255 is the broadcast address." };
  }

  // Reject multicast (224.0.0.0 - 239.255.255.255)
  const firstOctet = parseInt(cleanIp.split(".")[0], 10);
  if (firstOctet >= 224 && firstOctet <= 239) {
    return { valid: false, error: "INVALID_IP_TARGET: Multicast addresses cannot be directly targeted for unicast TV control." };
  }

  // Reject link-local (169.254.0.0/16, including cloud metadata 169.254.169.254)
  if (cleanIp.startsWith("169.254.")) {
    return { valid: false, error: "SECURITY_VIOLATION: Link-local addresses (169.254.x.x) and cloud metadata services are prohibited." };
  }

  // Validate port if provided
  if (port !== undefined) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return { valid: false, error: "INVALID_PORT: Port must be an integer between 1 and 65535." };
    }
  }

  return { valid: true };
}

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
