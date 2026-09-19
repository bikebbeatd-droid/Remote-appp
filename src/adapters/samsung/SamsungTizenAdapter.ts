import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";

/**
 * Samsung Tizen SmartView remote transport.
 *
 * The Android/WebView app connects directly to the TV's local WebSocket
 * endpoint. No /api/command, /api/devices/probe or /api/devices/pair backend
 * is required for normal remote-key operation.
 */
export class SamsungTizenAdapter implements TvAdapter {
  readonly platform = "tizen";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
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
      ir: "UNSUPPORTED",
      bluetooth: "UNKNOWN",
      wifi: "SUPPORTED"
    };
  }

  private mapSamsungKey(command: RemoteCommandType): string | null {
    switch (command) {
      case "POWER": return "KEY_POWER";
      case "HOME": return "KEY_HOME";
      case "BACK": return "KEY_RETURN";
      case "MENU": return "KEY_MENU";
      case "UP": return "KEY_UP";
      case "DOWN": return "KEY_DOWN";
      case "LEFT": return "KEY_LEFT";
      case "RIGHT": return "KEY_RIGHT";
      case "OK": return "KEY_ENTER";
      case "VOLUME_UP": return "KEY_VOLUP";
      case "VOLUME_DOWN": return "KEY_VOLDOWN";
      case "MUTE": return "KEY_MUTE";
      case "PLAY": return "KEY_PLAY";
      case "PAUSE": return "KEY_PAUSE";
      case "PLAY_PAUSE": return "KEY_PLAY";
      case "STOP": return "KEY_STOP";
      case "REWIND": return "KEY_REWIND";
      case "FAST_FORWARD": return "KEY_FF";
      case "PREVIOUS": return "KEY_PREV";
      case "NEXT": return "KEY_NEXT";
      case "INPUT": return "KEY_SOURCE";
      case "INFO": return "KEY_INFO";
      case "GUIDE": return "KEY_GUIDE";
      case "CHANNEL_UP": return "KEY_CHUP";
      case "CHANNEL_DOWN": return "KEY_CHDOWN";
      case "NUMBER_0": return "KEY_0";
      case "NUMBER_1": return "KEY_1";
      case "NUMBER_2": return "KEY_2";
      case "NUMBER_3": return "KEY_3";
      case "NUMBER_4": return "KEY_4";
      case "NUMBER_5": return "KEY_5";
      case "NUMBER_6": return "KEY_6";
      case "NUMBER_7": return "KEY_7";
      case "NUMBER_8": return "KEY_8";
      case "NUMBER_9": return "KEY_9";
      case "COLOR_RED": return "KEY_RED";
      case "COLOR_GREEN": return "KEY_GREEN";
      case "COLOR_YELLOW": return "KEY_YELLOW";
      case "COLOR_BLUE": return "KEY_BLUE";
      default: return null;
    }
  }

  private getClientName(): string {
    return "Universal Smart Remote";
  }

  private getWebSocketUrl(device: TvDevice): string {
    const port = device.port === 8001 ? 8001 : 8002;
    const scheme = port === 8002 ? "wss" : "ws";
    const encodedName = btoa(this.getClientName());
    return `${scheme}://${device.ip}:${port}/api/v2/channels/samsung.remote.control?name=${encodeURIComponent(encodedName)}`;
  }

  private openSocket(device: TvDevice, timeoutMs = 4500): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.getWebSocketUrl(device));
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn();
      };
      const timer = setTimeout(() => {
        try { socket.close(); } catch {}
        finish(() => reject(new Error("Samsung TV WebSocket connection timed out.")));
      }, timeoutMs);

      socket.onopen = () => finish(() => resolve(socket));
      socket.onerror = () => finish(() => reject(new Error("Samsung TV rejected the WebSocket connection. Check that the phone and TV are on the same Wi-Fi and allow remote access on the TV.")));
      socket.onclose = () => {
        if (!settled) finish(() => reject(new Error("Samsung TV closed the WebSocket connection.")));
      };
    });
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const startTime = performance.now();
    if (command === "VOICE_QUERY") {
      return {
        success: false,
        command,
        timestamp: Date.now(),
        latencyMs: 0,
        error: "Voice audio streaming is not supported by the Samsung local remote-key protocol."
      };
    }

    const key = this.mapSamsungKey(command);
    if (!key) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: 0,
        error: `Samsung Tizen transport does not implement command ${command}.`
      };
    }

    let socket: WebSocket | undefined;
    try {
      socket = await this.openSocket(device);
      socket.send(JSON.stringify({
        method: "ms.remote.control",
        params: {
          Cmd: "Click",
          DataOfCmd: key,
          Option: "false",
          TypeOfRemote: "SendRemoteKey"
        }
      }));

      const latencyMs = Math.round(performance.now() - startTime);
      try { socket.close(); } catch {}
      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "samsung_tizen_ws_direct"
      };
    } catch (err: any) {
      try { socket?.close(); } catch {}
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: err?.message || `Could not reach Samsung TV at ${device.ip}:${device.port || 8002}.`
      };
    }
  }

  async authenticate(
    device: TvDevice,
    _pin: string,
    _clientName = "Universal Smart Remote"
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const socket = await this.openSocket(device);
      try { socket.close(); } catch {}
      return {
        success: true,
        token: "samsung_local_ws"
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Samsung TV pairing/connection failed. Accept the connection prompt on the TV if shown."
      };
    }
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const socket = await this.openSocket(device, 3000);
      const latencyMs = Math.round(performance.now() - start);
      try { socket.close(); } catch {}
      return { online: true, latencyMs };
    } catch (err: any) {
      return {
        online: false,
        latencyMs: Math.round(performance.now() - start),
        error: err?.message || "Samsung TV is unreachable."
      };
    }
  }
}
