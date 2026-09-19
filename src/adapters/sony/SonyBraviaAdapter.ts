import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

const IRCC_CODES: Partial<Record<RemoteCommandType, string>> = {
  POWER: "AAAAAQAAAAEAAAAVAw==",
  INPUT: "AAAAAQAAAAEAAAAlAw==",
  UP: "AAAAAQAAAAEAAAB0Aw==",
  DOWN: "AAAAAQAAAAEAAAB1Aw==",
  LEFT: "AAAAAQAAAAEAAAA0Aw==",
  RIGHT: "AAAAAQAAAAEAAAAzAw==",
  OK: "AAAAAQAAAAEAAABlAw==",
  BACK: "AAAAAgAAAJcAAAAjAw==",
  HOME: "AAAAAQAAAAEAAABgAw==",
  VOLUME_UP: "AAAAAQAAAAEAAAASAw==",
  VOLUME_DOWN: "AAAAAQAAAAEAAAATAw==",
  MUTE: "AAAAAQAAAAEAAAAUAw==",
  CHANNEL_UP: "AAAAAQAAAAEAAAAQAw==",
  CHANNEL_DOWN: "AAAAAQAAAAEAAAARAw==",
  PLAY: "AAAAAgAAAJcAAAAaAw==",
  PAUSE: "AAAAAgAAAJcAAAAZAw==",
  STOP: "AAAAAgAAAJcAAAAYAw==",
  PREVIOUS: "AAAAAgAAAJcAAAA8Aw==",
  NEXT: "AAAAAgAAAJcAAAA9Aw==",
  NUMBER_0: "AAAAAQAAAAEAAAAJAw==",
  NUMBER_1: "AAAAAQAAAAEAAAAAAw==",
  NUMBER_2: "AAAAAQAAAAEAAAABAw==",
  NUMBER_3: "AAAAAQAAAAEAAAACAw==",
  NUMBER_4: "AAAAAQAAAAEAAAADAw==",
  NUMBER_5: "AAAAAQAAAAEAAAAEAw==",
  NUMBER_6: "AAAAAQAAAAEAAAAFAw==",
  NUMBER_7: "AAAAAQAAAAEAAAAGAw==",
  NUMBER_8: "AAAAAQAAAAEAAAAHAw==",
  NUMBER_9: "AAAAAQAAAAEAAAAIAw==",
  COLOR_RED: "AAAAAgAAAJcAAAAlAw==",
  COLOR_GREEN: "AAAAAgAAAJcAAAAmAw==",
  COLOR_YELLOW: "AAAAAgAAAJcAAAAnAw==",
  COLOR_BLUE: "AAAAAgAAAJcAAAAkAw=="
};

export class SonyBraviaAdapter implements TvAdapter {
  readonly platform = "sony_bravia";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "UNKNOWN",
      touchpad: "UNSUPPORTED",
      apps: "DEVICE_DEPENDENT",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "UNSUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    };
  }

  private async sendIrcc(device: TvDevice, code: string, psk: string): Promise<void> {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">
      <IRCCCode>${code}</IRCCCode>
    </u:X_SendIRCC>
  </s:Body>
</s:Envelope>`;

    const res = await fetch(`http://${device.ip}:${device.port || 80}/sony/IRCC`, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=UTF-8",
        "SOAPACTION": '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"',
        "X-Auth-PSK": psk
      },
      body: envelope
    });

    if (!res.ok) throw new Error(`Sony IRCC HTTP ${res.status}`);
  }

  private async probe(device: TvDevice, psk: string): Promise<void> {
    const res = await fetch(`http://${device.ip}:${device.port || 80}/sony/system`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Auth-PSK": psk
      },
      body: JSON.stringify({
        method: "getPowerStatus",
        params: [],
        id: 1,
        version: "1.0"
      })
    });
    if (!res.ok) throw new Error(`Sony BRAVIA probe HTTP ${res.status}`);
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const startTime = performance.now();
    const psk = TokenVault.getToken(device.id) || device.token;

    if (!psk) {
      return {
        success: false, command, value, timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: "Sony BRAVIA requires its configured Pre-Shared Key before network remote control can be used."
      };
    }

    const code = IRCC_CODES[command];
    if (!code) {
      return {
        success: false, command, value, timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Sony IRCC command is not verified for "${command}".`
      };
    }

    try {
      await this.sendIrcc(device, code, psk);
      return {
        success: true, command, value, timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        protocol: "sony_ircc_rest"
      };
    } catch (err: any) {
      return {
        success: false, command, value, timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: err?.message || `Could not reach Sony BRAVIA at ${device.ip}.`
      };
    }
  }

  async authenticate(
    device: TvDevice,
    pin: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    const psk = pin.trim();
    if (!psk) return { success: false, error: "Enter the Sony BRAVIA Pre-Shared Key." };

    try {
      await this.probe(device, psk);
      TokenVault.saveToken(device.id, psk);
      return { success: true, token: psk };
    } catch (err: any) {
      return { success: false, error: err?.message || "Sony BRAVIA rejected the Pre-Shared Key or is unreachable." };
    }
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    const psk = TokenVault.getToken(device.id) || device.token;
    if (!psk) return { online: false, error: "Sony BRAVIA PSK is required before protocol verification." };

    try {
      await this.probe(device, psk);
      return { online: true, latencyMs: Math.round(performance.now() - start) };
    } catch (err: any) {
      return { online: false, latencyMs: Math.round(performance.now() - start), error: err?.message || "Sony BRAVIA protocol verification failed." };
    }
  }
}
