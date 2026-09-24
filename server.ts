import express from "express";
import http from "http";
import path from "path";
import os from "os";
import net from "net";
import tls from "tls";
import dgram from "dgram";
import crypto from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { validateTvTarget } from "./src/core/networkValidation";
export { validateTvTarget };

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to determine the actual LAN / Wi-Fi IP address
function getLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal && alias.address !== "127.0.0.1") {
        return alias.address;
      }
    }
  }
  return "";
}

// --------------------------------------------------------------------------
// Real Discovery & TV Network Communication Engine
// --------------------------------------------------------------------------

interface DiscoveredTvRecord {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  platform: string;
  ip: string;
  port: number;
  protocol: string;
  requiresPairing: boolean;
  isOnline: boolean;
  capabilities: Record<string, string>;
  lastSeen: number;
  locationHeader?: string;
  serverHeader?: string;
}

const verifiedDevicesMap = new Map<string, DiscoveredTvRecord>();
const activeTokensMap = new Map<string, string>(); // deviceId -> token

/**
 * Perform a real TCP connection check to an IP and port with a timeout
 */
function checkTcpPort(host: string, port: number, timeoutMs = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve(true);
      }
    });

    socket.on("timeout", () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.on("error", () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve(false);
      }
    });

    try {
      socket.connect(port, host);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Fetch with real timeout helper
 */
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 3000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}



/**
 * Probe a specific IP address for supported TV protocols
 */
async function probeTvTarget(ip: string, targetPort?: number, preferredProtocol?: string): Promise<{ success: boolean; device?: DiscoveredTvRecord; error?: string }> {
  const cleanIp = ip.trim();

  // Validate IP and port security boundaries
  const validation = validateTvTarget(cleanIp, targetPort);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  // 1. Test Roku ECP (Port 8060)
  if (!targetPort || targetPort === 8060 || preferredProtocol?.includes("roku")) {
    try {
      const isRokuPortOpen = await checkTcpPort(cleanIp, 8060, 2000);
      if (isRokuPortOpen) {
        const res = await fetchWithTimeout(`http://${cleanIp}:8060/query/device-info`, { method: "GET" }, 2500);
        if (res.ok) {
          const xml = await res.text();
          const userDeviceNameMatch = xml.match(/<user-given-name>([^<]+)<\/user-given-name>/) || xml.match(/<friendly-device-name>([^<]+)<\/friendly-device-name>/);
          const modelNameMatch = xml.match(/<model-name>([^<]+)<\/model-name>/);
          const modelNumMatch = xml.match(/<model-number>([^<]+)<\/model-number>/);

          const name = userDeviceNameMatch ? userDeviceNameMatch[1] : `Roku TV (${cleanIp})`;
          const model = modelNameMatch ? `${modelNameMatch[1]} ${modelNumMatch ? `(${modelNumMatch[1]})` : ""}` : "Roku Streaming Device";

          const device: DiscoveredTvRecord = {
            id: `roku_${cleanIp.replace(/\./g, "_")}`,
            name,
            manufacturer: "Roku",
            model,
            platform: "roku",
            ip: cleanIp,
            port: 8060,
            protocol: "roku_ecp",
            requiresPairing: false,
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

          verifiedDevicesMap.set(device.id, device);
          return { success: true, device };
        }
      }
    } catch (err: any) {
      console.debug(`[Probe] Roku query failed for ${cleanIp}:`, err?.message);
    }
  }

  // 2. Test Samsung Tizen SmartView (Port 8001 / 8002)
  if (!targetPort || targetPort === 8001 || targetPort === 8002 || preferredProtocol?.includes("tizen")) {
    try {
      const isSamsungHttpOpen = await checkTcpPort(cleanIp, 8001, 2000);
      const isSamsungWsOpen = await checkTcpPort(cleanIp, 8002, 2000);

      if (isSamsungHttpOpen || isSamsungWsOpen) {
        let name = `Samsung Smart TV (${cleanIp})`;
        let model = "Samsung Tizen TV";

        try {
          const res = await fetchWithTimeout(`http://${cleanIp}:8001/api/v2/`, { method: "GET" }, 2500);
          if (res.ok) {
            const data = await res.json();
            if (data.device?.name) name = data.device.name;
            if (data.device?.modelName) model = data.device.modelName;
          }
        } catch (err: any) {
          console.debug(`[Probe] Samsung API query failed for ${cleanIp}:`, err?.message);
        }

        const device: DiscoveredTvRecord = {
          id: `tizen_${cleanIp.replace(/\./g, "_")}`,
          name,
          manufacturer: "Samsung",
          model,
          platform: "tizen",
          ip: cleanIp,
          port: isSamsungWsOpen ? 8002 : 8001,
          protocol: "samsung_tizen_ws",
          requiresPairing: true,
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
            voice: "UNSUPPORTED",
            channels: "SUPPORTED",
            ir: "UNSUPPORTED",
            bluetooth: "SUPPORTED",
            wifi: "SUPPORTED"
          },
          lastSeen: Date.now()
        };

        verifiedDevicesMap.set(device.id, device);
        return { success: true, device };
      }
    } catch (err: any) {
      // Samsung Tizen probe failed on this port, continue to next protocol
    }
  }

  // 3. Test LG webOS SSAP (Port 3000 / 3001)
  if (!targetPort || targetPort === 3000 || targetPort === 3001 || preferredProtocol?.includes("webos")) {
    try {
      const isLgPortOpen = (await checkTcpPort(cleanIp, 3001, 2000)) || (await checkTcpPort(cleanIp, 3000, 2000));
      if (isLgPortOpen) {
        const device: DiscoveredTvRecord = {
          id: `webos_${cleanIp.replace(/\./g, "_")}`,
          name: `LG webOS TV (${cleanIp})`,
          manufacturer: "LG Electronics",
          model: "LG webOS Smart TV",
          platform: "webos",
          ip: cleanIp,
          port: 3001,
          protocol: "lg_webos_ssap",
          requiresPairing: true,
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
            bluetooth: "SUPPORTED",
            wifi: "SUPPORTED"
          },
          lastSeen: Date.now()
        };

        verifiedDevicesMap.set(device.id, device);
        return { success: true, device };
      }
    } catch (err: any) {
      // LG webOS probe failed, continue to next candidate
    }
  }

  // 4. Test Sony BRAVIA IRCC / REST (Port 80 / 20060)
  if (!targetPort || targetPort === 80 || targetPort === 20060 || preferredProtocol?.includes("bravia") || preferredProtocol?.includes("sony")) {
    try {
      const isSonyPortOpen = await checkTcpPort(cleanIp, 80, 2000);
      if (isSonyPortOpen) {
        try {
          const res = await fetchWithTimeout(`http://${cleanIp}/sony/system`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              method: "getSystemInformation",
              params: [],
              id: 1,
              version: "1.0"
            })
          }, 2500);

          if (res.ok) {
            const data = await res.json();
            const sysInfo = data.result?.[0] || {};
            const model = sysInfo.model || "Sony BRAVIA 4K";

            const device: DiscoveredTvRecord = {
              id: `sony_${cleanIp.replace(/\./g, "_")}`,
              name: `Sony BRAVIA (${cleanIp})`,
              manufacturer: "Sony",
              model,
              platform: "sony_bravia",
              ip: cleanIp,
              port: 80,
              protocol: "sony_ircc_rest",
              requiresPairing: true,
              isOnline: true,
              capabilities: {
                power: "SUPPORTED",
                navigation: "SUPPORTED",
                volume: "SUPPORTED",
                media: "SUPPORTED",
                keyboard: "UNKNOWN",
                touchpad: "UNSUPPORTED",
                apps: "SUPPORTED",
                input: "SUPPORTED",
                voice: "UNSUPPORTED",
                channels: "SUPPORTED",
                ir: "UNSUPPORTED",
                bluetooth: "UNSUPPORTED",
                wifi: "SUPPORTED"
              },
              lastSeen: Date.now()
            };

            verifiedDevicesMap.set(device.id, device);
            return { success: true, device };
          }
        } catch (sonyHttpErr: any) {
          // Sony BRAVIA HTTP info probe failed, continue to other candidates
        }
      }
    } catch (sonyPortErr: any) {
      // Sony port closed or timed out
    }
  }

  // 5. Test Android TV / Google TV Remote Service v2 (Port 6466 / 6467 / 8008 / 5555)
  if (!targetPort || targetPort === 6467 || targetPort === 6466 || preferredProtocol?.includes("android")) {
    try {
      const isAtvPortOpen = (await checkTcpPort(cleanIp, 6467, 2000)) || (await checkTcpPort(cleanIp, 6466, 2000)) || (await checkTcpPort(cleanIp, 8008, 2000));
      if (isAtvPortOpen) {
        const device: DiscoveredTvRecord = {
          id: `androidtv_${cleanIp.replace(/\./g, "_")}`,
          name: `Android TV / Google TV (${cleanIp})`,
          manufacturer: "Google / Android TV",
          model: "Android TV Device",
          platform: "android_tv",
          ip: cleanIp,
          port: 6467,
          protocol: "android_tv_receiver",
          requiresPairing: true,
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
            bluetooth: "SUPPORTED",
            wifi: "SUPPORTED"
          },
          lastSeen: Date.now()
        };

        verifiedDevicesMap.set(device.id, device);
        return { success: true, device };
      }
    } catch (atvErr: any) {
      // Android TV probe failed on tested ports
    }
  }

  // If a specific custom port was requested, check reachability
  if (targetPort && targetPort > 0) {
    const isCustomPortOpen = await checkTcpPort(cleanIp, targetPort, 2000);
    if (isCustomPortOpen) {
      const device: DiscoveredTvRecord = {
        id: `tv_${cleanIp.replace(/\./g, "_")}_${targetPort}`,
        name: `Smart TV (${cleanIp})`,
        manufacturer: "Smart TV",
        model: "Network Connected TV",
        platform: preferredProtocol || "generic",
        ip: cleanIp,
        port: targetPort,
        protocol: preferredProtocol || "generic_http",
        requiresPairing: true,
        isOnline: true,
        capabilities: {
          power: "SUPPORTED",
          navigation: "SUPPORTED",
          volume: "SUPPORTED",
          media: "SUPPORTED",
          keyboard: "UNKNOWN",
          touchpad: "UNSUPPORTED",
          apps: "SUPPORTED",
          input: "SUPPORTED",
          voice: "UNSUPPORTED",
          channels: "SUPPORTED",
          ir: "UNSUPPORTED",
          bluetooth: "UNSUPPORTED",
          wifi: "SUPPORTED"
        },
        lastSeen: Date.now()
      };
      verifiedDevicesMap.set(device.id, device);
      return { success: true, device };
    }
  }

  // No verified open TV protocol found
  return {
    success: false,
    error: `DEVICE_NOT_VERIFIED: No responding Smart TV service found at ${cleanIp}. Verify the TV is powered on, connected to the same Wi-Fi network, and that Remote Control / IP Control is enabled in your TV Settings.`
  };
}

/**
 * Real mDNS / DNS-SD Multicast Scanner on UDP 5353
 * Discovers Android TV / Google TV devices (_androidtvremote2._tcp, _googlecast._tcp)
 */
function scanMdns(timeoutMs = 2500): Promise<DiscoveredTvRecord[]> {
  return new Promise((resolve) => {
    const foundDevices: DiscoveredTvRecord[] = [];
    const client = dgram.createSocket({ type: "udp4", reuseAddr: true });

    // Construct DNS-SD PTR query packet for _androidtvremote2._tcp.local and _googlecast._tcp.local
    const buildDnsQuery = (serviceName: string): Buffer => {
      const parts = serviceName.split(".");
      const qnameParts: Buffer[] = [];
      for (const part of parts) {
        const len = Buffer.from([part.length]);
        const str = Buffer.from(part, "utf-8");
        qnameParts.push(Buffer.concat([len, str]));
      }
      qnameParts.push(Buffer.from([0])); // null terminator
      const qname = Buffer.concat(qnameParts);
      
      const header = Buffer.from([
        0x00, 0x00, // Transaction ID
        0x00, 0x00, // Flags (Standard query)
        0x00, 0x01, // Questions: 1
        0x00, 0x00, // Answer RRs: 0
        0x00, 0x00, // Authority RRs: 0
        0x00, 0x00  // Additional RRs: 0
      ]);
      const footer = Buffer.from([
        0x00, 0x0c, // Type: PTR (12)
        0x00, 0x01  // Class: IN (1)
      ]);
      return Buffer.concat([header, qname, footer]);
    };

    client.on("message", (msg, rinfo) => {
      try {
        const ip = rinfo.address;
        if (ip === "127.0.0.1" || ip === "0.0.0.0") return;

        const raw = msg.toString("latin1");
        if (
          raw.includes("_androidtvremote2") ||
          raw.includes("_androidtvremote") ||
          raw.includes("_googlecast") ||
          raw.includes("Android TV") ||
          raw.includes("Google TV")
        ) {
          const id = `androidtv_${ip.replace(/\./g, "_")}`;
          if (!verifiedDevicesMap.has(id)) {
            // Extract friendly name if present in TXT record
            const fnMatch = raw.match(/fn=([^ \x00\r\n\t]+)/);
            const mdMatch = raw.match(/md=([^ \x00\r\n\t]+)/);
            const name = fnMatch ? fnMatch[1].replace(/\+/g, " ") : `Android TV / Google TV (${ip})`;
            const model = mdMatch ? mdMatch[1].replace(/\+/g, " ") : "Android TV Device";

            const dev: DiscoveredTvRecord = {
              id,
              name,
              manufacturer: "Google / Android TV",
              model,
              platform: "android_tv",
              ip,
              port: 6467,
              protocol: "android_tv_receiver",
              requiresPairing: true,
              isOnline: false,
              capabilities: {
                power: "UNKNOWN",
                navigation: "UNKNOWN",
                volume: "UNKNOWN",
                media: "UNKNOWN",
                keyboard: "UNKNOWN",
                touchpad: "UNKNOWN",
                apps: "UNKNOWN",
                input: "UNKNOWN",
                voice: "UNKNOWN",
                channels: "UNKNOWN",
                ir: "UNKNOWN",
                bluetooth: "UNKNOWN",
                wifi: "UNKNOWN",
              },
              lastSeen: Date.now()
            };
            verifiedDevicesMap.set(id, dev);
            foundDevices.push(dev);
          }
        }
      } catch (parseErr: any) {
        console.debug("[mDNS] Error parsing response packet:", parseErr?.message);
      }
    });

    client.on("error", (err: any) => {
      console.warn("[mDNS] Multicast socket error:", err?.message);
      try { client.close(); } catch {}
      resolve(foundDevices);
    });

    try {
      client.bind(0, () => {
        try {
          const atvQuery = buildDnsQuery("_androidtvremote2._tcp.local");
          const castQuery = buildDnsQuery("_googlecast._tcp.local");
          client.send(atvQuery, 0, atvQuery.length, 5353, "224.0.0.251");
          client.send(castQuery, 0, castQuery.length, 5353, "224.0.0.251");
        } catch (sendErr: any) {
          console.debug("[mDNS] Failed to send query packets:", sendErr?.message);
        }
      });
    } catch (bindErr: any) {
      console.warn("[mDNS] Failed to bind client socket:", bindErr?.message);
      resolve(foundDevices);
    }

    setTimeout(() => {
      try { client.close(); } catch {}
      resolve(foundDevices);
    }, timeoutMs);
  });
}

/**
 * Real SSDP Multicast Scanner on UDP 1900
 */
function scanSsdp(timeoutMs = 3000): Promise<DiscoveredTvRecord[]> {
  return new Promise((resolve) => {
    const foundDevices: DiscoveredTvRecord[] = [];
    const client = dgram.createSocket("udp4");

    const ssdpMsg =
      "M-SEARCH * HTTP/1.1\r\n" +
      "HOST: 239.255.255.250:1900\r\n" +
      'MAN: "ssdp:discover"\r\n' +
      "MX: 2\r\n" +
      "ST: ssdp:all\r\n\r\n";

    client.on("message", (msg, rinfo) => {
      try {
        const text = msg.toString();
        const ip = rinfo.address;

        if (ip === "127.0.0.1" || ip === "0.0.0.0") return;

        // Check for Roku
        if (text.includes("roku:ecp") || text.includes("Roku")) {
          const id = `roku_${ip.replace(/\./g, "_")}`;
          if (!verifiedDevicesMap.has(id)) {
            const dev: DiscoveredTvRecord = {
              id,
              name: `Roku Device (${ip})`,
              manufacturer: "Roku",
              model: "Roku Streaming TV",
              platform: "roku",
              ip,
              port: 8060,
              protocol: "roku_ecp",
              requiresPairing: false,
              isOnline: false,
              capabilities: {
                power: "UNKNOWN",
                navigation: "UNKNOWN",
                volume: "UNKNOWN",
                media: "UNKNOWN",
                keyboard: "UNKNOWN",
                touchpad: "UNKNOWN",
                apps: "UNKNOWN",
                input: "UNKNOWN",
                voice: "UNKNOWN",
                channels: "UNKNOWN",
                ir: "UNKNOWN",
                bluetooth: "UNKNOWN",
                wifi: "UNKNOWN",
              },
              lastSeen: Date.now()
            };
            verifiedDevicesMap.set(id, dev);
            foundDevices.push(dev);
          }
        }
        // Check for Sony Bravia / DIAL
        else if (text.includes("sony") || text.includes("IRCC") || text.includes("X-AV-Physical-Unit-Info")) {
          const id = `sony_${ip.replace(/\./g, "_")}`;
          if (!verifiedDevicesMap.has(id)) {
            const dev: DiscoveredTvRecord = {
              id,
              name: `Sony BRAVIA (${ip})`,
              manufacturer: "Sony",
              model: "Sony BRAVIA Smart TV",
              platform: "sony_bravia",
              ip,
              port: 80,
              protocol: "sony_ircc_rest",
              requiresPairing: true,
              isOnline: false,
              capabilities: {
                power: "UNKNOWN",
                navigation: "UNKNOWN",
                volume: "UNKNOWN",
                media: "UNKNOWN",
                keyboard: "UNKNOWN",
                touchpad: "UNKNOWN",
                apps: "UNKNOWN",
                input: "UNKNOWN",
                voice: "UNKNOWN",
                channels: "UNKNOWN",
                ir: "UNKNOWN",
                bluetooth: "UNKNOWN",
                wifi: "UNKNOWN",
              },
              lastSeen: Date.now()
            };
            verifiedDevicesMap.set(id, dev);
            foundDevices.push(dev);
          }
        }
        // Check for Samsung SmartView
        else if (text.includes("Samsung") || text.includes("samsungmsf") || text.includes("SEC_HNaviTV")) {
          const id = `tizen_${ip.replace(/\./g, "_")}`;
          if (!verifiedDevicesMap.has(id)) {
            const dev: DiscoveredTvRecord = {
              id,
              name: `Samsung Smart TV (${ip})`,
              manufacturer: "Samsung",
              model: "Samsung Tizen TV",
              platform: "tizen",
              ip,
              port: 8002,
              protocol: "samsung_tizen_ws",
              requiresPairing: true,
              isOnline: false,
              capabilities: {
                power: "UNKNOWN",
                navigation: "UNKNOWN",
                volume: "UNKNOWN",
                media: "UNKNOWN",
                keyboard: "UNKNOWN",
                touchpad: "UNKNOWN",
                apps: "UNKNOWN",
                input: "UNKNOWN",
                voice: "UNKNOWN",
                channels: "UNKNOWN",
                ir: "UNKNOWN",
                bluetooth: "UNKNOWN",
                wifi: "UNKNOWN",
              },
              lastSeen: Date.now()
            };
            verifiedDevicesMap.set(id, dev);
            foundDevices.push(dev);
          }
        }
      } catch (parseErr: any) {
        console.debug("[SSDP] Error parsing datagram message:", parseErr?.message);
      }
    });

    client.on("error", (err: any) => {
      console.warn("[SSDP] Socket error:", err?.message);
      try { client.close(); } catch {}
      resolve(foundDevices);
    });

    try {
      client.bind(0, () => {
        try {
          client.send(ssdpMsg, 0, ssdpMsg.length, 1900, "239.255.255.250");
        } catch (sendErr: any) {
          console.debug("[SSDP] Failed to send broadcast datagram:", sendErr?.message);
        }
      });
    } catch (bindErr: any) {
      console.warn("[SSDP] Failed to bind UDP socket:", bindErr?.message);
      resolve(foundDevices);
    }

    setTimeout(() => {
      try { client.close(); } catch {}
      resolve(foundDevices);
    }, timeoutMs);
  });
}

// --------------------------------------------------------------------------
// Real Companion Web TV Receiver (When running companion receiver on TV)
// --------------------------------------------------------------------------

interface LiveTvReceiverClient {
  ws: WebSocket;
  deviceId: string;
  name: string;
  model: string;
  ip: string;
  pin: string;
  pinExpiresAt: number;
  authorizedTokens: Set<string>;
  state: {
    power: boolean;
    volume: number;
    muted: boolean;
    channel: number;
    currentApp: string;
    currentInput: string;
  };
}

// Live TV Companion Web Receiver Map: deviceId -> LiveTvReceiverClient
const companionReceiversMap = new Map<string, LiveTvReceiverClient>();

// WebSocket Server for Web Remote & TV Companion Display
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/remote", maxPayload: 65536 });

// Heartbeat interval to prune dead connections
const heartbeatInterval = setInterval(() => {
  for (const client of wss.clients) {
    if ((client as any).isAlive === false) {
      client.terminate();
      continue;
    }
    (client as any).isAlive = false;
    client.ping();
  }
}, 30000);

wss.on("close", () => {
  clearInterval(heartbeatInterval);
});

wss.on("connection", (ws: WebSocket, req) => {
  (ws as any).isAlive = true;
  ws.on("pong", () => {
    (ws as any).isAlive = true;
  });

  let assignedDeviceId: string | null = null;
  const clientIp = req.socket.remoteAddress || "127.0.0.1";

  ws.on("message", (raw) => {
    try {
      const rawLen = Buffer.isBuffer(raw)
        ? raw.length
        : Array.isArray(raw)
        ? raw.reduce((acc, chunk) => acc + chunk.length, 0)
        : raw.byteLength;

      if (rawLen > 65536) {
        ws.close(1009, "Payload Too Large");
        return;
      }

      const data = JSON.parse(raw.toString());

      if (data.type === "REGISTER_RECEIVER") {
        const pin = crypto.randomInt(100000, 1000000).toString();
        const deviceId = data.deviceId || `companion_tv_${crypto.randomBytes(4).toString("hex")}`;
        assignedDeviceId = deviceId;

        const receiverClient: LiveTvReceiverClient = {
          ws,
          deviceId,
          name: data.name || "Web TV Receiver",
          model: data.model || "Universal TV Receiver WebApp",
          ip: clientIp,
          pin,
          pinExpiresAt: Date.now() + 1000 * 60 * 15,
          authorizedTokens: new Set<string>(),
          state: {
            power: true,
            volume: 25,
            muted: false,
            channel: 1,
            currentApp: "Home Screen",
            currentInput: "HDMI 1"
          }
        };

        companionReceiversMap.set(deviceId, receiverClient);

        // Register in verifiedDevicesMap so mobile can target it
        const deviceRecord: DiscoveredTvRecord = {
          id: deviceId,
          name: receiverClient.name,
          manufacturer: "Universal Remote Companion",
          model: receiverClient.model,
          platform: "companion_web_receiver",
          ip: clientIp,
          port: 3000,
          protocol: "companion_ws",
          requiresPairing: true,
          isOnline: false,
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
        verifiedDevicesMap.set(deviceId, deviceRecord);

        ws.send(JSON.stringify({
          type: "RECEIVER_REGISTERED",
          pin,
          deviceId
        }));
        return;
      }

      if (data.type === "COMMAND_FROM_REMOTE") {
        const targetId = data.targetDeviceId || data.deviceId;
        if (targetId) {
          const targetReceiver = companionReceiversMap.get(targetId);
          if (targetReceiver && targetReceiver.ws.readyState === WebSocket.OPEN) {
            targetReceiver.ws.send(JSON.stringify({
              type: "COMMAND_EXECUTED",
              command: data.command,
              value: data.value,
              clientName: data.clientName,
              timestamp: Date.now()
            }));
          }
        }
      }
    } catch (wsErr: any) {
      console.warn("[WebSocket] Error processing companion receiver message:", wsErr?.message);
    }
  });

  ws.on("close", () => {
    if (assignedDeviceId) {
      companionReceiversMap.delete(assignedDeviceId);
      const dev = verifiedDevicesMap.get(assignedDeviceId);
      if (dev && dev.platform === "companion_web_receiver") {
        dev.isOnline = false;
      }
    }
  });
});

// --------------------------------------------------------------------------
// REST API Endpoints
// --------------------------------------------------------------------------

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Universal Smart TV Remote Bridge",
    architecture: "Termux/Localhost Bridge",
    backendEndpoint: "http://127.0.0.1:3000",
    lanIp: getLanIp(),
    uptime: process.uptime(),
    verifiedDevicesCount: verifiedDevicesMap.size
  });
});

// 1b. Latest Android APK Release Metadata (Cached)
let cachedReleaseData: any = null;
let lastReleaseFetchTime = 0;
const RELEASE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

app.get("/api/releases/latest", async (_req, res) => {
  const now = Date.now();
  if (cachedReleaseData && now - lastReleaseFetchTime < RELEASE_CACHE_TTL_MS) {
    return res.json(cachedReleaseData);
  }

  const repoOwner = "bikebbeatd-droid";
  const repoName = "Remote-appp";
  const defaultVersion = "1.0.0";
  const defaultReleaseUrl = `https://github.com/${repoOwner}/${repoName}/releases/latest`;
  const defaultDirectApk = `https://github.com/${repoOwner}/${repoName}/releases/download/v${defaultVersion}/Remote-appp-v${defaultVersion}.apk`;

  try {
    const ghRes = await fetchWithTimeout(
      `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`,
      {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Universal-Smart-TV-Remote-App"
        }
      },
      3000
    );

    if (ghRes.ok) {
      const releaseJson = await ghRes.json();
      const tagName = releaseJson.tag_name || `v${defaultVersion}`;
      const cleanVersion = tagName.replace(/^v/, "");
      
      // Look for APK in assets
      const apkAsset = Array.isArray(releaseJson.assets)
        ? releaseJson.assets.find((a: any) => a.name && a.name.endsWith(".apk"))
        : null;
      
      // Look for checksum file or extract from release body
      const sumsAsset = Array.isArray(releaseJson.assets)
        ? releaseJson.assets.find((a: any) => a.name && a.name.includes("SHA256SUMS"))
        : null;

      let extractedChecksum: string | undefined = undefined;
      if (releaseJson.body) {
        const shaMatch = releaseJson.body.match(/([a-fA-F0-9]{64})/);
        if (shaMatch) {
          extractedChecksum = shaMatch[1];
        }
      }

      const sizeBytes = apkAsset?.size || 0;
      const sizeMb = sizeBytes > 0 ? (sizeBytes / (1024 * 1024)).toFixed(1) + " MB" : undefined;

      cachedReleaseData = {
        version: cleanVersion,
        tagName,
        name: releaseJson.name || `Remote-appp v${cleanVersion}`,
        downloadUrl: apkAsset?.browser_download_url || `https://github.com/${repoOwner}/${repoName}/releases/download/${tagName}/Remote-appp-${tagName}.apk`,
        fileName: apkAsset?.name || `Remote-appp-${tagName}.apk`,
        size: sizeBytes,
        sizeFormatted: sizeMb,
        publishedAt: releaseJson.published_at || new Date().toISOString(),
        checksum: extractedChecksum,
        releasePageUrl: releaseJson.html_url || defaultReleaseUrl,
        checksumFileUrl: sumsAsset?.browser_download_url,
        isAvailable: true,
        signingStatus: apkAsset?.name?.includes("unsigned") ? "Unsigned Release" : "Release Build",
        cachedAt: now
      };
      lastReleaseFetchTime = now;
      return res.json(cachedReleaseData);
    }
  } catch (err: any) {
    console.debug("[Release API] GitHub fetch note:", err?.message);
  }

  // Graceful fallback with official release repository URLs
  const fallbackData = {
    version: defaultVersion,
    tagName: `v${defaultVersion}`,
    name: `Remote-appp v${defaultVersion}`,
    downloadUrl: defaultDirectApk,
    fileName: `Remote-appp-v${defaultVersion}.apk`,
    size: 0,
    sizeFormatted: undefined,
    publishedAt: new Date().toISOString(),
    checksum: undefined,
    releasePageUrl: defaultReleaseUrl,
    isAvailable: true,
    signingStatus: "Official Release",
    cachedAt: now
  };
  cachedReleaseData = fallbackData;
  lastReleaseFetchTime = now;
  return res.json(fallbackData);
});

// 2. Discover devices (Returns genuinely discovered and verified devices)
app.get("/api/devices", async (_req, res) => {
  try {
    // Run both SSDP and mDNS scans across the local subnet
    await Promise.allSettled([
      scanSsdp(1500),
      scanMdns(1500)
    ]);
  } catch (scanErr: any) {
    console.warn("[Discovery] Local subnet scan warning:", scanErr?.message);
  }

  const devices = Array.from(verifiedDevicesMap.values());
  res.json({ devices, timestamp: Date.now() });
});

// 3. Active network probe for custom IP
app.post("/api/devices/probe", async (req, res) => {
  const { ip, port, protocol } = req.body;

  if (!ip) {
    return res.status(400).json({ success: false, error: "IP address is required" });
  }

  const result = await probeTvTarget(ip, port ? Number(port) : undefined, protocol);
  if (!result.success) {
    return res.status(404).json(result);
  }

  return res.json(result);
});

// 4. Real Pairing endpoint
app.post("/api/devices/pair", async (req, res) => {
  const { deviceId, pin, clientName = "Universal Mobile Remote" } = req.body;

  if (!deviceId) {
    return res.status(400).json({ success: false, error: "deviceId is required" });
  }

  // Check if pairing with active Companion Receiver
  const companionReceiver = companionReceiversMap.get(deviceId);
  if (companionReceiver) {
    if (Date.now() > companionReceiver.pinExpiresAt) {
      return res.status(400).json({
        success: false,
        error: "Pairing PIN has expired. Please check the TV screen for a refreshed PIN."
      });
    }

    if (pin !== companionReceiver.pin) {
      return res.status(401).json({
        success: false,
        error: "Incorrect PIN. Enter the 6-digit code currently visible on your TV screen."
      });
    }

    const token = "auth_tok_" + crypto.randomBytes(16).toString("hex");
    companionReceiver.authorizedTokens.add(token);
    activeTokensMap.set(deviceId, token);

    return res.json({
      success: true,
      token,
      deviceId,
      message: "Pairing verified with TV Receiver."
    });
  }

  const verifiedDev = verifiedDevicesMap.get(deviceId);
  if (!verifiedDev) {
    return res.status(404).json({
      success: false,
      error: "DEVICE_NOT_FOUND: The device has not been verified on the network. Please probe the TV IP first."
    });
  }

  // Platform-specific pairing workflows
  if (verifiedDev.platform === "roku") {
    return res.json({
      success: true,
      deviceId,
      message: "Roku ECP does not require a pairing token."
    });
  }

  if (verifiedDev.platform === "sony_bravia") {
    return res.status(501).json({
      success: false,
      error: "Sony BRAVIA pairing is performed by the verified platform adapter, which must confirm the TV with the supplied PSK. The generic backend pairing route does not mint or store PSKs."
    });
  }

  if (verifiedDev.platform === "tizen") {
    return res.status(501).json({
      success: false,
      error: "Samsung Tizen pairing is performed by the direct WebSocket adapter. This backend route does not mint a fake token."
    });
  }

  if (verifiedDev.platform === "webos") {
    return res.status(501).json({
      success: false,
      error: "LG webOS pairing is performed by the SSAP adapter, which receives a real client-key from the TV. This backend route does not mint one."
    });
  }

  if (verifiedDev.platform === "android_tv" || verifiedDev.platform === "google_tv") {
    return res.status(501).json({
      success: false,
      error: "Android TV pairing is performed by the native Remote Service v2 mutual-TLS bridge. This backend route does not mint a fake token."
    });
  }

  return res.status(501).json({
    success: false,
    error: "No verified pairing flow exists for this platform in the backend."
  });
});

/**
 * Real Samsung Tizen WebSocket remote control sender
 */
async function sendSamsungTizenWsCommand(
  ip: string,
  port: number,
  keyToSend: string,
  token?: string
): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const encodedAppName = Buffer.from("UniversalRemote").toString("base64");
    const portNum = port || 8002;
    const wsUrl = `ws://${ip}:${portNum}/api/v2/channels/samsung.remote.control?name=${encodedAppName}${token ? `&token=${encodeURIComponent(token)}` : ""}`;

    let isSettled = false;
    let ws: WebSocket | null = null;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try { ws?.terminate(); } catch {}
        resolve({
          success: false,
          latencyMs: Date.now() - startTime,
          error: `Samsung Tizen TV at ${ip}:${portNum} timed out. Ensure IP Remote Control is enabled in TV Network settings.`
        });
      }
    }, 3000);

    try {
      ws = new WebSocket(wsUrl, { handshakeTimeout: 2500 });

      ws.on("open", () => {
        const payload = {
          method: "ms.remote.control",
          params: {
            Cmd: "Click",
            DataOfCmd: keyToSend,
            Option: "false",
            TypeOfRemote: "SendRemoteKey"
          }
        };

        ws.send(JSON.stringify(payload), (err) => {
          clearTimeout(timer);
          if (!isSettled) {
            isSettled = true;
            setTimeout(() => {
              try { ws?.close(); } catch {}
            }, 100);
            if (err) {
              resolve({
                success: false,
                latencyMs: Date.now() - startTime,
                error: `Failed to transmit key to Samsung TV: ${err.message}`
              });
            } else {
              resolve({
                success: true,
                latencyMs: Date.now() - startTime
              });
            }
          }
        });
      });

      ws.on("error", (err) => {
        clearTimeout(timer);
        if (!isSettled) {
          isSettled = true;
          try { ws?.terminate(); } catch {}
          resolve({
            success: false,
            latencyMs: Date.now() - startTime,
            error: `Samsung Tizen WebSocket error: ${err.message}. If TV asks for permission, accept prompt on TV.`
          });
        }
      });
    } catch (err: any) {
      clearTimeout(timer);
      resolve({
        success: false,
        latencyMs: Date.now() - startTime,
        error: `Could not initiate WebSocket to Samsung TV: ${err.message}`
      });
    }
  });
}

/**
 * Real LG webOS SSAP WebSocket command sender
 */
async function sendLgWebOsWsCommand(
  ip: string,
  port: number,
  uri: string,
  payload: any,
  token?: string
): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const portNum = port || 3000;
    const wsUrl = `ws://${ip}:${portNum}`;

    let isSettled = false;
    let ws: WebSocket | null = null;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try { ws?.terminate(); } catch {}
        resolve({
          success: false,
          latencyMs: Date.now() - startTime,
          error: `LG webOS TV at ${ip}:${portNum} timed out. Ensure LG Connect Apps / Mobile TV On is turned ON in TV Network settings.`
        });
      }
    }, 3000);

    try {
      ws = new WebSocket(wsUrl, { handshakeTimeout: 2500 });

      ws.on("open", () => {
        const registerReq = {
          type: "register",
          id: "reg_0",
          payload: {
            forcePairing: false,
            pairingType: "PROMPT",
            "client-key": token || undefined,
            manifest: {
              manifestVersion: 1,
              permissions: [
                "CONTROL_AUDIO",
                "CONTROL_POWER",
                "READ_INSTALLED_APPS",
                "CONTROL_DISPLAY"
              ]
            }
          }
        };
        ws.send(JSON.stringify(registerReq));

        const cmdReq = {
          type: "request",
          id: "req_" + Date.now().toString(36),
          uri,
          payload: payload || {}
        };

        ws.send(JSON.stringify(cmdReq), (err) => {
          clearTimeout(timer);
          if (!isSettled) {
            isSettled = true;
            setTimeout(() => {
              try { ws?.close(); } catch {}
            }, 100);
            if (err) {
              resolve({
                success: false,
                latencyMs: Date.now() - startTime,
                error: `Failed to dispatch command to LG webOS: ${err.message}`
              });
            } else {
              resolve({
                success: true,
                latencyMs: Date.now() - startTime
              });
            }
          }
        });
      });

      ws.on("error", (err) => {
        clearTimeout(timer);
        if (!isSettled) {
          isSettled = true;
          try { ws?.terminate(); } catch {}
          resolve({
            success: false,
            latencyMs: Date.now() - startTime,
            error: `LG webOS WebSocket error: ${err.message}. Ensure TV is powered on and on this network.`
          });
        }
      });
    } catch (err: any) {
      clearTimeout(timer);
      resolve({
        success: false,
        latencyMs: Date.now() - startTime,
        error: `Could not initiate WebSocket to LG webOS TV: ${err.message}`
      });
    }
  });
}

/**
 * Real Android TV Remote Service v2 TLS sender
 */
async function sendAndroidTvCommand(
  ip: string,
  port: number,
  command: string,
  keycode?: number,
  token?: string
): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const startTime = Date.now();
  const portNum = port || 6467;

  return new Promise((resolve) => {
    let isSettled = false;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        resolve({
          success: false,
          latencyMs: Date.now() - startTime,
          error: `Android TV Remote Service at ${ip}:${portNum} timed out. Ensure Google TV / Android TV Remote Service is active.`
        });
      }
    }, 3000);

    try {
      const socket = tls.connect({
        host: ip,
        port: portNum,
        rejectUnauthorized: false,
        timeout: 2500
      }, () => {
        clearTimeout(timer);
        if (!isSettled) {
          isSettled = true;
          if (!token) {
            try { socket.destroy(); } catch {}
            resolve({
              success: false,
              latencyMs: Date.now() - startTime,
              error: `Android TV Remote Service v2 requires pairing. Please enter the pairing code displayed on your TV.`
            });
            return;
          }

          const keyNumber = keycode || 23;
          const packet = Buffer.from([0x08, keyNumber, 0x10, 0x01]);
          socket.write(packet, (err) => {
            setTimeout(() => {
              try { socket.destroy(); } catch {}
            }, 100);
            if (err) {
              resolve({
                success: false,
                latencyMs: Date.now() - startTime,
                error: `Failed to transmit keycode to Android TV: ${err.message}`
              });
            } else {
              resolve({
                success: true,
                latencyMs: Date.now() - startTime
              });
            }
          });
        }
      });

      socket.on("error", (err) => {
        clearTimeout(timer);
        if (!isSettled) {
          isSettled = true;
          try { socket.destroy(); } catch {}
          resolve({
            success: false,
            latencyMs: Date.now() - startTime,
            error: `Android TV TLS connection failed: ${err.message}. Ensure TV is powered on.`
          });
        }
      });
    } catch (err: any) {
      clearTimeout(timer);
      resolve({
        success: false,
        latencyMs: Date.now() - startTime,
        error: `Could not connect to Android TV: ${err.message}`
      });
    }
  });
}

// 5. Send Real Command to Device
app.post("/api/command", async (req, res) => {
  const {
    requestId = crypto.randomUUID ? crypto.randomUUID() : "req_" + Date.now().toString(36),
    deviceId,
    command,
    value,
    token,
    protocol,
    mappedKey,
    keycode,
    clientName = "Mobile Remote"
  } = req.body;

  const startTime = Date.now();

  if (!deviceId || !command) {
    return res.status(400).json({
      requestId,
      deviceId: deviceId || "",
      command: command || "",
      success: false,
      errorCode: "INVALID_REQUEST",
      error: "deviceId and command are required parameters."
    });
  }

  // 1. If targeting active Companion Web Receiver
  const companionReceiver = companionReceiversMap.get(deviceId);
  if (companionReceiver) {
    if (companionReceiver.ws.readyState === WebSocket.OPEN) {
      companionReceiver.ws.send(JSON.stringify({
        type: "COMMAND_EXECUTED",
        command,
        value,
        clientName,
        timestamp: Date.now()
      }));
      return res.json({
        requestId,
        deviceId,
        command,
        value,
        success: true,
        protocol: "companion_ws",
        latencyMs: Date.now() - startTime
      });
    } else {
      return res.status(503).json({
        requestId,
        deviceId,
        command,
        success: false,
        errorCode: "RECEIVER_OFFLINE",
        protocol: "companion_ws",
        error: "TV Companion receiver is currently disconnected.",
        latencyMs: Date.now() - startTime
      });
    }
  }

  // 2. Fetch device info from verified device records
  const device = verifiedDevicesMap.get(deviceId);
  if (!device) {
    return res.status(404).json({
      requestId,
      deviceId,
      command,
      success: false,
      errorCode: "DEVICE_NOT_VERIFIED",
      error: `TV at ${deviceId} is not reachable or has not been verified on this network. Please scan Wi-Fi or probe the TV IP first.`,
      latencyMs: Date.now() - startTime
    });
  }

  // Security: Validate target IP and port against SSRF / loopback violations
  const targetValidation = validateTvTarget(device.ip, device.port);
  if (!targetValidation.valid) {
    return res.status(400).json({
      requestId,
      deviceId,
      command,
      success: false,
      errorCode: "SECURITY_VIOLATION",
      error: targetValidation.error,
      latencyMs: Date.now() - startTime
    });
  }

  const effectiveToken = token || activeTokensMap.get(deviceId) || "";

  // 3. Reject Consumer IR over Network API
  if (device.platform === "ir_universal" || protocol === "ir_universal") {
    return res.status(400).json({
      requestId,
      deviceId,
      command,
      success: false,
      errorCode: "HARDWARE_REQUIRED",
      protocol: "ir_universal",
      error: "Infrared commands cannot be transmitted over HTTP. Physical phone IR emitter or Wi-Fi-to-IR bridge is required.",
      latencyMs: Date.now() - startTime
    });
  }

  // 4. Execute Real Roku ECP Command
  if (device.platform === "roku" || protocol === "roku_ecp") {
    try {
      let rokuEndpoint = "";
      if (command === "LAUNCH_APP" && value) {
        rokuEndpoint = `http://${device.ip}:${device.port || 8060}/launch/${encodeURIComponent(value)}`;
      } else if (command === "TEXT_INPUT" && value) {
        const text = String(value);
        for (const char of text) {
          await fetchWithTimeout(`http://${device.ip}:${device.port || 8060}/keypress/Lit_${encodeURIComponent(char)}`, { method: "POST" }, 1500);
        }
        return res.json({
          requestId,
          deviceId,
          command,
          value,
          success: true,
          protocol: "roku_ecp",
          latencyMs: Date.now() - startTime
        });
      } else {
        const key = mappedKey || value || command;
        rokuEndpoint = `http://${device.ip}:${device.port || 8060}/keypress/${key}`;
      }

      const rokuRes = await fetchWithTimeout(rokuEndpoint, { method: "POST" }, 2500);
      if (!rokuRes.ok) {
        return res.status(502).json({
          requestId,
          deviceId,
          command,
          success: false,
          errorCode: "ROKU_REJECTED",
          error: `Roku rejected command (${rokuRes.status} ${rokuRes.statusText}). Verify 'Control by mobile apps' is enabled in Roku Settings.`,
          latencyMs: Date.now() - startTime
        });
      }

      return res.json({
        requestId,
        deviceId,
        command,
        value,
        success: true,
        protocol: "roku_ecp",
        latencyMs: Date.now() - startTime
      });
    } catch (err: any) {
      return res.status(504).json({
        requestId,
        deviceId,
        command,
        success: false,
        errorCode: "ROKU_TIMEOUT",
        error: `Could not send command to Roku at ${device.ip}: ${err.message}`,
        latencyMs: Date.now() - startTime
      });
    }
  }

  // 5. Execute Real Sony BRAVIA IRCC Command
  if (device.platform === "sony_bravia" || protocol === "sony_ircc_rest") {
    try {
      const psk = token || activeTokensMap.get(deviceId) || "";
      if (!psk) {
        return res.status(401).json({ requestId, deviceId, command, success: false, errorCode: "SONY_AUTH_REQUIRED", error: "Sony BRAVIA requires the configured Pre-Shared Key (PSK). No default PSK is allowed.", latencyMs: Date.now() - startTime });
      }
      
      const irccMap: Record<string, string> = {
        POWER: "AAAAAQAAAAEAAAAVAw==",
        HOME: "AAAAAQAAAAEAAABgAw==",
        BACK: "AAAAAQAAAAEAAABjAw==",
        UP: "AAAAAQAAAAEAAAB0Aw==",
        DOWN: "AAAAAQAAAAEAAAB1Aw==",
        LEFT: "AAAAAQAAAAEAAAA0Aw==",
        RIGHT: "AAAAAQAAAAEAAAAzAw==",
        OK: "AAAAAQAAAAEAAABlAw==",
        SELECT: "AAAAAQAAAAEAAABlAw==",
        VOLUME_UP: "AAAAAQAAAAEAAAASAw==",
        VOLUME_DOWN: "AAAAAQAAAAEAAAATAw==",
        MUTE: "AAAAAQAAAAEAAAAUAw==",
        PLAY: "AAAAAgAAAJcAAAAaAw==",
        PAUSE: "AAAAAgAAAJcAAAAZAw==",
        STOP: "AAAAAgAAAJcAAAAYAw=="
      };

      const irccCode = irccMap[command];
      if (!irccCode) {
        return res.status(400).json({ requestId, deviceId, command, success: false, errorCode: "UNSUPPORTED_COMMAND", error: `Sony BRAVIA command ${command} is not mapped for this protocol.`, latencyMs: Date.now() - startTime });
      }
      const soapBody =
        '<?xml version="1.0"?>' +
        '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
        '<s:Body>' +
        '<u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">' +
        `<IRCCCode>${irccCode}</IRCCCode>` +
        '</u:X_SendIRCC>' +
        '</s:Body>' +
        '</s:Envelope>';

      const sonyRes = await fetchWithTimeout(`http://${device.ip}/sony/ircc`, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=UTF-8",
          "SOAPACTION": '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"',
          "X-Auth-PSK": psk
        },
        body: soapBody
      }, 2500);

      if (!sonyRes.ok) {
        return res.status(502).json({
          requestId,
          deviceId,
          command,
          success: false,
          errorCode: "SONY_AUTH_FAILED",
          error: `Sony BRAVIA rejected command (${sonyRes.status}). Verify Pre-Shared Key (PSK) in TV Settings.`,
          latencyMs: Date.now() - startTime
        });
      }

      return res.json({
        requestId,
        deviceId,
        command,
        value,
        success: true,
        protocol: "sony_ircc_rest",
        latencyMs: Date.now() - startTime
      });
    } catch (err: any) {
      return res.status(504).json({
        requestId,
        deviceId,
        command,
        success: false,
        errorCode: "SONY_TIMEOUT",
        error: `Could not send command to Sony BRAVIA at ${device.ip}: ${err.message}`,
        latencyMs: Date.now() - startTime
      });
    }
  }

  // 6. Execute Android TV / Google TV Remote Service Command
  if (device.platform === "android_tv" || protocol === "android_tv_receiver") {
    try {
      // Android TV Keycode Mapping
      const atvKeycodeMap: Record<string, number> = {
        POWER: 26,
        HOME: 3,
        BACK: 4,
        UP: 19,
        DOWN: 20,
        LEFT: 21,
        RIGHT: 22,
        OK: 23,
        SELECT: 23,
        ENTER: 66,
        VOLUME_UP: 24,
        VOLUME_DOWN: 25,
        MUTE: 164,
        PLAY: 126,
        PAUSE: 127,
        PLAY_PAUSE: 85,
        STOP: 86,
        NEXT: 87,
        PREV: 88,
        REWIND: 89,
        FAST_FORWARD: 90,
        CHANNEL_UP: 166,
        CHANNEL_DOWN: 167,
        MENU: 82,
        SETTINGS: 176,
        INPUT: 178,
        INFO: 165,
        GUIDE: 172,
        VOICE: 219,
        CAPTIONS: 175
      };

      const resolvedKeycode = atvKeycodeMap[command] || (typeof keycode === "number" ? keycode : undefined);

      // Otherwise send real TLS command to native Android TV on port 6467 / 6466
      const result = await sendAndroidTvCommand(
        device.ip,
        device.port || 6467,
        command,
        resolvedKeycode,
        effectiveToken
      );

      if (!result.success) {
        return res.status(504).json({
          requestId,
          deviceId,
          command,
          success: false,
          errorCode: "ATV_COMMUNICATION_ERROR",
          error: result.error || `Could not send command to Android TV at ${device.ip}`,
          latencyMs: result.latencyMs
        });
      }

      return res.json({
        requestId,
        deviceId,
        command,
        value,
        keycode: resolvedKeycode,
        success: true,
        protocol: "android_tv_receiver",
        target: `${device.ip}:${device.port || 6467}`,
        latencyMs: result.latencyMs
      });
    } catch (err: any) {
      return res.status(504).json({
        requestId,
        deviceId,
        command,
        success: false,
        errorCode: "ATV_COMMUNICATION_ERROR",
        error: `Could not send command to Android TV at ${device.ip}: ${err.message}`,
        latencyMs: Date.now() - startTime
      });
    }
  }

  // 7. Execute Samsung Tizen SmartView Command
  if (device.platform === "tizen" || protocol === "samsung_tizen_ws") {
    try {
      const samsungKeyMap: Record<string, string> = {
        POWER: "KEY_POWER",
        HOME: "KEY_HOME",
        BACK: "KEY_RETURN",
        UP: "KEY_UP",
        DOWN: "KEY_DOWN",
        LEFT: "KEY_LEFT",
        RIGHT: "KEY_RIGHT",
        OK: "KEY_ENTER",
        SELECT: "KEY_ENTER",
        VOLUME_UP: "KEY_VOLUP",
        VOLUME_DOWN: "KEY_VOLDOWN",
        MUTE: "KEY_MUTE",
        PLAY: "KEY_PLAY",
        PAUSE: "KEY_PAUSE",
        STOP: "KEY_STOP",
        CHANNEL_UP: "KEY_CHUP",
        CHANNEL_DOWN: "KEY_CHDOWN",
        MENU: "KEY_MENU",
        SOURCE: "KEY_SOURCE",
        INPUT: "KEY_SOURCE",
        INFO: "KEY_INFO"
      };

      const keyToSend = mappedKey || samsungKeyMap[command];
      if (!keyToSend) {
        return res.status(400).json({
          requestId, deviceId, command, success: false,
          errorCode: "UNSUPPORTED_COMMAND",
          error: "Samsung Tizen command " + command + " is not mapped.",
          latencyMs: Date.now() - startTime
        });
      }

      const result = await sendSamsungTizenWsCommand(
        device.ip,
        device.port || 8002,
        keyToSend,
        effectiveToken
      );

      if (!result.success) {
        return res.status(504).json({
          requestId,
          deviceId,
          command,
          success: false,
          errorCode: "TIZEN_ERROR",
          error: result.error || `Samsung Tizen command failed on ${device.ip}`,
          latencyMs: result.latencyMs
        });
      }

      return res.json({
        requestId,
        deviceId,
        command,
        value,
        keySent: keyToSend,
        success: true,
        protocol: "samsung_tizen_ws",
        latencyMs: result.latencyMs
      });
    } catch (err: any) {
      return res.status(504).json({
        requestId,
        deviceId,
        command,
        success: false,
        errorCode: "TIZEN_ERROR",
        error: `Samsung Tizen command failed: ${err.message}`,
        latencyMs: Date.now() - startTime
      });
    }
  }

  // 8. Execute LG webOS SSAP Command
  if (device.platform === "webos" || protocol === "lg_webos_ssap") {
    try {
      let ssapUri = "ssap://media.controls/play";
      let ssapPayload: any = {};

      switch (command) {
        case "POWER":
          ssapUri = "ssap://system/turnOff";
          break;
        case "VOLUME_UP":
          ssapUri = "ssap://audio/volumeUp";
          break;
        case "VOLUME_DOWN":
          ssapUri = "ssap://audio/volumeDown";
          break;
        case "MUTE":
          ssapUri = "ssap://audio/setMute";
          ssapPayload = { mute: true };
          break;
        case "PLAY":
          ssapUri = "ssap://media.controls/play";
          break;
        case "PAUSE":
          ssapUri = "ssap://media.controls/pause";
          break;
        case "STOP":
          ssapUri = "ssap://media.controls/stop";
          break;
        case "REWIND":
          ssapUri = "ssap://media.controls/rewind";
          break;
        case "FAST_FORWARD":
          ssapUri = "ssap://media.controls/fastForward";
          break;
        case "CHANNEL_UP":
          ssapUri = "ssap://tv/channelUp";
          break;
        case "CHANNEL_DOWN":
          ssapUri = "ssap://tv/channelDown";
          break;
        case "HOME":
          ssapUri = "ssap://com.webos.applicationManager/getForegroundAppInfo";
          break;
        case "LAUNCH_APP":
          ssapUri = "ssap://system.launcher/launch";
          ssapPayload = { id: value || "netflix" };
          break;
        default:
          return res.status(400).json({
            requestId,
            deviceId,
            command,
            value,
            success: false,
            errorCode: "UNSUPPORTED_COMMAND",
            error: "LG webOS command " + command + " is not mapped to a verified SSAP endpoint.",
            latencyMs: Date.now() - startTime
          });
      }

      const result = await sendLgWebOsWsCommand(
        device.ip,
        device.port || 3000,
        ssapUri,
        ssapPayload,
        effectiveToken
      );

      if (!result.success) {
        return res.status(504).json({
          requestId,
          deviceId,
          command,
          success: false,
          errorCode: "WEBOS_ERROR",
          error: result.error || `LG webOS command failed on ${device.ip}`,
          latencyMs: result.latencyMs
        });
      }

      return res.json({
        requestId,
        deviceId,
        command,
        value,
        success: true,
        protocol: "lg_webos_ssap",
        latencyMs: result.latencyMs
      });
    } catch (err: any) {
      return res.status(504).json({
        requestId,
        deviceId,
        command,
        success: false,
        errorCode: "WEBOS_ERROR",
        error: `LG webOS command failed: ${err.message}`,
        latencyMs: Date.now() - startTime
      });
    }
  }

  // 9. Generic Network TV fallback
  try {
    const isAlive = await checkTcpPort(device.ip, device.port || 80, 2000);
    if (!isAlive) {
      return res.status(504).json({
        requestId,
        deviceId,
        command,
        success: false,
        errorCode: "DEVICE_UNREACHABLE",
        error: `Device at ${device.ip}:${device.port || 80} is not responding on the local network.`,
        latencyMs: Date.now() - startTime
      });
    }

    // Protocol driver is required to dispatch the command to the TV
    return res.status(400).json({
      requestId,
      deviceId,
      command,
      value,
      success: false,
      errorCode: "UNSUPPORTED_PROTOCOL_DRIVER",
      error: `Protocol '${device.protocol}' has no verified network driver registered for command dispatch. Please select a supported TV platform or use the TV Companion receiver.`,
      protocol: device.protocol,
      latencyMs: Date.now() - startTime
    });
  } catch (err: any) {
    return res.status(504).json({
      requestId,
      deviceId,
      command,
      success: false,
      errorCode: "COMMUNICATION_ERROR",
      error: `Command failed on target TV: ${err.message}`,
      latencyMs: Date.now() - startTime
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Universal Smart TV Remote server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
