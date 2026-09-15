/**
 * Production Network Target & IP Security Validator
 * Protects against SSRF, private cloud metadata exfiltration, loopback confusion,
 * and enforces Termux local backend separation.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateTvTarget(ip: string, port?: number): ValidationResult {
  const cleanIp = ip ? ip.trim() : "";

  if (!cleanIp) {
    return {
      valid: false,
      error: "INVALID_IP_FORMAT: Target IP address cannot be empty."
    };
  }

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

  // Reject cloud metadata service (169.254.169.254) and link-local (169.254.0.0/16)
  if (cleanIp.startsWith("169.254.")) {
    return { valid: false, error: "SECURITY_VIOLATION: Link-local and cloud metadata addresses (169.254.x.x) are strictly forbidden." };
  }

  // Port validation if provided
  if (port !== undefined && port !== null) {
    if (isNaN(port) || port < 1 || port > 65535) {
      return { valid: false, error: "INVALID_PORT: Port must be between 1 and 65535." };
    }
  }

  return { valid: true };
}
