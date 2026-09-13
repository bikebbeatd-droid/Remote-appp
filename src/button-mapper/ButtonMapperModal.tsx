import React, { useState } from "react";
import { TvDevice, RemoteCommandType, ButtonMapping } from "../core/types";
import { COMMAND_CAPABILITY_MAP } from "../core/capabilities";
import { Sliders, Save, Play, CheckCircle2, X, Plus, Trash2 } from "lucide-react";

interface ButtonMapperModalProps {
  device: TvDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveMapping: (mapping: ButtonMapping) => void;
}

const AVAILABLE_ACTIONS: Array<{ command: RemoteCommandType; label: string }> = [
  { command: "POWER", label: "Power Toggle" },
  { command: "HOME", label: "Home Screen" },
  { command: "BACK", label: "Back / Return" },
  { command: "MENU", label: "Menu" },
  { command: "OK", label: "OK / Select" },
  { command: "VOLUME_UP", label: "Volume Up" },
  { command: "VOLUME_DOWN", label: "Volume Down" },
  { command: "MUTE", label: "Mute Audio" },
  { command: "CHANNEL_UP", label: "Channel Up" },
  { command: "CHANNEL_DOWN", label: "Channel Down" },
  { command: "PLAY_PAUSE", label: "Play / Pause" },
  { command: "REWIND", label: "Rewind 10s" },
  { command: "FAST_FORWARD", label: "Fast Forward 10s" },
  { command: "NEXT", label: "Next Chapter" },
  { command: "PREVIOUS", label: "Previous Chapter" },
  { command: "INPUT", label: "Source / HDMI" },
  { command: "LAUNCH_APP", label: "Launch YouTube" }
];

export const ButtonMapperModal: React.FC<ButtonMapperModalProps> = ({
  device,
  isOpen,
  onClose,
  onSaveMapping
}) => {
  const [keyId, setKeyId] = useState("custom_btn_1");
  const [label, setLabel] = useState("Quick YouTube");
  const [shortPress, setShortPress] = useState<RemoteCommandType>("LAUNCH_APP");
  const [longPress, setLongPress] = useState<RemoteCommandType>("MUTE");
  const [doublePress, setDoublePress] = useState<RemoteCommandType>("HOME");
  const [testStatus, setTestStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter actions based on connected device capabilities
  const getSupportedActions = () => {
    if (!device || !device.capabilities) return AVAILABLE_ACTIONS;
    return AVAILABLE_ACTIONS.filter(item => {
      const cap = COMMAND_CAPABILITY_MAP[item.command];
      if (!cap) return true;
      return device.capabilities?.[cap] === "SUPPORTED";
    });
  };

  const supportedList = getSupportedActions() || [];

  const handleSave = () => {
    if (!label.trim()) return;
    const mapping: ButtonMapping = {
      keyId,
      label: label.trim(),
      iconName: "Sliders",
      shortPressAction: shortPress,
      shortPressValue: shortPress === "LAUNCH_APP" ? "com.google.android.youtube.tv" : undefined,
      longPressAction: longPress,
      doublePressAction: doublePress
    };
    onSaveMapping(mapping);
    onClose();
  };

  return (
    <div id="button-mapper-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="button-mapper-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">Hardware & Button Mapper</h3>
              <p className="text-xs text-zinc-400">Assign Short, Long & Double Press Actions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Button Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Short Press Action <span className="text-emerald-400 text-[10px]">(Primary)</span>
            </label>
            <select
              value={shortPress}
              onChange={e => setShortPress(e.target.value as RemoteCommandType)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              {supportedList.map(a => (
                <option key={a.command} value={a.command}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Long Press Action <span className="text-amber-400 text-[10px]">(Hold 600ms)</span>
            </label>
            <select
              value={longPress}
              onChange={e => setLongPress(e.target.value as RemoteCommandType)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              {supportedList.map(a => (
                <option key={a.command} value={a.command}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Double Press Action <span className="text-sky-400 text-[10px]">(Rapid Tap)</span>
            </label>
            <select
              value={doublePress}
              onChange={e => setDoublePress(e.target.value as RemoteCommandType)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              {supportedList.map(a => (
                <option key={a.command} value={a.command}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-400">
            Filtered to {supportedList.length} verified operations supported by {device?.name || "current TV"}.
          </div>

          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Button Mapping</span>
          </button>
        </div>

      </div>
    </div>
  );
};
