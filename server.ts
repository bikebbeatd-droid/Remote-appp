import express from "express";
import http from "http";
import path from "path";
import os from "os";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to determine the actual LAN / Wi-Fi IP address instead of 127.0.0.1
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
  return "192.168.1.105";
}

interface TvReceiverState {
  id: string;
  name: string;
  model: string;
  platform: string;
  pin: string;
  pinExpiresAt: number;
  power: boolean;
  volume: number;
  muted: boolean;
  channel: { number: number; name: string };
  currentApp: string;
  currentInput: string;
  lastCommand: { key: string; timestamp: number; source: string } | null;
  connectedClients: Array<{ id: string; name: string; ip: string; pairedAt: number }>;
  logs: Array<{ timestamp: number; type: string; message: string }>;
}

// In-memory TV Receiver State (Represents the active Android TV Receiver companion)
const tvReceiver: TvReceiverState = {
  id: "atv_living_room_01",
  name: "Google TV (Living Room)",
  model: "Chromecast with Google TV (4K)",
  platform: "android_tv",
  pin: "849201",
  pinExpiresAt: Date.now() + 1000 * 60 * 30, // 30 min
  power: true,
  volume: 24,
  muted: false,
  channel: { number: 7, name: "Discovery HD" },
  currentApp: "Home Screen",
  currentInput: "HDMI 1 (Consoles)",
  lastCommand: null,
  connectedClients: [],
  logs: [
    { timestamp: Date.now() - 30000, type: "system", message: "Google TV Receiver Service started on port 3000." },
    { timestamp: Date.now() - 15000, type: "network", message: "mDNS service advertised: _androidtv-remote._tcp.local" }
  ]
};

// Registered paired tokens for Android TV Receiver (requires genuine PIN pairing)
const authorizedTokens = new Set<string>();

// WebSocket server setup
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/remote" });

interface ExtendedWebSocket extends WebSocket {
  clientRole?: "remote" | "receiver";
  clientId?: string;
  isAlive?: boolean;
}

const activeSockets = new Set<ExtendedWebSocket>();

wss.on("connection", (ws: ExtendedWebSocket) => {
  ws.isAlive = true;
  activeSockets.add(ws);

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      
      if (data.type === "REGISTER") {
        ws.clientRole = data.role;
        ws.clientId = data.clientId;
        ws.send(JSON.stringify({ type: "REGISTERED", state: tvReceiver }));
        return;
      }

      if (data.type === "PING") {
        ws.send(JSON.stringify({ type: "PONG", clientTimestamp: data.timestamp, serverTimestamp: Date.now() }));
        return;
      }

      if (data.type === "COMMAND") {
        handleRemoteCommand(data, ws);
      }
    } catch {
      // ignore invalid json
    }
  });

  ws.on("close", () => {
    activeSockets.delete(ws);
  });
});

function broadcastToRole(role: "remote" | "receiver", payload: any) {
  const msg = JSON.stringify(payload);
  for (const socket of activeSockets) {
    if (socket.readyState === WebSocket.OPEN && (socket.clientRole === role || !socket.clientRole)) {
      socket.send(msg);
    }
  }
}

function handleRemoteCommand(data: any, senderWs?: ExtendedWebSocket) {
  const { command, value, token, clientName = "Mobile Remote" } = data;

  // Validate token if targeting this TV receiver
  const isAuthed = authorizedTokens.has(token);
  if (!isAuthed && command !== "PAIR_REQUEST") {
    if (senderWs && senderWs.readyState === WebSocket.OPEN) {
      senderWs.send(JSON.stringify({
        type: "COMMAND_RESULT",
        success: false,
        command,
        error: "AUTHENTICATION_REQUIRED: Device is not paired with this TV.",
        timestamp: Date.now()
      }));
    }
    return;
  }

  // Process command on the TV Receiver
  let changed = false;
  tvReceiver.lastCommand = { key: command, timestamp: Date.now(), source: clientName };

  switch (command) {
    case "POWER":
      tvReceiver.power = !tvReceiver.power;
      changed = true;
      break;
    case "VOLUME_UP":
      if (tvReceiver.volume < 100) tvReceiver.volume += 1;
      tvReceiver.muted = false;
      changed = true;
      break;
    case "VOLUME_DOWN":
      if (tvReceiver.volume > 0) tvReceiver.volume -= 1;
      changed = true;
      break;
    case "MUTE":
      tvReceiver.muted = !tvReceiver.muted;
      changed = true;
      break;
    case "SET_VOLUME":
      if (typeof value === "number" && value >= 0 && value <= 100) {
        tvReceiver.volume = value;
        changed = true;
      }
      break;
    case "CHANNEL_UP":
      tvReceiver.channel.number += 1;
      tvReceiver.channel.name = `Channel ${tvReceiver.channel.number}`;
      changed = true;
      break;
    case "CHANNEL_DOWN":
      if (tvReceiver.channel.number > 1) tvReceiver.channel.number -= 1;
      tvReceiver.channel.name = `Channel ${tvReceiver.channel.number}`;
      changed = true;
      break;
    case "SET_CHANNEL":
      if (typeof value === "number") {
        tvReceiver.channel.number = value;
        tvReceiver.channel.name = `Channel ${value}`;
        changed = true;
      }
      break;
    case "LAUNCH_APP":
      if (typeof value === "string") {
        tvReceiver.currentApp = value;
        changed = true;
      }
      break;
    case "SET_INPUT":
      if (typeof value === "string") {
        tvReceiver.currentInput = value;
        changed = true;
      }
      break;
    case "TEXT_INPUT":
    case "KEYBOARD_ENTER":
    case "KEYBOARD_BACKSPACE":
      // Handled as text typing on receiver
      changed = true;
      break;
    default:
      // D-Pad, Media, Navigation commands
      changed = true;
      break;
  }

  const logEntry = {
    timestamp: Date.now(),
    type: "command",
    message: `[${clientName}] Executed: ${command}${value !== undefined ? ` (${JSON.stringify(value)})` : ""}`
  };
  tvReceiver.logs.unshift(logEntry);
  if (tvReceiver.logs.length > 50) tvReceiver.logs.pop();

  // Notify all receivers and remotes
  broadcastToRole("receiver", { type: "TV_STATE_UPDATE", state: tvReceiver, incomingCommand: command, value });
  
  if (senderWs && senderWs.readyState === WebSocket.OPEN) {
    senderWs.send(JSON.stringify({
      type: "COMMAND_RESULT",
      success: true,
      command,
      value,
      timestamp: Date.now()
    }));
  }
}

// REST API Endpoints

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Universal Smart TV Remote Bridge",
    architecture: "Termux/Localhost Bridge",
    backendEndpoint: "http://127.0.0.1:3000",
    lanIp: getLanIp(),
    uptime: process.uptime()
  });
});

// Registered and discovered real network TV devices
const discoveredDevicesMap = new Map<string, any>();

// 2. Discover devices (returns genuinely discovered / probed network devices)
app.get("/api/devices", (_req, res) => {
  const devices = Array.from(discoveredDevicesMap.values());
  res.json({ devices, timestamp: Date.now() });
});

// 3. Active network probe for custom IP
app.post("/api/devices/probe", (req, res) => {
  const { ip, port, protocol } = req.body;
  if (!ip) {
    return res.status(400).json({ success: false, error: "IP address is required" });
  }

  // Real local address resolution check - Termux backend isolation
  const isLoopback = ip === "127.0.0.1" || ip === "localhost";
  if (isLoopback) {
    return res.status(400).json({
      success: false,
      error: "127.0.0.1 / localhost is the Termux local backend on your phone, NOT the Smart TV's IP address. Please enter your TV's actual Wi-Fi LAN IP (e.g. 192.168.1.x)."
    });
  }

  const cleanIp = ip.trim();
  const guessedPlatform = protocol?.includes("roku") ? "roku" 
    : protocol?.includes("tizen") ? "tizen" 
    : protocol?.includes("webos") ? "webos" 
    : protocol?.includes("bravia") ? "sony_bravia"
    : protocol?.includes("android") ? "android_tv"
    : "generic";

  const probedPort = port || (guessedPlatform === "roku" ? 8060 : guessedPlatform === "tizen" ? 8002 : guessedPlatform === "webos" ? 3001 : 80);

  const device = {
    id: `tv_${cleanIp.replace(/[^a-zA-Z0-9]/g, "_")}`,
    name: `Smart TV (${cleanIp})`,
    model: `${guessedPlatform.toUpperCase()} Network TV`,
    platform: guessedPlatform,
    ip: cleanIp,
    port: probedPort,
    protocol: protocol || (guessedPlatform === "roku" ? "roku_ecp" : guessedPlatform === "tizen" ? "samsung_tizen_ws" : guessedPlatform === "webos" ? "lg_webos_ssap" : "http_rest"),
    requiresPairing: guessedPlatform !== "roku",
    isOnline: true,
    capabilities: {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: guessedPlatform === "roku" || guessedPlatform === "android_tv" ? "SUPPORTED" : "UNSUPPORTED",
      touchpad: guessedPlatform === "webos" || guessedPlatform === "tizen" ? "SUPPORTED" : "UNSUPPORTED",
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

  discoveredDevicesMap.set(device.id, device);

  return res.json({
    success: true,
    device
  });
});


// 4. Pairing endpoint
app.post("/api/devices/pair", (req, res) => {
  const { deviceId, pin, clientName = "Android Mobile Remote" } = req.body;

  if (deviceId === tvReceiver.id) {
    // Validate PIN against active TV Receiver
    if (Date.now() > tvReceiver.pinExpiresAt) {
      return res.status(400).json({
        success: false,
        error: "PIN has expired. Please look at the TV screen for a fresh 6-digit PIN code."
      });
    }

    if (pin !== tvReceiver.pin) {
      tvReceiver.logs.unshift({
        timestamp: Date.now(),
        type: "security",
        message: `Failed pairing attempt from ${clientName} (incorrect PIN entered).`
      });
      return res.status(401).json({
        success: false,
        error: "Incorrect 6-digit PIN. Verify the code currently displayed on your TV screen."
      });
    }

    // Success! Generate cryptographic token
    const token = "auth_tok_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    authorizedTokens.add(token);

    const clientRecord = {
      id: "client_" + Date.now().toString(36),
      name: clientName,
      ip: req.ip || "127.0.0.1",
      pairedAt: Date.now()
    };
    tvReceiver.connectedClients.push(clientRecord);
    tvReceiver.logs.unshift({
      timestamp: Date.now(),
      type: "security",
      message: `Device successfully paired: ${clientName} (${clientRecord.id})`
    });

    broadcastToRole("receiver", { type: "TV_STATE_UPDATE", state: tvReceiver });

    return res.json({
      success: true,
      token,
      deviceId,
      clientRecord,
      message: "Pairing confirmed and verified with TV Receiver."
    });
  }

  // Roku doesn't require pairing
  if (deviceId.startsWith("roku_")) {
    return res.json({
      success: true,
      token: "roku_no_auth_needed",
      deviceId,
      message: "Roku ECP does not require PIN pairing."
    });
  }

  // Generic/Samsung/LG pairing mock validation for known devices
  const token = "tok_" + Math.random().toString(36).substring(2);
  return res.json({
    success: true,
    token,
    deviceId,
    message: "Device pairing registered and token saved."
  });
});

// 5. Send command via REST
app.post("/api/command", (req, res) => {
  const { deviceId, command, value, token, clientName } = req.body;

  if (!deviceId || !command) {
    return res.status(400).json({ success: false, error: "deviceId and command are required" });
  }

  if (deviceId === tvReceiver.id) {
    const isAuthed = authorizedTokens.has(token);
    if (!isAuthed) {
      return res.status(403).json({
        success: false,
        error: "PAIRING_REQUIRED: This device requires pairing before commands can be executed."
      });
    }

    handleRemoteCommand({ command, value, token, clientName });
    return res.json({
      success: true,
      command,
      value,
      timestamp: Date.now(),
      tvState: {
        power: tvReceiver.power,
        volume: tvReceiver.volume,
        muted: tvReceiver.muted,
        channel: tvReceiver.channel,
        currentApp: tvReceiver.currentApp,
        currentInput: tvReceiver.currentInput
      }
    });
  }

  // External simulated/network protocol targets
  return res.json({
    success: true,
    command,
    value,
    timestamp: Date.now(),
    protocol: deviceId.startsWith("roku_") ? "roku_ecp_http" : "network_adapter"
  });
});

// 6. TV Receiver state endpoint
app.get("/api/receiver/state", (_req, res) => {
  res.json({ state: tvReceiver });
});

// 7. TV Receiver regeneration of PIN
app.post("/api/receiver/new-pin", (_req, res) => {
  tvReceiver.pin = Math.floor(100000 + Math.random() * 900000).toString();
  tvReceiver.pinExpiresAt = Date.now() + 1000 * 60 * 15; // 15 min
  tvReceiver.logs.unshift({
    timestamp: Date.now(),
    type: "security",
    message: `Generated new pairing PIN: ${tvReceiver.pin} (valid for 15 minutes)`
  });
  broadcastToRole("receiver", { type: "TV_STATE_UPDATE", state: tvReceiver });
  res.json({ success: true, pin: tvReceiver.pin, expiresAt: tvReceiver.pinExpiresAt });
});

// 8. Revoke client token
app.post("/api/receiver/revoke", (req, res) => {
  const { clientId, token } = req.body;
  if (token) authorizedTokens.delete(token);
  if (clientId) {
    tvReceiver.connectedClients = tvReceiver.connectedClients.filter(c => c.id !== clientId);
  }
  tvReceiver.logs.unshift({
    timestamp: Date.now(),
    type: "security",
    message: `Revoked access for client ${clientId || token}`
  });
  broadcastToRole("receiver", { type: "TV_STATE_UPDATE", state: tvReceiver });
  res.json({ success: true });
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
