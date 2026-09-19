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
  private sessionVersion = 0;

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
    this.sessionVersion++;
    this.activeDevice = device;
    this.consecutiveFailures = 0;

    if (!device) {
      this.setState("DISCONNECTED");
      return;
    }

    // Discovery may identify a device before pairing is complete. Never probe a
    // pairing-required device as if it were already connected.
    if (device.requiresPairing && !device.isPaired) {
      this.setState("PAIRING");
      return;
    }

    // Only an explicitly verified/implemented platform may enter CONNECTING.
    // Generic/unknown devices must remain disconnected until a real adapter exists.
    const adapter = AdapterRegistry.getAdapterForDevice(device);
    if (!device.platform || device.platform === "generic") {
      this.setState("DISCONNECTED", { error: "No verified control protocol for this device." });
      return;
    }

    // Connect to device
    this.connect(device);
  }

  async connect(device: TvDevice): Promise<boolean> {
    // Guard direct callers too: a pairing-required device must never be
    // probed/marked CONNECTED before pairing is complete.
    if (device.requiresPairing && !device.isPaired) {
      this.activeDevice = device;
      this.stopHeartbeat();
      this.setState("PAIRING");
      return false;
    }

    // Never start a connection attempt for devices without a verified platform.
    if (!device.platform || device.platform === "generic") {
      this.activeDevice = device;
      this.stopHeartbeat();
      this.setState("DISCONNECTED", { error: "No verified control protocol for this device." });
      return false;
    }

    const session = ++this.sessionVersion;
    this.activeDevice = device;
    this.setState("CONNECTING");

    try {
      const adapter = AdapterRegistry.getAdapterForDevice(device);
      const pingResult = await adapter.ping(device);

      // Check if session changed while waiting for ping
      if (this.sessionVersion !== session || this.activeDevice?.id !== device.id) {
        return false;
      }

      if (pingResult.online) {
        this.consecutiveFailures = 0;
        this.setState("CONNECTED", { latencyMs: pingResult.latencyMs });
        this.startHeartbeat();
        return true;
      } else {
        this.setState("DISCONNECTED", { error: pingResult.error || "TV unreachable" });
        return false;
      }
    } catch (err: any) {
      if (this.sessionVersion === session && this.activeDevice?.id === device.id) {
        this.setState("DISCONNECTED", { error: err.message || "Connection failed" });
      }
      return false;
    }
  }

  disconnect() {
    this.sessionVersion++;
    this.stopHeartbeat();
    this.consecutiveFailures = 0;
    this.activeDevice = null;
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
    const session = this.sessionVersion;
    const currentDev = this.activeDevice;
    this.isChecking = true;

    try {
      const adapter = AdapterRegistry.getAdapterForDevice(currentDev);
      const pingResult = await adapter.ping(currentDev);

      // Guard against device switch during heartbeat check
      if (this.sessionVersion !== session || this.activeDevice?.id !== currentDev.id) {
        return;
      }

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
      if (this.sessionVersion === session && this.activeDevice?.id === currentDev.id) {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= 2) {
          this.setState("RECONNECTING");
        }
      }
    } finally {
      this.isChecking = false;
    }
  }
}

export const globalConnectionManager = ConnectionManager.getInstance();
