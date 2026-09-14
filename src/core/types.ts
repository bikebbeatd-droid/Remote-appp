/**
 * Core type definitions for Universal Smart TV Remote
 */

export type CapabilityStatus =
  | "SUPPORTED"
  | "UNSUPPORTED"
  | "UNKNOWN"
  | "REQUIRES_PAIRING"
  | "REQUIRES_HARDWARE";

export type ConnectionState =
  | "DISCONNECTED"
  | "CONNECTING"
  | "PAIRING"
  | "CONNECTED"
  | "RECONNECTING"
  | "ERROR";

export interface DeviceCapabilities {
  power: CapabilityStatus;
  navigation: CapabilityStatus;
  volume: CapabilityStatus;
  media: CapabilityStatus;
  keyboard: CapabilityStatus;
  touchpad: CapabilityStatus;
  apps: CapabilityStatus;
  input: CapabilityStatus;
  voice: CapabilityStatus;
  channels: CapabilityStatus;
  ir: CapabilityStatus;
  bluetooth: CapabilityStatus;
  wifi: CapabilityStatus;
}

export type TvPlatform =
  | "android_tv"
  | "google_tv"
  | "roku"
  | "tizen"
  | "webos"
  | "sony_bravia"
  | "philips"
  | "fire_tv"
  | "panasonic_viera"
  | "vizio_smartcast"
  | "apple_tv"
  | "hisense_vidaa"
  | "ir_universal"
  | "generic";

export interface TvDevice {
  id: string;
  name: string;
  model: string;
  brand?: string;
  series?: string;
  platform: TvPlatform;
  ip: string;
  port: number;
  mac?: string;
  protocol: string;
  requiresPairing: boolean;
  isPaired: boolean;
  isOnline: boolean;
  token?: string;
  isFavorite?: boolean;
  icon?: string;
  capabilities: DeviceCapabilities;
  lastSeen?: number;
}

export type RemoteCommandType =
  | "POWER"
  | "HOME"
  | "BACK"
  | "MENU"
  | "UP"
  | "DOWN"
  | "LEFT"
  | "RIGHT"
  | "OK"
  | "VOLUME_UP"
  | "VOLUME_DOWN"
  | "MUTE"
  | "SET_VOLUME"
  | "CHANNEL_UP"
  | "CHANNEL_DOWN"
  | "SET_CHANNEL"
  | "PREV_CHANNEL"
  | "PLAY"
  | "PAUSE"
  | "PLAY_PAUSE"
  | "STOP"
  | "PREVIOUS"
  | "NEXT"
  | "REWIND"
  | "FAST_FORWARD"
  | "INPUT"
  | "SET_INPUT"
  | "INFO"
  | "GUIDE"
  | "EXIT"
  | "TEXT_INPUT"
  | "KEYBOARD_ENTER"
  | "KEYBOARD_BACKSPACE"
  | "LAUNCH_APP"
  | "NUMBER_0"
  | "NUMBER_1"
  | "NUMBER_2"
  | "NUMBER_3"
  | "NUMBER_4"
  | "NUMBER_5"
  | "NUMBER_6"
  | "NUMBER_7"
  | "NUMBER_8"
  | "NUMBER_9"
  | "DASH"
  | "COLOR_RED"
  | "COLOR_GREEN"
  | "COLOR_YELLOW"
  | "COLOR_BLUE"
  | "VOICE_QUERY"
  | "TOUCHPAD_MOVE"
  | "TOUCHPAD_CLICK";

export interface CommandExecutionResult {
  success: boolean;
  command: string;
  value?: any;
  timestamp: number;
  latencyMs?: number;
  error?: string;
  protocol?: string;
  rawPayload?: any;
}

export type RemoteMode =
  | "classic"
  | "touchpad"
  | "dpad"
  | "media"
  | "keyboard"
  | "numpad"
  | "apps"
  | "custom"
  | "gaming"
  | "accessibility";

export interface ButtonMapping {
  keyId: string;
  label: string;
  iconName: string;
  shortPressAction: RemoteCommandType;
  shortPressValue?: any;
  longPressAction?: RemoteCommandType;
  longPressValue?: any;
  doublePressAction?: RemoteCommandType;
  doublePressValue?: any;
  supportedCapability?: keyof DeviceCapabilities;
}

export interface CustomRemoteButton {
  id: string;
  label: string;
  iconName: string;
  action: RemoteCommandType;
  value?: any;
  color?: string;
  width?: "normal" | "wide" | "full";
  page: number;
  category?: string;
}

export interface RemoteProfile {
  id: string;
  name: string;
  description: string;
  iconName: string;
  targetPlatform?: TvPlatform;
  defaultMode: RemoteMode;
  buttonMappings: Record<string, ButtonMapping>;
  customButtons?: CustomRemoteButton[];
}

export interface AutomationScene {
  id: string;
  name: string;
  description: string;
  iconName: string;
  targetDeviceId?: string;
  actions: Array<{
    command: RemoteCommandType;
    value?: any;
    label: string;
    delayMs?: number;
  }>;
}

export interface DiagnosticLog {
  id: string;
  timestamp: number;
  type: "command" | "network" | "security" | "error" | "discovery";
  title: string;
  details: string;
  latencyMs?: number;
  success?: boolean;
}
