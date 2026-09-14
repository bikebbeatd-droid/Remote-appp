import React, { useState, useEffect } from "react";
import { 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Power, 
  Volume2, 
  VolumeX, 
  Tv, 
  Layers, 
  Cpu, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Disc,
  HelpCircle
} from "lucide-react";
import { IrHardwareManager, IrHardwareStatus } from "./IrHardwareManager";
import { GLOBAL_IR_DATABASE, IrDatabaseService } from "../database/irDatabase";
import { IRCodeSet } from "../database/types";
import { RemoteCommandType } from "../core/types";

interface IrBlasterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IrBlasterModal: React.FC<IrBlasterModalProps> = ({ isOpen, onClose }) => {
  const [hwStatus, setHwStatus] = useState<IrHardwareStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCodeSet, setSelectedCodeSet] = useState<IRCodeSet>(GLOBAL_IR_DATABASE[0]);
  const [lastSentCommand, setLastSentCommand] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [learningState, setLearningState] = useState<"IDLE" | "LISTENING" | "CAPTURED" | "ERROR">("IDLE");

  useEffect(() => {
    if (isOpen) {
      checkHw();
    }
  }, [isOpen]);

  const checkHw = async () => {
    setLoading(true);
    const status = await IrHardwareManager.checkHardware();
    setHwStatus(status);
    setLoading(false);
  };

  const handleSendCommand = async (cmd: RemoteCommandType) => {
    setLastSentCommand(cmd);
    const code = selectedCodeSet.codes[cmd];

    if (!code) {
      setStatusMessage(`Command ${cmd} not present in ${selectedCodeSet.name}`);
      return;
    }

    setStatusMessage(`Transmitting ${cmd} (${code.frequencyKhz}kHz ${code.protocolType})...`);
    const res = await IrHardwareManager.transmitPulse(code.frequencyKhz, [9000, 4500, 560, 1690]);
    if (res.success) {
      setStatusMessage(`✓ Transmitted ${cmd} over physical IR diode`);
    } else {
      setStatusMessage(`✕ ${res.error}`);
    }
  };

  const handleLearnSignal = async () => {
    setLearningState("LISTENING");
    setStatusMessage("Listening for physical remote IR pulse (point remote at phone top)...");
    const res = await IrHardwareManager.captureSignal(8000);
    if (res.success) {
      setLearningState("CAPTURED");
      setStatusMessage(`✓ Signal captured: ${res.code}`);
    } else {
      setLearningState("ERROR");
      setStatusMessage(`✕ ${res.error}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Consumer IR Blaster & Learning</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-950 border border-orange-700 text-orange-300">
                  Optical Infrared
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Direct optical pulse transmission for legacy televisions and cable boxes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hardware Status Alert Banner */}
        <div className="p-4 bg-zinc-950/50 border-b border-zinc-800/80">
          {loading ? (
            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <Disc className="w-4 h-4 animate-spin text-orange-400" />
              <span>Probing phone hardware for ConsumerIrManager...</span>
            </div>
          ) : hwStatus?.hasEmitter ? (
            <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-bold">Physical IR Blaster Ready</p>
                <p className="text-[11px] text-emerald-400/80">{hwStatus.statusMessage}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">IR Hardware Not Available on This Phone</p>
                <p className="text-[11px] text-amber-400/80 leading-relaxed">
                  Optical IR control requires an Android device equipped with a built-in infrared transmitter or a connected USB IR transceiver bridge. To control modern Smart TVs, use local Wi-Fi / LAN mode.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* IR Database & Code Set Selector */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[450px]">
          
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <label className="text-xs font-semibold text-zinc-400">Target IR Code Set:</label>
            <select
              value={selectedCodeSet.id}
              onChange={(e) => {
                const set = IrDatabaseService.getCodeSetById(e.target.value);
                if (set) setSelectedCodeSet(set);
              }}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
            >
              {GLOBAL_IR_DATABASE.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.brand} - {set.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick IR Keypad */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>IR Remote Keypad</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {selectedCodeSet.brand} ({Object.keys(selectedCodeSet.codes).length} codes)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSendCommand("POWER")}
                className="py-3 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Power</span>
              </button>
              <button
                onClick={() => handleSendCommand("MUTE")}
                className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Mute</span>
              </button>
              <button
                onClick={() => handleSendCommand("INPUT")}
                className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Input</span>
              </button>
            </div>

            {/* Volume / Channel */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleSendCommand("VOLUME_UP")}
                  className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Vol +
                </button>
                <button
                  onClick={() => handleSendCommand("VOLUME_DOWN")}
                  className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Vol -
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleSendCommand("CHANNEL_UP")}
                  className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  CH +
                </button>
                <button
                  onClick={() => handleSendCommand("CHANNEL_DOWN")}
                  className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  CH -
                </button>
              </div>
            </div>
          </div>

          {/* IR Learning Section */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">IR Remote Learning</span>
              <span className="text-[10px] text-zinc-500 font-mono">Receiver Diode Required</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Capture infrared pulses from a physical remote control to store custom keycodes.
            </p>
            <button
              onClick={handleLearnSignal}
              disabled={learningState === "LISTENING"}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Radio className="w-3.5 h-3.5 text-orange-400" />
              <span>{learningState === "LISTENING" ? "Listening..." : "Learn Physical Remote Button"}</span>
            </button>
          </div>

          {/* Feedback message */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 text-center">
              {statusMessage}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
