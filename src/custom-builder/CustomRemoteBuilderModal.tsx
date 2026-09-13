import React, { useState } from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { Layout, Plus, Trash2, Check, X, Palette, Save, Play } from "lucide-react";

interface CustomButtonDef {
  id: string;
  label: string;
  command: RemoteCommandType;
  color: string;
  size: "sm" | "md" | "lg";
}

interface CustomRemoteBuilderModalProps {
  device: TvDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveRemote: (name: string, buttons: CustomButtonDef[]) => void;
}

const DEFAULT_BUTTONS: CustomButtonDef[] = [
  { id: "b1", label: "Power", command: "POWER", color: "bg-rose-600", size: "md" },
  { id: "b2", label: "Mute", command: "MUTE", color: "bg-zinc-800", size: "md" },
  { id: "b3", label: "Home", command: "HOME", color: "bg-indigo-600", size: "md" },
  { id: "b4", label: "Vol +", command: "VOLUME_UP", color: "bg-zinc-800", size: "md" },
  { id: "b5", label: "Select", command: "OK", color: "bg-indigo-600", size: "lg" },
  { id: "b6", label: "Vol −", command: "VOLUME_DOWN", color: "bg-zinc-800", size: "md" }
];

export const CustomRemoteBuilderModal: React.FC<CustomRemoteBuilderModalProps> = ({
  device,
  isOpen,
  onClose,
  onSaveRemote
}) => {
  const [remoteName, setRemoteName] = useState("Bedtime Minimal Remote");
  const [buttons, setButtons] = useState<CustomButtonDef[]>(DEFAULT_BUTTONS);
  const [newLabel, setNewLabel] = useState("Back");
  const [newCommand, setNewCommand] = useState<RemoteCommandType>("BACK");
  const [newColor, setNewColor] = useState("bg-zinc-800");

  if (!isOpen) return null;

  const handleAddButton = () => {
    if (!newLabel.trim()) return;
    const newBtn: CustomButtonDef = {
      id: "btn_" + Date.now(),
      label: newLabel.trim(),
      command: newCommand,
      color: newColor,
      size: "md"
    };
    setButtons(prev => [...prev, newBtn]);
  };

  const handleRemove = (id: string) => {
    setButtons(prev => prev.filter(b => b.id !== id));
  };

  const handleSave = () => {
    if (!remoteName.trim()) return;
    onSaveRemote(remoteName.trim(), buttons);
    onClose();
  };

  return (
    <div id="custom-builder-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="custom-builder-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">Custom Remote Builder</h3>
              <p className="text-xs text-zinc-400">Design your own ergonomic button deck</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Builder Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Remote Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Layout Preset Name</label>
            <input
              type="text"
              value={remoteName}
              onChange={e => setRemoteName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          {/* Interactive Live Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Preview Deck Canvas:</span>
              <span>{buttons.length} buttons</span>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl min-h-[160px] grid grid-cols-3 gap-2.5">
              {buttons.map(btn => (
                <div
                  key={btn.id}
                  className={`p-3 rounded-xl border border-white/10 text-white flex flex-col items-center justify-center relative group ${btn.color}`}
                >
                  <span className="text-xs font-bold truncate">{btn.label}</span>
                  <span className="text-[9px] opacity-70 font-mono">{btn.command}</span>
                  <button
                    onClick={() => handleRemove(btn.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 rounded-full text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Button Form */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
            <span className="text-xs font-semibold text-zinc-300">Add New Key to Deck</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Button Label"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              />
              <select
                value={newCommand}
                onChange={e => setNewCommand(e.target.value as RemoteCommandType)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
              >
                <option value="POWER">Power</option>
                <option value="HOME">Home</option>
                <option value="BACK">Back</option>
                <option value="OK">OK / Select</option>
                <option value="MENU">Menu</option>
                <option value="VOLUME_UP">Volume Up</option>
                <option value="VOLUME_DOWN">Volume Down</option>
                <option value="MUTE">Mute</option>
                <option value="CHANNEL_UP">Channel Up</option>
                <option value="CHANNEL_DOWN">Channel Down</option>
                <option value="PLAY_PAUSE">Play/Pause</option>
                <option value="INPUT">Input</option>
              </select>
            </div>

            {/* Color selection */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400">Color:</span>
              {[
                { class: "bg-zinc-800", name: "Slate" },
                { class: "bg-indigo-600", name: "Indigo" },
                { class: "bg-rose-600", name: "Rose" },
                { class: "bg-emerald-600", name: "Emerald" },
                { class: "bg-amber-600", name: "Amber" }
              ].map(c => (
                <button
                  key={c.class}
                  onClick={() => setNewColor(c.class)}
                  className={`w-6 h-6 rounded-full ${c.class} border-2 ${
                    newColor === c.class ? "border-white" : "border-transparent"
                  }`}
                />
              ))}
              <button
                onClick={handleAddButton}
                className="ml-auto px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Custom Deck</span>
          </button>
        </div>

      </div>
    </div>
  );
};
