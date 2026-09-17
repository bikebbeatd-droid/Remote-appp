import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

/**
 * Direct LG webOS SSAP transport.
 * webOS exposes a local WebSocket endpoint (normally port 3000/3001).
 * Pairing returns a client-key which is reused for later connections.
 */
export class LgWebOsAdapter implements TvAdapter {
  readonly platform = "webos";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "DEVICE_DEPENDENT", navigation: "SUPPORTED", volume: "SUPPORTED", media: "SUPPORTED",
      keyboard: "SUPPORTED", touchpad: "SUPPORTED", apps: "SUPPORTED", input: "SUPPORTED",
      voice: "UNSUPPORTED", channels: "SUPPORTED", ir: "UNSUPPORTED", bluetooth: "DEVICE_DEPENDENT", wifi: "SUPPORTED"
    };
  }

  private socketUrl(device: TvDevice): string {
    const port = device.port || 3000;
    return `${port === 3001 ? "wss" : "ws"}://${device.ip}:${port}`;
  }

  private waitForOpen(ws: WebSocket, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => { cleanup(); reject(new Error("LG webOS WebSocket connection timed out.")); }, timeoutMs);
      const cleanup = () => { window.clearTimeout(timer); ws.onopen = null; ws.onerror = null; };
      ws.onopen = () => { cleanup(); resolve(); };
      ws.onerror = () => { cleanup(); reject(new Error("Unable to connect to LG webOS TV.")); };
    });
  }

  private nextMessage(ws: WebSocket, timeoutMs: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => { cleanup(); reject(new Error("Timed out waiting for LG webOS response.")); }, timeoutMs);
      const cleanup = () => { window.clearTimeout(timer); ws.removeEventListener("message", onMessage); ws.removeEventListener("error", onError); };
      const onMessage = (event: MessageEvent) => {
        try { const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data; cleanup(); resolve(data); } catch { /* ignore non-JSON frames */ }
      };
      const onError = () => { cleanup(); reject(new Error("LG webOS WebSocket error.")); };
      ws.addEventListener("message", onMessage);
      ws.addEventListener("error", onError);
    });
  }

  private async connectRegistered(device: TvDevice, pairingType: "PROMPT" | "PIN" = "PROMPT"): Promise<WebSocket> {
    const ws = new WebSocket(this.socketUrl(device));
    await this.waitForOpen(ws, 5000);
    const clientKey = TokenVault.getToken(device.id) || device.token || null;
    ws.send(JSON.stringify({
      type: "register", id: "register_0",
      payload: {
        "client-key": clientKey, forcePairing: false, pairingType,
        manifest: {
          manifestVersion: 1, appVersion: "1.0.0",
          permissions: [
            "LAUNCH", "LAUNCH_WEBAPP", "APP_TO_APP", "CLOSE", "CONTROL_AUDIO",
            "CONTROL_INPUT_MEDIA_PLAYBACK", "CONTROL_INPUT_TV", "CONTROL_POWER", "CONTROL_TV_SCREEN",
            "READ_APP_STATUS", "READ_CURRENT_CHANNEL", "READ_INPUT_DEVICE_LIST", "READ_NETWORK_STATE",
            "READ_RUNNING_APPS", "READ_TV_CHANNEL_LIST", "READ_POWER_STATE", "READ_INSTALLED_APPS",
            "CONTROL_INPUT_TEXT", "CONTROL_MOUSE_AND_KEYBOARD", "WRITE_NOTIFICATION_TOAST"
          ]
        }
      }
    }));

    const first = await this.nextMessage(ws, 6000);
    if (first?.type === "error") {
      ws.close();
      throw new Error(first.error || first.payload?.errorText || "LG webOS registration failed.");
    }
    if (first?.type === "registered") {
      const key = first.payload?.["client-key"];
      if (key) TokenVault.saveToken(device.id, key);
      return ws;
    }
    if (first?.type === "response" && first.payload?.pairingType) return ws;
    throw new Error("Unexpected LG webOS registration response.");
  }

  private async request(device: TvDevice, uri: string, payload: Record<string, any> = {}): Promise<any> {
    const ws = await this.connectRegistered(device);
    try {
      const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      ws.send(JSON.stringify({ type: "request", id, uri, payload }));
      const response = await this.nextMessage(ws, 5000);
      if (response?.type === "error") throw new Error(response.error || response.payload?.errorText || `LG request failed: ${uri}`);
      return response;
    } finally { try { ws.close(); } catch {} }
  }

  private async pointerCommand(device: TvDevice, type: "button" | "click" | "move", value?: any): Promise<void> {
    const main = await this.connectRegistered(device);
    try {
      const id = `pointer_${Date.now()}`;
      main.send(JSON.stringify({ type: "request", id, uri: "ssap://com.webos.service.networkinput/getPointerInputSocket", payload: {} }));
      const response = await this.nextMessage(main, 5000);
      const socketPath = response?.payload?.socketPath;
      if (!socketPath) throw new Error("LG TV did not provide a pointer input socket.");
      const inputWs = new WebSocket(socketPath);
      await this.waitForOpen(inputWs, 5000);
      if (type === "button") inputWs.send(JSON.stringify({ type: "button", name: value }));
      else if (type === "click") inputWs.send(JSON.stringify({ type: "click" }));
      else inputWs.send(JSON.stringify({ type: "move", dx: Number(value?.dx || 0), dy: Number(value?.dy || 0), down: Number(value?.down || 0) }));
      window.setTimeout(() => { try { inputWs.close(); } catch {} }, 40);
    } finally { try { main.close(); } catch {} }
  }

  private async runCommand(device: TvDevice, command: RemoteCommandType, value?: any): Promise<void> {
    const pointerMap: Partial<Record<RemoteCommandType, string>> = {
      HOME: "HOME", BACK: "BACK", MENU: "MENU", UP: "UP", DOWN: "DOWN", LEFT: "LEFT", RIGHT: "RIGHT", OK: "ENTER",
      VOLUME_UP: "VOLUMEUP", VOLUME_DOWN: "VOLUMEDOWN", MUTE: "MUTE", CHANNEL_UP: "CHANNELUP", CHANNEL_DOWN: "CHANNELDOWN",
      PLAY: "PLAY", PAUSE: "PAUSE", STOP: "STOP", PREVIOUS: "REWIND", NEXT: "FASTFORWARD", REWIND: "REWIND", FAST_FORWARD: "FASTFORWARD",
      EXIT: "EXIT", INFO: "INFO", GUIDE: "GUIDE", DASH: "DASH", COLOR_RED: "RED", COLOR_GREEN: "GREEN", COLOR_YELLOW: "YELLOW", COLOR_BLUE: "BLUE",
      NUMBER_0: "0", NUMBER_1: "1", NUMBER_2: "2", NUMBER_3: "3", NUMBER_4: "4", NUMBER_5: "5", NUMBER_6: "6", NUMBER_7: "7", NUMBER_8: "8", NUMBER_9: "9"
    };
    const pointer = pointerMap[command];
    if (pointer) { await this.pointerCommand(device, "button", pointer); return; }
    switch (command) {
      case "POWER": await this.request(device, "ssap://system/turnOff"); return;
      case "SET_VOLUME": await this.request(device, "ssap://audio/setVolume", { volume: Math.max(0, Math.min(100, Number(value))) }); return;
      case "PLAY_PAUSE": await this.pointerCommand(device, "button", "PLAY"); return;
      case "SET_CHANNEL": await this.request(device, "ssap://tv/openChannel", { channelId: String(value) }); return;
      case "PREV_CHANNEL": await this.pointerCommand(device, "button", "CHANNELDOWN"); return;
      case "INPUT": await this.request(device, "ssap://tv/getExternalInputList"); return;
      case "SET_INPUT": await this.request(device, "ssap://tv/switchInput", { inputId: String(value) }); return;
      case "TEXT_INPUT": await this.request(device, "ssap://com.webos.service.ime/insertText", { text: String(value ?? ""), replace: 0 }); return;
      case "KEYBOARD_ENTER": await this.request(device, "ssap://com.webos.service.ime/sendEnterKey"); return;
      case "KEYBOARD_BACKSPACE": await this.request(device, "ssap://com.webos.service.ime/deleteCharacters", { count: 1 }); return;
      case "LAUNCH_APP": await this.request(device, "ssap://system.launcher/launch", { id: String(value) }); return;
      case "TOUCHPAD_MOVE": await this.pointerCommand(device, "move", value || {}); return;
      case "TOUCHPAD_CLICK": await this.pointerCommand(device, "click"); return;
      default: throw new Error(`LG webOS command not implemented: ${command}`);
    }
  }

  async executeCommand(device: TvDevice, command: RemoteCommandType, value?: any): Promise<CommandExecutionResult> {
    const startTime = performance.now();
    try {
      await this.runCommand(device, command, value);
      return { success: true, command, value, timestamp: Date.now(), latencyMs: Math.round(performance.now() - startTime), protocol: "lg_webos_ssap_direct" };
    } catch (err: any) {
      return { success: false, command, value, timestamp: Date.now(), latencyMs: Math.round(performance.now() - startTime), protocol: "lg_webos_ssap_direct", error: err?.message || `Could not reach LG webOS TV at ${device.ip}:${device.port || 3000}.` };
    }
  }

  async authenticate(device: TvDevice, pin: string, _clientName = "Universal Remote"): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const existingToken = TokenVault.getToken(device.id) || device.token;
      if (existingToken) {
        const ws = await this.connectRegistered(device);
        ws.close();
        return { success: true, token: existingToken };
      }

      const pairingType = pin ? "PIN" : "PROMPT";
      const ws = await this.connectRegistered(device, pairingType);
      if (pairingType === "PIN") {
        ws.send(JSON.stringify({ type: "request", id: "register_1", uri: "ssap://pairing/setPin", payload: { pin } }));
        const pinResponse = await this.nextMessage(ws, 8000);
        if (pinResponse?.type === "error") { ws.close(); return { success: false, error: pinResponse.error || pinResponse.payload?.errorText || "LG webOS pairing rejected." }; }
      }
      const registered = await this.nextMessage(ws, 10000);
      const token = registered?.payload?.["client-key"];
      ws.close();
      if (registered?.type !== "registered" || !token) return { success: false, error: "LG TV did not complete pairing." };
      TokenVault.saveToken(device.id, token);
      return { success: true, token };
    } catch (err: any) { return { success: false, error: err?.message || "Failed to pair with LG TV." }; }
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const ws = await this.connectRegistered(device);
      ws.close();
      return { online: true, latencyMs: Math.round(performance.now() - start) };
    } catch (err: any) { return { online: false, latencyMs: Math.round(performance.now() - start), error: err?.message || "LG webOS TV unreachable." }; }
  }
}
