import React, { useState } from "react";
import { TvDevice, RemoteCommandType, CustomRemoteButton, RemoteProfile } from "../core/types";
import { 
  Layout, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Palette, 
  Save, 
  Play, 
  Layers, 
  SlidersHorizontal, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Move,
  Maximize2
} from "lucide-react";

interface ExtendedCustomButton {
  id: string;
  label: string;
  command: RemoteCommandType;
  longPressCommand?: RemoteCommandType;
  doublePressCommand?: RemoteCommandType;
  color: string;
  width: "normal" | "wide" | "full";
  page: number;
}

interface CustomRemoteBuilderModalProps {
  device: TvDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveRemote: (profile: Partial<RemoteProfile>) => void;
}

const DEFAULT_BUILDER_BUTTONS: ExtendedCustomButton[] = [
  { id: "b1", label: "Power", command: "POWER", longPressCommand: "POWER", color: "bg-rose-600", width: "normal", page: 1 },
  { id: "b2", label: "Mute", command: "MUTE", color: "bg-zinc-800", width: "normal", page: 1 },
  { id: "b3", label: "Home", command: "HOME", longPressCommand: "MENU", color: "bg-indigo-600", width: "normal", page: 1 },
  { id: "b4", label: "Vol +", command: "VOLUME_UP", color: "bg-zinc-800", width: "normal", page: 1 },
  { id: "b5", label: "OK / Select", command: "OK", color: "bg-indigo-600", width: "normal", page: 1 },
  { id: "b6", label: "Vol −", command: "VOLUME_DOWN", color: "bg-zinc-800", width: "normal", page: 1 },
  { id: "b7", label: "Input Switch", command: "INPUT", color: "bg-zinc-800", width: "wide", page: 1 },
  { id: "b8", label: "Play / Pause", command: "PLAY_PAUSE", color: "bg-emerald-600", width: "normal", page: 1 }
];

export const CustomRemoteBuilderModal: React.FC<CustomRemoteBuilderModalProps> = ({
  device,
  isOpen,
  onClose,
  onSaveRemote
}) => {
  const [remoteName, setRemoteName] = useState("My Living Room Deck");
  const [activePage, setActivePage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(2);
  const [buttons, setButtons] = useState<ExtendedCustomButton[]>(DEFAULT_BUILDER_BUTTONS);

  // Form State for new/edited button
  const [newLabel, setNewLabel] = useState("Back");
  const [newCommand, setNewCommand] = useState<RemoteCommandType>("BACK");
  const [newLongPress, setNewLongPress] = useState<RemoteCommandType | "NONE">("NONE");
  const [newDoublePress, setNewDoublePress] = useState<RemoteCommandType | "NONE">("NONE");
  const [newColor, setNewColor] = useState("bg-zinc-800");
  const [newWidth, setNewWidth] = useState<"normal" | "wide" | "full">("normal");

  if (!isOpen) return null;

  const currentPageButtons = buttons.filter(b => (b.page || 1) === activePage);

  const handleAddButton = () => {
    if (!newLabel.trim()) return;
    const newBtn: ExtendedCustomButton = {
      id: "btn_" + Date.now(),
      label: newLabel.trim(),
      command: newCommand,
      longPressCommand: newLongPress === "NONE" ? undefined : newLongPress,
      doublePressCommand: newDoublePress === "NONE" ? undefined : newDoublePress,
      color: newColor,
      width: newWidth,
      page: activePage
    };
    setButtons(prev => [...prev, newBtn]);
  };

  const handleRemove = (id: string) => {
    setButtons(prev => prev.filter(b => b.id !== id));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const pageBtns = [...currentPageButtons];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pageBtns.length) return;

    const temp = pageBtns[index];
    pageBtns[index] = pageBtns[targetIdx];
    pageBtns[targetIdx] = temp;

    // Merge back
    const otherBtns = buttons.filter(b => (b.page || 1) !== activePage);
    setButtons([...otherBtns, ...pageBtns]);
  };

  const handleApplyPreset = (presetType: "MINIMAL" | "MEDIA" | "NUMPAD" | "GAMING") => {
    if (presetType === "MINIMAL") {
      setButtons([
        { id: "p1", label: "Power", command: "POWER", color: "bg-rose-600", width: "normal", page: 1 },
        { id: "p2", label: "Home", command: "HOME", color: "bg-indigo-600", width: "normal", page: 1 },
        { id: "p3", label: "Mute", command: "MUTE", color: "bg-zinc-800", width: "normal", page: 1 },
        { id: "p4", label: "Vol +", command: "VOLUME_UP", color: "bg-zinc-800", width: "normal", page: 1 },
        { id: "p5", label: "OK", command: "OK", color: "bg-indigo-600", width: "normal", page: 1 },
        { id: "p6", label: "Vol −", command: "VOLUME_DOWN", color: "bg-zinc-800", width: "normal", page: 1 }
      ]);
    } else if (presetType === "MEDIA") {
      setButtons([
        { id: "m1", label: "Rewind", command: "REWIND", color: "bg-zinc-800", width: "normal", page: 1 },
        { id: "m2", label: "Play/Pause", command: "PLAY_PAUSE", color: "bg-emerald-600", width: "normal", page: 1 },
        { id: "m3", label: "Fast Fwd", command: "FAST_FORWARD", color: "bg-zinc-800", width: "normal", page: 1 },
        { id: "m4", label: "Previous", command: "PREVIOUS", color: "bg-zinc-800", width: "normal", page: 1 },
        { id: "m5", label: "Stop", command: "STOP", color: "bg-rose-600", width: "normal", page: 1 },
        { id: "m6", label: "Next", command: "NEXT", color: "bg-zinc-800", width: "normal", page: 1 }
      ]);
    } else if (presetType === "NUMPAD") {
      const numBtns: ExtendedCustomButton[] = [1,2,3,4,5,6,7,8,9,0].map(n => ({
        id: `num_${n}`,
        label: `${n}`,
        command: `NUMBER_${n}` as RemoteCommandType,
        color: "bg-zinc-800",
        width: "normal",
        page: 1
      }));
      setButtons(numBtns);
    }
  };

  const handleSave = () => {
    if (!remoteName.trim()) return;
    const customBtns: CustomRemoteButton[] = buttons.map(b => ({
      id: b.id,
      label: b.label,
      iconName: "Radio",
      action: b.command,
      color: b.color,
      width: b.width,
      page: b.page
    }));

    onSaveRemote({
      id: `custom_${Date.now()}`,
      name: remoteName.trim(),
      description: `Custom ${buttons.length}-button layout deck (${totalPages} pages)`,
      iconName: "SlidersHorizontal",
      defaultMode: "custom",
      customButtons: customBtns
    });
    onClose();
  };

  return (
    <div id="custom-builder-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div id="custom-builder-card" className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Custom Remote Layout Builder</h3>
              <p className="text-xs text-zinc-400">Design multi-page personalized button decks with press modifiers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Builder Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          
          {/* Preset Buttons & Name */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-semibold text-zinc-300">Remote Profile Name</label>
              <input
                type="text"
                value={remoteName}
                onChange={e => setRemoteName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Presets */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Templates:</label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleApplyPreset("MINIMAL")}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-300 rounded-lg"
                >
                  Minimal
                </button>
                <button
                  onClick={() => handleApplyPreset("MEDIA")}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-300 rounded-lg"
                >
                  Media
                </button>
                <button
                  onClick={() => handleApplyPreset("NUMPAD")}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-300 rounded-lg"
                >
                  Numpad
                </button>
              </div>
            </div>
          </div>

          {/* Page Navigator */}
          <div className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400 ml-2" />
              <span className="text-xs font-semibold text-zinc-300">Deck Pages:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePage(idx + 1)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activePage === idx + 1
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    Page {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setTotalPages(prev => Math.min(prev + 1, 5))}
              className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Page</span>
            </button>
          </div>

          {/* Interactive Live Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Page {activePage} Button Deck:</span>
              <span>{currentPageButtons.length} buttons on this page</span>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl min-h-[160px] grid grid-cols-3 gap-2.5">
              {currentPageButtons.length === 0 ? (
                <div className="col-span-3 py-8 text-center text-xs text-zinc-500">
                  Page is empty. Use the form below to add custom buttons.
                </div>
              ) : (
                currentPageButtons.map((btn, idx) => (
                  <div
                    key={btn.id}
                    className={`p-3 rounded-2xl border border-white/10 text-white flex flex-col items-center justify-center relative group shadow ${btn.color} ${
                      btn.width === "wide" ? "col-span-2" : btn.width === "full" ? "col-span-3" : "col-span-1"
                    }`}
                  >
                    <span className="text-xs font-bold truncate">{btn.label}</span>
                    <span className="text-[9px] opacity-75 font-mono">{btn.command}</span>
                    {btn.longPressCommand && (
                      <span className="text-[8px] opacity-60">Hold: {btn.longPressCommand}</span>
                    )}

                    {/* Button actions on hover */}
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMove(idx, "up")}
                        className="w-5 h-5 bg-zinc-900/80 rounded text-white flex items-center justify-center text-[10px]"
                        title="Move up"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, "down")}
                        className="w-5 h-5 bg-zinc-900/80 rounded text-white flex items-center justify-center text-[10px]"
                        title="Move down"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemove(btn.id)}
                        className="w-5 h-5 bg-rose-600 rounded text-white flex items-center justify-center text-[10px]"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Button Form with Modifiers */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
            <span className="text-xs font-semibold text-zinc-200">Add Key to Page {activePage}</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-zinc-500 font-semibold uppercase">Label</label>
                <input
                  type="text"
                  placeholder="Button Label"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-semibold uppercase">Short Press Action</label>
                <select
                  value={newCommand}
                  onChange={e => setNewCommand(e.target.value as RemoteCommandType)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
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
                  <option value="INPUT">Input Switch</option>
                  <option value="INFO">Info</option>
                  <option value="GUIDE">Guide</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-semibold uppercase">Long Press (Hold) Action</label>
                <select
                  value={newLongPress}
                  onChange={e => setNewLongPress(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                >
                  <option value="NONE">None</option>
                  <option value="POWER">Power Off TV</option>
                  <option value="MENU">Quick Settings Menu</option>
                  <option value="INPUT">Source Input</option>
                  <option value="MUTE">Toggle Mute</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-semibold uppercase">Width</label>
                <select
                  value={newWidth}
                  onChange={e => setNewWidth(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                >
                  <option value="normal">Normal (1 Col)</option>
                  <option value="wide">Wide (2 Col)</option>
                  <option value="full">Full Width (3 Col)</option>
                </select>
              </div>
            </div>

            {/* Color selection */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <span className="text-[11px] text-zinc-400">Color:</span>
              {[
                { class: "bg-zinc-800", name: "Slate" },
                { class: "bg-indigo-600", name: "Indigo" },
                { class: "bg-rose-600", name: "Rose" },
                { class: "bg-emerald-600", name: "Emerald" },
                { class: "bg-amber-600", name: "Amber" },
                { class: "bg-purple-600", name: "Purple" }
              ].map(c => (
                <button
                  key={c.class}
                  onClick={() => setNewColor(c.class)}
                  className={`w-6 h-6 rounded-full ${c.class} border-2 ${
                    newColor === c.class ? "border-white scale-110" : "border-transparent"
                  }`}
                />
              ))}
              <button
                onClick={handleAddButton}
                className="ml-auto px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Button</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Custom Deck ({buttons.length} Buttons)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
