import React, { useState, useRef } from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { checkCommandSupport } from "../core/capabilities";
import {
  Keyboard,
  Send,
  Delete,
  CornerDownLeft,
  Clipboard,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Search,
  Sparkles
} from "lucide-react";

interface KeyboardRemoteProps {
  device: TvDevice | null;
  onSendCommand: (command: RemoteCommandType, value?: any) => void;
  onUnsupportedAttempt: (reason: string) => void;
}

export const KeyboardRemote: React.FC<KeyboardRemoteProps> = ({
  device,
  onSendCommand,
  onUnsupportedAttempt
}) => {
  const [inputText, setInputText] = useState("");
  const [sentHistory, setSentHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const isKeyboardSupported = !!(device && device.capabilities && device.capabilities.keyboard === "SUPPORTED");

  const handleSendText = (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    if (!text.trim()) return;

    const check = checkCommandSupport(device, "TEXT_INPUT");
    if (!check.allowed) {
      onUnsupportedAttempt(check.reason || "Keyboard text input is not supported on this TV.");
      return;
    }

    onSendCommand("TEXT_INPUT", text);
    setSentHistory(prev => [text, ...prev.slice(0, 4)]);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendText();
      onSendCommand("KEYBOARD_ENTER");
    } else if (e.key === "Backspace" && inputText === "") {
      // If input is empty and backspace hit, send backspace command directly to TV!
      onSendCommand("KEYBOARD_BACKSPACE");
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText(prev => prev + text);
          inputRef.current?.focus();
        }
      }
    } catch {}
  };

  const sendDirectKey = (command: RemoteCommandType) => {
    const check = checkCommandSupport(device, command);
    if (!check.allowed) {
      onUnsupportedAttempt(check.reason || "Key not supported");
      return;
    }
    onSendCommand(command);
  };

  return (
    <div id="keyboard-remote-panel" className="flex flex-col items-center max-w-xs mx-auto w-full space-y-5 select-none">
      
      {/* Capability Status Banner */}
      <div className={`w-full p-3 rounded-2xl border text-xs flex items-center justify-between ${
        isKeyboardSupported
          ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
          : "bg-amber-950/30 border-amber-500/30 text-amber-300"
      }`}>
        <div className="flex items-center gap-2 font-medium">
          {isKeyboardSupported ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Keyboard supported ✅</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Keyboard text input is not supported by this TV.</span>
            </>
          )}
        </div>
        <span className="text-[10px] uppercase font-mono opacity-80">
          {device?.platform || "TV"}
        </span>
      </div>

      {/* Input Box Form */}
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Keyboard className="w-4 h-4 text-indigo-400" />
            <span>TV Input Box</span>
          </span>
          <button
            onClick={handlePasteClipboard}
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
            title="Paste from phone clipboard"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Paste</span>
          </button>
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            id="tv-keyboard-input"
            type="text"
            placeholder={isKeyboardSupported ? "Type text to send to TV..." : "Keyboard disabled for this device"}
            disabled={!isKeyboardSupported}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none pr-10"
          />
          {inputText && (
            <button
              onClick={() => setInputText("")}
              className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Send & Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            id="keyboard-btn-backspace"
            onClick={() => sendDirectKey("KEYBOARD_BACKSPACE")}
            disabled={!isKeyboardSupported}
            className="py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-40 text-xs font-medium text-zinc-300 rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <Delete className="w-4 h-4" />
            <span>Backspace</span>
          </button>

          <button
            id="keyboard-btn-enter"
            onClick={() => sendDirectKey("KEYBOARD_ENTER")}
            disabled={!isKeyboardSupported}
            className="py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-40 text-xs font-medium text-zinc-300 rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <CornerDownLeft className="w-4 h-4 text-indigo-400" />
            <span>Enter</span>
          </button>

          <button
            id="keyboard-btn-send"
            onClick={() => handleSendText()}
            disabled={!isKeyboardSupported || !inputText.trim()}
            className="py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 text-xs font-semibold text-white rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick TV Searches */}
      <div className="w-full space-y-2">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
          Quick TV Search Terms
        </span>
        <div className="flex flex-wrap gap-2">
          {["Interstellar", "Taylor Swift", "Action Movies", "Lo-Fi Beats", "BBC News"].map(query => (
            <button
              key={query}
              onClick={() => handleSendText(query)}
              disabled={!isKeyboardSupported}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 active:scale-95 disabled:opacity-30 text-xs text-zinc-300 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Search className="w-3 h-3 text-indigo-400" />
              <span>{query}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sent History */}
      {sentHistory && sentHistory.length > 0 && (
        <div className="w-full space-y-1.5 pt-1">
          <span className="text-[11px] text-zinc-500 px-1">Recently Sent Strings:</span>
          <div className="space-y-1">
            {(sentHistory || []).map((item, idx) => (
              <div key={idx} className="px-3 py-1.5 bg-zinc-950/80 border border-zinc-800/80 rounded-lg text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span className="truncate">{item}</span>
                <span className="text-[10px] text-emerald-400">Delivered</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
