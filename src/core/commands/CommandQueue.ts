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
  private queue: QueuedCommand[] = [];
  private isProcessing = false;
  private lastExecutedCommand: { command: RemoteCommandType; timestamp: number } | null = null;
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
      this.queue = this.queue.filter(c => c.deviceId !== deviceId);
    } else {
      this.queue = [];
    }
  }

  async execute<T>(
    device: TvDevice,
    command: RemoteCommandType,
    value: any,
    executor: () => Promise<CommandExecutionResult>
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

    // Check debounce for non-rapid commands
    if (
      this.lastExecutedCommand &&
      this.lastExecutedCommand.command === command &&
      now - this.lastExecutedCommand.timestamp < this.DEBOUNCE_MS &&
      command !== "VOLUME_UP" &&
      command !== "VOLUME_DOWN" &&
      command !== "UP" &&
      command !== "DOWN" &&
      command !== "LEFT" &&
      command !== "RIGHT"
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

    this.queue.push(commandItem);
    this.emit("ENQUEUED", commandItem);

    // Run execution with timeout guard
    commandItem.status = "executing";
    this.emit("STARTED", commandItem);
    const startTime = performance.now();

    try {
      const timeoutPromise = new Promise<CommandExecutionResult>((_, reject) =>
        setTimeout(() => reject(new Error(`Command timeout: TV failed to respond within ${this.TIMEOUT_MS}ms`)), this.TIMEOUT_MS)
      );

      const result = await Promise.race([executor(), timeoutPromise]);
      const latencyMs = Math.round(performance.now() - startTime);

      commandItem.latencyMs = latencyMs;
      commandItem.status = result.success ? "completed" : "failed";
      commandItem.error = result.error;

      this.lastExecutedCommand = { command, timestamp: Date.now() };

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
      this.queue = this.queue.filter(c => c.id !== commandItem.id);
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
