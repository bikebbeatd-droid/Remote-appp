import { DeviceCapabilities, CapabilityStatus, RemoteCommandType, TvDevice } from "./types";

export const CAPABILITY_LABELS: Record<keyof DeviceCapabilities, string> = {
  power: "Power Control",
  navigation: "Navigation & D-Pad",
  volume: "Volume & Mute",
  media: "Media Playback Controls",
  keyboard: "Text & Mobile Keyboard",
  touchpad: "Pointer / Touchpad",
  apps: "Direct App Launcher",
  input: "HDMI / Input Switching",
  voice: "Voice & Speech Search",
  channels: "TV Tuner / Channels",
  ir: "Infrared Hardware (IR)",
  bluetooth: "Bluetooth Low Energy",
  wifi: "Local Wi-Fi Network"
};

export const COMMAND_CAPABILITY_MAP: Record<RemoteCommandType, keyof DeviceCapabilities | null> = {
  POWER: "power",
  HOME: "navigation",
  BACK: "navigation",
  MENU: "navigation",
  UP: "navigation",
  DOWN: "navigation",
  LEFT: "navigation",
  RIGHT: "navigation",
  OK: "navigation",
  VOLUME_UP: "volume",
  VOLUME_DOWN: "volume",
  MUTE: "volume",
  SET_VOLUME: "volume",
  CHANNEL_UP: "channels",
  CHANNEL_DOWN: "channels",
  SET_CHANNEL: "channels",
  PREV_CHANNEL: "channels",
  PLAY: "media",
  PAUSE: "media",
  PLAY_PAUSE: "media",
  STOP: "media",
  PREVIOUS: "media",
  NEXT: "media",
  REWIND: "media",
  FAST_FORWARD: "media",
  INPUT: "input",
  SET_INPUT: "input",
  INFO: "navigation",
  GUIDE: "channels",
  EXIT: "navigation",
  TEXT_INPUT: "keyboard",
  KEYBOARD_ENTER: "keyboard",
  KEYBOARD_BACKSPACE: "keyboard",
  LAUNCH_APP: "apps",
  NUMBER_0: "channels",
  NUMBER_1: "channels",
  NUMBER_2: "channels",
  NUMBER_3: "channels",
  NUMBER_4: "channels",
  NUMBER_5: "channels",
  NUMBER_6: "channels",
  NUMBER_7: "channels",
  NUMBER_8: "channels",
  NUMBER_9: "channels",
  DASH: "channels",
  COLOR_RED: "navigation",
  COLOR_GREEN: "navigation",
  COLOR_YELLOW: "navigation",
  COLOR_BLUE: "navigation",
  VOICE_QUERY: "voice",
  TOUCHPAD_MOVE: "touchpad",
  TOUCHPAD_CLICK: "touchpad"
};

export function checkCommandSupport(device: TvDevice | null, command: RemoteCommandType): {
  allowed: boolean;
  status: CapabilityStatus;
  reason?: string;
} {
  if (!device) {
    return {
      allowed: false,
      status: "UNSUPPORTED",
      reason: "No TV is currently connected. Please connect to a device first."
    };
  }

  if (device.requiresPairing && !device.isPaired) {
    return {
      allowed: false,
      status: "REQUIRES_PAIRING",
      reason: `Pairing required: Please pair with ${device.name} before sending commands.`
    };
  }

  const capabilityKey = COMMAND_CAPABILITY_MAP[command];
  if (!capabilityKey) {
    return { allowed: true, status: "SUPPORTED" };
  }

  const status = device.capabilities[capabilityKey];

  if (status === "SUPPORTED") {
    return { allowed: true, status: "SUPPORTED" };
  }

  if (status === "UNSUPPORTED") {
    return {
      allowed: false,
      status: "UNSUPPORTED",
      reason: `${CAPABILITY_LABELS[capabilityKey]} is not supported by the ${device.platform.replace(/_/g, " ").toUpperCase()} protocol on this device.`
    };
  }

  if (status === "REQUIRES_HARDWARE") {
    return {
      allowed: false,
      status: "REQUIRES_HARDWARE",
      reason: `Hardware requirement: Your phone or TV lacks the dedicated hardware (e.g., IR emitter) for ${CAPABILITY_LABELS[capabilityKey]}.`
    };
  }

  if (status === "REQUIRES_PAIRING") {
    return {
      allowed: false,
      status: "REQUIRES_PAIRING",
      reason: `This feature requires security pairing with ${device.name}.`
    };
  }

  return {
    allowed: true,
    status: "UNKNOWN",
    reason: `Capability status for ${CAPABILITY_LABELS[capabilityKey]} is unverified for this device.`
  };
}

export function getCapabilityBadgeColor(status: CapabilityStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case "SUPPORTED":
      return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" };
    case "UNSUPPORTED":
      return { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" };
    case "REQUIRES_PAIRING":
      return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" };
    case "REQUIRES_HARDWARE":
      return { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" };
    case "UNKNOWN":
    default:
      return { bg: "bg-zinc-500/15", text: "text-zinc-400", border: "border-zinc-500/30" };
  }
}
