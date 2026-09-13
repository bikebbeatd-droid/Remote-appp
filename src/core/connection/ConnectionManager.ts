import { TvDevice, ConnectionState } from "../types";
import { AdapterRegistry } from "../../adapters/AdapterRegistry";

export type ConnectionStateListener = (
  state: ConnectionState,
  device: TvDevice | null,
  info?: { latencyMs?: number; error?: string }
) => void;

export class ConnectionManager {
  private static instance: ConnectionManager;
  private state: ConnectionState = "DISCONNECTED";
  private activeDevice: TvDevice | null = null;
  private heartbeatInterval: any = null;
  private consecutiveFailures = 0;
  private listeners: Set<ConnectionStateListener> = new Set();
  private isChecking = false;

  private constructor() {}

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  getState(): ConnectionState {
    return this.state;
  }

  getActiveDevice(): TvDevice | null {
    return this.activeDevice;
  }

  subscribe(listener: ConnectionStateListener): () => void {
    this.listeners.add(listener);
    // Notify immediately with current state
    listener(this.state, this.activeDevice);
    return () => this.listeners.delete(listener);
  }

  private setState(state: ConnectionState, info?: { latencyMs?: number; error?: string }) {
    this.state = state;
    for (const listener of this.listeners) {
      try {
        listener(state, this.activeDevice, info);
      } catch {}
    }
  }

  setActiveDevice(device: TvDevice | null) {
    this.stopHeartbeat();
    this.activeDevice = device;
    this.consecutiveFailures = 0;

    if (!device) {
      this.setState("DISCONNECTED");
      return;
    }

    if (device.requiresPairing && !device.isPaired) {
      this.setState("PAIRING");
    } else {
      // Connect to device
      this.connect(device);
    }
  }

  async connect(device: TvDevice): Promise<boolean> {
    this.activeDevice = device;
    this.setState("CONNECTING");

    const adapter = AdapterRegistry.getAdapterForDevice(device);
    const pingResult = await adapter.ping(device);

    if (pingResult.online) {
      this.consecutiveFailures = 0;
      this.setState("CONNECTED", { latencyMs: pingResult.latencyMs });
      this.startHeartbeat();
      return true;
    } else {
      this.setState("DISCONNECTED", { error: pingResult.error || "TV unreachable" });
      return false;
    }
  }

  disconnect() {
    this.stopHeartbeat();
    this.consecutiveFailures = 0;
    this.setState("DISCONNECTED");
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      await this.runHeartbeatCheck();
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async runHeartbeatCheck() {
    if (!this.activeDevice || this.isChecking) return;
    this.isChecking = true;

    try {
      const adapter = AdapterRegistry.getAdapterForDevice(this.activeDevice);
      const pingResult = await adapter.ping(this.activeDevice);

      if (pingResult.online) {
        this.consecutiveFailures = 0;
        if (this.state !== "CONNECTED") {
          this.setState("CONNECTED", { latencyMs: pingResult.latencyMs });
        }
      } else {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= 2) {
          this.setState("RECONNECTING", { error: "Lost connection to TV. Reconnecting..." });
        }
        if (this.consecutiveFailures >= 5) {
          this.setState("DISCONNECTED", { error: "TV unresponsive after repeated attempts." });
          this.stopHeartbeat();
        }
      }
    } catch {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= 2) {
        this.setState("RECONNECTING");
      }
    } finally {
      this.isChecking = false;
    }
  }
}

export const globalConnectionManager = ConnectionManager.getInstance();
