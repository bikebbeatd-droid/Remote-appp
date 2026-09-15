import { CommandExecutionResult, RemoteCommandType, TvDevice } from "../types";

export interface QueuedCommand {
  id: string;
  deviceId: string;
  command: RemoteCommandType;
  value?: any;
  timestamp: number;
  status: "queued" | "executing" | "completed" | "failed" | "cancelled";
  latencyMs?: number;
  error?: string;
}

export type QueueEventListener = (event: {
  type: "ENQUEUED" | "STARTED" | "COMPLETED" | "FAILED" | "DROPPED";
  item: QueuedCommand;
}) => void;

export class CommandQueue {
  private deviceQueues: Map<string, QueuedCommand[]> = new Map();
  private lastExecutedByDevice: Map<string, { command: RemoteCommandType; timestamp: number }> = new Map();
  private listeners: Set<QueueEventListener> = new Set();
  private maxHistory = 100;
  private history: QueuedCommand[] = [];

  // Minimum spacing between rapid accidental clicks of the same command (except volume / navigation hold)
  private readonly DEBOUNCE_MS = 60;
  // Maximum duration for a single command before timing out
  private readonly TIMEOUT_MS = 3500;

  subscribe(listener: QueueEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(type: "ENQUEUED" | "STARTED" | "COMPLETED" | "FAILED" | "DROPPED", item: QueuedCommand) {
    for (const listener of this.listeners) {
      try {
        listener({ type, item });
      } catch {}
    }
  }

  getHistory(): QueuedCommand[] {
    return [...this.history];
  }

  clearQueue(deviceId?: string) {
    if (deviceId) {
      this.deviceQueues.delete(deviceId);
    } else {
      this.deviceQueues.clear();
    }
  }

  async execute<T>(
    device: TvDevice,
    command: RemoteCommandType,
    value: any,
    executor: (signal?: AbortSignal) => Promise<CommandExecutionResult>
  ): Promise<CommandExecutionResult> {
    const now = Date.now();

    const generateId = () => {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return "cmd_" + crypto.randomUUID().replace(/-/g, "").substring(0, 12);
      }
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const arr = new Uint32Array(2);
        crypto.getRandomValues(arr);
        return "cmd_" + arr[0].toString(36) + arr[1].toString(36);
      }
      return "cmd_" + Date.now().toString(36) + "_" + (performance.now() * 1000).toFixed(0);
    };

    // Check device-scoped debounce for non-rapid commands
    const lastExecuted = this.lastExecutedByDevice.get(device.id);
    const isRapidCommand =
      command === "VOLUME_UP" ||
      command === "VOLUME_DOWN" ||
      command === "UP" ||
      command === "DOWN" ||
      command === "LEFT" ||
      command === "RIGHT" ||
      command === "CHANNEL_UP" ||
      command === "CHANNEL_DOWN";

    if (
      lastExecuted &&
      lastExecuted.command === command &&
      now - lastExecuted.timestamp < this.DEBOUNCE_MS &&
      !isRapidCommand
    ) {
      const droppedItem: QueuedCommand = {
        id: generateId(),
        deviceId: device.id,
        command,
        value,
        timestamp: now,
        status: "cancelled",
        error: "Debounced: command was triggered too rapidly."
      };
      this.emit("DROPPED", droppedItem);
      return {
        success: false,
        command,
        value,
        timestamp: now,
        error: "Debounced duplicate tap."
      };
    }

    const commandItem: QueuedCommand = {
      id: generateId() + "_" + now.toString(36),
      deviceId: device.id,
      command,
      value,
      timestamp: now,
      status: "queued"
    };

    const queueForDev = this.deviceQueues.get(device.id) || [];
    queueForDev.push(commandItem);
    this.deviceQueues.set(device.id, queueForDev);
    this.emit("ENQUEUED", commandItem);

    // Run execution with abort controller and timeout guard
    commandItem.status = "executing";
    this.emit("STARTED", commandItem);
    const startTime = performance.now();
    const abortController = new AbortController();

    try {
      const timeoutPromise = new Promise<CommandExecutionResult>((_, reject) => {
        const timer = setTimeout(() => {
          abortController.abort();
          reject(new Error(`Command timeout: TV failed to respond within ${this.TIMEOUT_MS}ms`));
        }, this.TIMEOUT_MS);
        if (typeof timer.unref === "function") timer.unref();
      });

      const result = await Promise.race([executor(abortController.signal), timeoutPromise]);
      const latencyMs = Math.round(performance.now() - startTime);

      commandItem.latencyMs = latencyMs;
      commandItem.status = result.success ? "completed" : "failed";
      commandItem.error = result.error;

      this.lastExecutedByDevice.set(device.id, { command, timestamp: Date.now() });

      this.recordHistory(commandItem);
      this.emit(result.success ? "COMPLETED" : "FAILED", commandItem);

      return {
        ...result,
        latencyMs
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      commandItem.latencyMs = latencyMs;
      commandItem.status = "failed";
      commandItem.error = err.message || "Network execution error";

      this.recordHistory(commandItem);
      this.emit("FAILED", commandItem);

      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        error: err.message || "Command transmission failed"
      };
    } finally {
      const currentQueue = this.deviceQueues.get(device.id);
      if (currentQueue) {
        const filtered = currentQueue.filter(c => c.id !== commandItem.id);
        if (filtered.length > 0) {
          this.deviceQueues.set(device.id, filtered);
        } else {
          this.deviceQueues.delete(device.id);
        }
      }
    }
  }

  private recordHistory(item: QueuedCommand) {
    this.history.unshift(item);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }
}

export const globalCommandQueue = new CommandQueue();
