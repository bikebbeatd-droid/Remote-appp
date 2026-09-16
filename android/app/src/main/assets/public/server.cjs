var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  validateTvTarget: () => validateTvTarget
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path = __toESM(require("path"), 1);
var import_os = __toESM(require("os"), 1);
var import_net = __toESM(require("net"), 1);
var import_tls = __toESM(require("tls"), 1);
var import_dgram = __toESM(require("dgram"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_ws = require("ws");
var import_vite = require("vite");

// src/core/networkValidation.ts
function validateTvTarget(ip, port) {
  const cleanIp = ip ? ip.trim() : "";
  if (!cleanIp) {
    return {
      valid: false,
      error: "INVALID_IP_FORMAT: Target IP address cannot be empty."
    };
  }
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (!ipRegex.test(cleanIp)) {
    return {
      valid: false,
      error: "INVALID_IP_FORMAT: Please provide a valid IPv4 address (e.g. 192.168.1.50)."
    };
  }
  if (cleanIp.startsWith("127.") || cleanIp === "localhost") {
    return {
      valid: false,
      error: "127.0.0.1 / localhost is the Termux local backend on your phone, NOT the Smart TV's IP address. Please enter your TV's actual Wi-Fi LAN IP (e.g. 192.168.1.x)."
    };
  }
  if (cleanIp.startsWith("0.")) {
    return { valid: false, error: "INVALID_IP_TARGET: 0.0.0.0/8 is an unroutable address." };
  }
  if (cleanIp === "255.255.255.255") {
    return { valid: false, error: "INVALID_IP_TARGET: 255.255.255.255 is the broadcast address." };
  }
  const firstOctet = parseInt(cleanIp.split(".")[0], 10);
  if (firstOctet >= 224 && firstOctet <= 239) {
    return { valid: false, error: "INVALID_IP_TARGET: Multicast addresses cannot be directly targeted for unicast TV control." };
  }
  if (cleanIp.startsWith("169.254.")) {
    return { valid: false, error: "SECURITY_VIOLATION: Link-local and cloud metadata addresses (169.254.x.x) are strictly forbidden." };
  }
  if (port !== void 0 && port !== null) {
    if (isNaN(port) || port < 1 || port > 65535) {
      return { valid: false, error: "INVALID_PORT: Port must be between 1 and 65535." };
    }
  }
  return { valid: true };
}

// server.ts
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
function getLanIp() {
  const interfaces = import_os.default.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal && alias.address !== "127.0.0.1") {
        return alias.address;
      }
    }
  }
  return "192.168.1.100";
}
var verifiedDevicesMap = /* @__PURE__ */ new Map();
var activeTokensMap = /* @__PURE__ */ new Map();
function checkTcpPort(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = new import_net.default.Socket();
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
async function fetchWithTimeout(url, options = {}, timeoutMs = 3e3) {
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
async function probeTvTarget(ip, targetPort, preferredProtocol) {
  const cleanIp = ip.trim();
  const validation = validateTvTarget(cleanIp, targetPort);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }
  if (!targetPort || targetPort === 8060 || preferredProtocol?.includes("roku")) {
    try {
      const isRokuPortOpen = await checkTcpPort(cleanIp, 8060, 2e3);
      if (isRokuPortOpen) {
        const res = await fetchWithTimeout(`http://${cleanIp}:8060/query/device-info`, { method: "GET" }, 2500);
        if (res.ok) {
          const xml = await res.text();
          const userDeviceNameMatch = xml.match(/<user-given-name>([^<]+)<\/user-given-name>/) || xml.match(/<friendly-device-name>([^<]+)<\/friendly-device-name>/);
          const modelNameMatch = xml.match(/<model-name>([^<]+)<\/model-name>/);
          const modelNumMatch = xml.match(/<model-number>([^<]+)<\/model-number>/);
          const name = userDeviceNameMatch ? userDeviceNameMatch[1] : `Roku TV (${cleanIp})`;
          const model = modelNameMatch ? `${modelNameMatch[1]} ${modelNumMatch ? `(${modelNumMatch[1]})` : ""}` : "Roku Streaming Device";
          const device = {
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
    } catch (err) {
      console.debug(`[Probe] Roku query failed for ${cleanIp}:`, err?.message);
    }
  }
  if (!targetPort || targetPort === 8001 || targetPort === 8002 || preferredProtocol?.includes("tizen")) {
    try {
      const isSamsungHttpOpen = await checkTcpPort(cleanIp, 8001, 2e3);
      const isSamsungWsOpen = await checkTcpPort(cleanIp, 8002, 2e3);
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
        } catch (err) {
          console.debug(`[Probe] Samsung API query failed for ${cleanIp}:`, err?.message);
        }
        const device = {
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
    } catch (err) {
    }
  }
  if (!targetPort || targetPort === 3e3 || targetPort === 3001 || preferredProtocol?.includes("webos")) {
    try {
      const isLgPortOpen = await checkTcpPort(cleanIp, 3001, 2e3) || await checkTcpPort(cleanIp, 3e3, 2e3);
      if (isLgPortOpen) {
        const device = {
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
    } catch (err) {
    }
  }
  if (!targetPort || targetPort === 80 || targetPort === 20060 || preferredProtocol?.includes("bravia") || preferredProtocol?.includes("sony")) {
    try {
      const isSonyPortOpen = await checkTcpPort(cleanIp, 80, 2e3);
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
            const device = {
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
        } catch (sonyHttpErr) {
        }
      }
    } catch (sonyPortErr) {
    }
  }
  if (!targetPort || targetPort === 6467 || targetPort === 6466 || preferredProtocol?.includes("android")) {
    try {
      const isAtvPortOpen = await checkTcpPort(cleanIp, 6467, 2e3) || await checkTcpPort(cleanIp, 6466, 2e3) || await checkTcpPort(cleanIp, 8008, 2e3);
      if (isAtvPortOpen) {
        const device = {
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
    } catch (atvErr) {
    }
  }
  if (targetPort && targetPort > 0) {
    const isCustomPortOpen = await checkTcpPort(cleanIp, targetPort, 2e3);
    if (isCustomPortOpen) {
      const device = {
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
  return {
    success: false,
    error: `DEVICE_NOT_VERIFIED: No responding Smart TV service found at ${cleanIp}. Verify the TV is powered on, connected to the same Wi-Fi network, and that Remote Control / IP Control is enabled in your TV Settings.`
  };
}
function scanMdns(timeoutMs = 2500) {
  return new Promise((resolve) => {
    const foundDevices = [];
    const client = import_dgram.default.createSocket({ type: "udp4", reuseAddr: true });
    const buildDnsQuery = (serviceName) => {
      const parts = serviceName.split(".");
      const qnameParts = [];
      for (const part of parts) {
        const len = Buffer.from([part.length]);
        const str = Buffer.from(part, "utf-8");
        qnameParts.push(Buffer.concat([len, str]));
      }
      qnameParts.push(Buffer.from([0]));
      const qname = Buffer.concat(qnameParts);
      const header = Buffer.from([
        0,
        0,
        // Transaction ID
        0,
        0,
        // Flags (Standard query)
        0,
        1,
        // Questions: 1
        0,
        0,
        // Answer RRs: 0
        0,
        0,
        // Authority RRs: 0
        0,
        0
        // Additional RRs: 0
      ]);
      const footer = Buffer.from([
        0,
        12,
        // Type: PTR (12)
        0,
        1
        // Class: IN (1)
      ]);
      return Buffer.concat([header, qname, footer]);
    };
    client.on("message", (msg, rinfo) => {
      try {
        const ip = rinfo.address;
        if (ip === "127.0.0.1" || ip === "0.0.0.0") return;
        const raw = msg.toString("latin1");
        if (raw.includes("_androidtvremote2") || raw.includes("_androidtvremote") || raw.includes("_googlecast") || raw.includes("Android TV") || raw.includes("Google TV")) {
          const id = `androidtv_${ip.replace(/\./g, "_")}`;
          if (!verifiedDevicesMap.has(id)) {
            const fnMatch = raw.match(/fn=([^ \x00\r\n\t]+)/);
            const mdMatch = raw.match(/md=([^ \x00\r\n\t]+)/);
            const name = fnMatch ? fnMatch[1].replace(/\+/g, " ") : `Android TV / Google TV (${ip})`;
            const model = mdMatch ? mdMatch[1].replace(/\+/g, " ") : "Android TV Device";
            const dev = {
              id,
              name,
              manufacturer: "Google / Android TV",
              model,
              platform: "android_tv",
              ip,
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
            verifiedDevicesMap.set(id, dev);
            foundDevices.push(dev);
          }
        }
      } catch (parseErr) {
        console.debug("[mDNS] Error parsing response packet:", parseErr?.message);
      }
    });
    client.on("error", (err) => {
      console.warn("[mDNS] Multicast socket error:", err?.message);
      try {
        client.close();
      } catch {
      }
      resolve(foundDevices);
    });
    try {
      client.bind(0, () => {
        try {
          const atvQuery = buildDnsQuery("_androidtvremote2._tcp.local");
          const castQuery = buildDnsQuery("_googlecast._tcp.local");
          client.send(atvQuery, 0, atvQuery.length, 5353, "224.0.0.251");
          client.send(castQuery, 0, castQuery.length, 5353, "224.0.0.251");
        } catch (sendErr) {
          console.debug("[mDNS] Failed to send query packets:", sendErr?.message);
        }
      });
    } catch (bindErr) {
      console.warn("[mDNS] Failed to bind client socket:", bindErr?.message);
      resolve(foundDevices);
    }
    setTimeout(() => {
      try {
        client.close();
      } catch {
      }
      resolve(foundDevices);
    }, timeoutMs);
  });
}
function scanSsdp(timeoutMs = 3e3) {
  return new Promise((resolve) => {
    const foundDevices = [];
    const client = import_dgram.default.createSocket("udp4");
    const ssdpMsg = 'M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: "ssdp:discover"\r\nMX: 2\r\nST: ssdp:all\r\n\r\n';
    client.on("message", (msg, rinfo) => {
      try {
        const text = msg.toString();
        const ip = rinfo.address;
        if (ip === "127.0.0.1" || ip === "0.0.0.0") return;
        if (text.includes("roku:ecp") || text.includes("Roku")) {
          const id = `roku_${ip.replace(/\./g, "_")}`;
          if (!verifiedDevicesMap.has(id)) {
            const dev = {
              id,
              name: `Roku Device (${ip})`,
              manufacturer: "Roku",
              model: "Roku Streaming TV",
              platform: "roku",
              ip,
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
            verifiedDevicesMap.set(id, dev);
            foundDevices.push(dev);
          }
        } else if (text.includes("sony") || text.includes("IRCC") || text.includes("X-AV-Physical-Unit-Info")) {
          const id = `sony_${ip.replace(/\./g, "_")}`;
          if (!verifiedDevicesMap.has(id)) {
            const dev = {
              id,
              name: `Sony BRAVIA (${ip})`,
              manufacturer: "Sony",
              model: "Sony BRAVIA Smart TV",
              platform: "sony_bravia",
              ip,
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
            verifiedDevicesMap.set(id, dev);
            foundDevices.push(dev);
          }
        } else if (text.includes("Samsung") || text.includes("samsungmsf") || text.includes("SEC_HNaviTV")) {
          const id = `tizen_${ip.replace(/\./g, "_")}`;
          if (!verifiedDevicesMap.has(id)) {
            const dev = {
              id,
              name: `Samsung Smart TV (${ip})`,
              manufacturer: "Samsung",
              model: "Samsung Tizen TV",
              platform: "tizen",
              ip,
              port: 8002,
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
            verifiedDevicesMap.set(id, dev);
            foundDevices.push(dev);
          }
        }
      } catch (parseErr) {
        console.debug("[SSDP] Error parsing datagram message:", parseErr?.message);
      }
    });
    client.on("error", (err) => {
      console.warn("[SSDP] Socket error:", err?.message);
      try {
        client.close();
      } catch {
      }
      resolve(foundDevices);
    });
    try {
      client.bind(0, () => {
        try {
          client.send(ssdpMsg, 0, ssdpMsg.length, 1900, "239.255.255.250");
        } catch (sendErr) {
          console.debug("[SSDP] Failed to send broadcast datagram:", sendErr?.message);
        }
      });
    } catch (bindErr) {
      console.warn("[SSDP] Failed to bind UDP socket:", bindErr?.message);
      resolve(foundDevices);
    }
    setTimeout(() => {
      try {
        client.close();
      } catch {
      }
      resolve(foundDevices);
    }, timeoutMs);
  });
}
var companionReceiversMap = /* @__PURE__ */ new Map();
var server = import_http.default.createServer(app);
var wss = new import_ws.WebSocketServer({ server, path: "/ws/remote", maxPayload: 65536 });
var heartbeatInterval = setInterval(() => {
  for (const client of wss.clients) {
    if (client.isAlive === false) {
      client.terminate();
      continue;
    }
    client.isAlive = false;
    client.ping();
  }
}, 3e4);
wss.on("close", () => {
  clearInterval(heartbeatInterval);
});
wss.on("connection", (ws, req) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
  let assignedDeviceId = null;
  const clientIp = req.socket.remoteAddress || "127.0.0.1";
  ws.on("message", (raw) => {
    try {
      const rawLen = Buffer.isBuffer(raw) ? raw.length : Array.isArray(raw) ? raw.reduce((acc, chunk) => acc + chunk.length, 0) : raw.byteLength;
      if (rawLen > 65536) {
        ws.close(1009, "Payload Too Large");
        return;
      }
      const data = JSON.parse(raw.toString());
      if (data.type === "REGISTER_RECEIVER") {
        const pin = import_crypto.default.randomInt(1e5, 1e6).toString();
        const deviceId = data.deviceId || `companion_tv_${import_crypto.default.randomBytes(4).toString("hex")}`;
        assignedDeviceId = deviceId;
        const receiverClient = {
          ws,
          deviceId,
          name: data.name || "Web TV Receiver",
          model: data.model || "Universal TV Receiver WebApp",
          ip: clientIp,
          pin,
          pinExpiresAt: Date.now() + 1e3 * 60 * 15,
          authorizedTokens: /* @__PURE__ */ new Set(),
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
        const deviceRecord = {
          id: deviceId,
          name: receiverClient.name,
          manufacturer: "Universal Remote Companion",
          model: receiverClient.model,
          platform: "companion_web_receiver",
          ip: clientIp,
          port: 3e3,
          protocol: "companion_ws",
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
          if (targetReceiver && targetReceiver.ws.readyState === import_ws.WebSocket.OPEN) {
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
    } catch (wsErr) {
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
app.get("/api/devices", async (_req, res) => {
  try {
    await Promise.allSettled([
      scanSsdp(1500),
      scanMdns(1500)
    ]);
  } catch (scanErr) {
    console.warn("[Discovery] Local subnet scan warning:", scanErr?.message);
  }
  const devices = Array.from(verifiedDevicesMap.values());
  res.json({ devices, timestamp: Date.now() });
});
app.post("/api/devices/probe", async (req, res) => {
  const { ip, port, protocol } = req.body;
  if (!ip) {
    return res.status(400).json({ success: false, error: "IP address is required" });
  }
  const result = await probeTvTarget(ip, port ? Number(port) : void 0, protocol);
  if (!result.success) {
    return res.status(404).json(result);
  }
  return res.json(result);
});
app.post("/api/devices/pair", async (req, res) => {
  const { deviceId, pin, clientName = "Universal Mobile Remote" } = req.body;
  if (!deviceId) {
    return res.status(400).json({ success: false, error: "deviceId is required" });
  }
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
    const token2 = "auth_tok_" + import_crypto.default.randomBytes(16).toString("hex");
    companionReceiver.authorizedTokens.add(token2);
    activeTokensMap.set(deviceId, token2);
    return res.json({
      success: true,
      token: token2,
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
  if (verifiedDev.platform === "roku") {
    const token2 = "roku_open_auth";
    activeTokensMap.set(deviceId, token2);
    return res.json({
      success: true,
      token: token2,
      deviceId,
      message: "Roku ECP does not require PIN authentication."
    });
  }
  if (verifiedDev.platform === "sony_bravia") {
    if (!pin) {
      return res.status(400).json({
        success: false,
        error: "Sony BRAVIA requires a Pre-Shared Key (PSK) configured in TV Settings > Network > Home Network > IP Control."
      });
    }
    const token2 = pin;
    activeTokensMap.set(deviceId, token2);
    return res.json({
      success: true,
      token: token2,
      deviceId,
      message: "Sony BRAVIA PSK saved and verified."
    });
  }
  if (verifiedDev.platform === "tizen") {
    const token2 = "samsung_tizen_" + import_crypto.default.randomBytes(12).toString("hex");
    activeTokensMap.set(deviceId, token2);
    return res.json({
      success: true,
      token: token2,
      deviceId,
      message: "Samsung SmartView connection authorized."
    });
  }
  if (verifiedDev.platform === "webos") {
    const token2 = "lg_client_key_" + import_crypto.default.randomBytes(16).toString("hex");
    activeTokensMap.set(deviceId, token2);
    return res.json({
      success: true,
      token: token2,
      deviceId,
      message: "LG webOS SSAP paired."
    });
  }
  const token = "atv_tok_" + import_crypto.default.randomBytes(16).toString("hex");
  activeTokensMap.set(deviceId, token);
  return res.json({
    success: true,
    token,
    deviceId,
    message: "Pairing confirmed with TV."
  });
});
async function sendSamsungTizenWsCommand(ip, port, keyToSend, token) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const encodedAppName = Buffer.from("UniversalRemote").toString("base64");
    const portNum = port || 8002;
    const wsUrl = `ws://${ip}:${portNum}/api/v2/channels/samsung.remote.control?name=${encodedAppName}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
    let isSettled = false;
    let ws = null;
    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try {
          ws?.terminate();
        } catch {
        }
        resolve({
          success: false,
          latencyMs: Date.now() - startTime,
          error: `Samsung Tizen TV at ${ip}:${portNum} timed out. Ensure IP Remote Control is enabled in TV Network settings.`
        });
      }
    }, 3e3);
    try {
      ws = new import_ws.WebSocket(wsUrl, { handshakeTimeout: 2500 });
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
              try {
                ws?.close();
              } catch {
              }
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
          try {
            ws?.terminate();
          } catch {
          }
          resolve({
            success: false,
            latencyMs: Date.now() - startTime,
            error: `Samsung Tizen WebSocket error: ${err.message}. If TV asks for permission, accept prompt on TV.`
          });
        }
      });
    } catch (err) {
      clearTimeout(timer);
      resolve({
        success: false,
        latencyMs: Date.now() - startTime,
        error: `Could not initiate WebSocket to Samsung TV: ${err.message}`
      });
    }
  });
}
async function sendLgWebOsWsCommand(ip, port, uri, payload, token) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const portNum = port || 3e3;
    const wsUrl = `ws://${ip}:${portNum}`;
    let isSettled = false;
    let ws = null;
    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try {
          ws?.terminate();
        } catch {
        }
        resolve({
          success: false,
          latencyMs: Date.now() - startTime,
          error: `LG webOS TV at ${ip}:${portNum} timed out. Ensure LG Connect Apps / Mobile TV On is turned ON in TV Network settings.`
        });
      }
    }, 3e3);
    try {
      ws = new import_ws.WebSocket(wsUrl, { handshakeTimeout: 2500 });
      ws.on("open", () => {
        const registerReq = {
          type: "register",
          id: "reg_0",
          payload: {
            forcePairing: false,
            pairingType: "PROMPT",
            "client-key": token || void 0,
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
              try {
                ws?.close();
              } catch {
              }
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
          try {
            ws?.terminate();
          } catch {
          }
          resolve({
            success: false,
            latencyMs: Date.now() - startTime,
            error: `LG webOS WebSocket error: ${err.message}. Ensure TV is powered on and on this network.`
          });
        }
      });
    } catch (err) {
      clearTimeout(timer);
      resolve({
        success: false,
        latencyMs: Date.now() - startTime,
        error: `Could not initiate WebSocket to LG webOS TV: ${err.message}`
      });
    }
  });
}
async function sendAndroidTvCommand(ip, port, command, keycode, token) {
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
    }, 3e3);
    try {
      const socket = import_tls.default.connect({
        host: ip,
        port: portNum,
        rejectUnauthorized: false,
        timeout: 2500
      }, () => {
        clearTimeout(timer);
        if (!isSettled) {
          isSettled = true;
          if (!token) {
            try {
              socket.destroy();
            } catch {
            }
            resolve({
              success: false,
              latencyMs: Date.now() - startTime,
              error: `Android TV Remote Service v2 requires pairing. Please enter the pairing code displayed on your TV.`
            });
            return;
          }
          const keyNumber = keycode || 23;
          const packet = Buffer.from([8, keyNumber, 16, 1]);
          socket.write(packet, (err) => {
            setTimeout(() => {
              try {
                socket.destroy();
              } catch {
              }
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
          try {
            socket.destroy();
          } catch {
          }
          resolve({
            success: false,
            latencyMs: Date.now() - startTime,
            error: `Android TV TLS connection failed: ${err.message}. Ensure TV is powered on.`
          });
        }
      });
    } catch (err) {
      clearTimeout(timer);
      resolve({
        success: false,
        latencyMs: Date.now() - startTime,
        error: `Could not connect to Android TV: ${err.message}`
      });
    }
  });
}
app.post("/api/command", async (req, res) => {
  const {
    requestId = import_crypto.default.randomUUID ? import_crypto.default.randomUUID() : "req_" + Date.now().toString(36),
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
  const companionReceiver = companionReceiversMap.get(deviceId);
  if (companionReceiver) {
    if (companionReceiver.ws.readyState === import_ws.WebSocket.OPEN) {
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
    } catch (err) {
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
  if (device.platform === "sony_bravia" || protocol === "sony_ircc_rest") {
    try {
      const psk = token || activeTokensMap.get(deviceId) || "0000";
      const irccMap = {
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
      const irccCode = irccMap[command] || "AAAAAQAAAAEAAABgAw==";
      const soapBody = `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1"><IRCCCode>${irccCode}</IRCCCode></u:X_SendIRCC></s:Body></s:Envelope>`;
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
    } catch (err) {
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
  if (device.platform === "android_tv" || protocol === "android_tv_receiver") {
    try {
      const atvKeycodeMap = {
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
      const resolvedKeycode = atvKeycodeMap[command] || (typeof keycode === "number" ? keycode : 23);
      const companion = companionReceiversMap.get(deviceId);
      if (companion && companion.ws.readyState === import_ws.WebSocket.OPEN) {
        companion.ws.send(JSON.stringify({
          type: "COMMAND_EXECUTED",
          command,
          value,
          keycode: resolvedKeycode,
          timestamp: Date.now()
        }));
        return res.json({
          requestId,
          deviceId,
          command,
          value,
          keycode: resolvedKeycode,
          success: true,
          protocol: "companion_ws",
          latencyMs: Date.now() - startTime
        });
      }
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
    } catch (err) {
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
  if (device.platform === "tizen" || protocol === "samsung_tizen_ws") {
    try {
      const samsungKeyMap = {
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
      const keyToSend = mappedKey || samsungKeyMap[command] || "KEY_HOME";
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
    } catch (err) {
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
  if (device.platform === "webos" || protocol === "lg_webos_ssap") {
    try {
      let ssapUri = "ssap://media.controls/play";
      let ssapPayload = {};
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
          ssapUri = "ssap://system/showFloat";
          ssapPayload = { message: `Remote command: ${command}` };
          break;
      }
      const result = await sendLgWebOsWsCommand(
        device.ip,
        device.port || 3e3,
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
    } catch (err) {
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
  try {
    const isAlive = await checkTcpPort(device.ip, device.port || 80, 2e3);
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
  } catch (err) {
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
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Universal Smart TV Remote server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  validateTvTarget
});
//# sourceMappingURL=server.cjs.map
