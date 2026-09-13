import React, { useState, useEffect, useRef } from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { checkCommandSupport } from "../core/capabilities";
import { Mic, MicOff, Volume2, AlertCircle, CheckCircle2, Sparkles, X, Radio } from "lucide-react";

interface VoiceRemoteModalProps {
  device: TvDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSendCommand: (command: RemoteCommandType, value?: any) => void;
}

export const VoiceRemoteModal: React.FC<VoiceRemoteModalProps> = ({
  device,
  isOpen,
  onClose,
  onSendCommand
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [statusMsg, setStatusMsg] = useState("Tap microphone and speak your TV command...");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isVoiceSupported = device && device.capabilities.voice === "SUPPORTED";

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      setTranscript("");
      setActionFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startListening = () => {
    if (!isVoiceSupported) return;

    // Check for browser speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMsg("Speech recognition is not supported in this browser. Please use text keyboard.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
        setStatusMsg("Listening... (Speak now)");
        setActionFeedback(null);
      };

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join("");
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setStatusMsg(`Voice error: ${event.error || "Could not hear audio."}`);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript) {
          executeVoiceCommand(transcript);
        } else {
          setStatusMsg("No speech detected. Tap to try again.");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setStatusMsg("Microphone permission or Speech API error: " + err.message);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  };

  const executeVoiceCommand = (text: string) => {
    const clean = text.toLowerCase().trim();
    setStatusMsg(`Processing: "${text}"`);

    if (clean.includes("volume up") || clean.includes("louder") || clean.includes("increase volume")) {
      onSendCommand("VOLUME_UP");
      setActionFeedback("Executed: Volume Up");
    } else if (clean.includes("volume down") || clean.includes("quieter") || clean.includes("lower volume")) {
      onSendCommand("VOLUME_DOWN");
      setActionFeedback("Executed: Volume Down");
    } else if (clean.includes("mute") || clean.includes("silence")) {
      onSendCommand("MUTE");
      setActionFeedback("Executed: Mute Toggle");
    } else if (clean.includes("home") || clean.includes("dashboard")) {
      onSendCommand("HOME");
      setActionFeedback("Executed: Home Screen");
    } else if (clean.includes("back") || clean.includes("exit")) {
      onSendCommand("BACK");
      setActionFeedback("Executed: Back");
    } else if (clean.includes("youtube")) {
      onSendCommand("LAUNCH_APP", "com.google.android.youtube.tv");
      setActionFeedback("Executed: Launch YouTube");
    } else if (clean.includes("netflix")) {
      onSendCommand("LAUNCH_APP", "com.netflix.ninja");
      setActionFeedback("Executed: Launch Netflix");
    } else if (clean.includes("play") || clean.includes("resume")) {
      onSendCommand("PLAY");
      setActionFeedback("Executed: Play");
    } else if (clean.includes("pause") || clean.includes("stop")) {
      onSendCommand("PAUSE");
      setActionFeedback("Executed: Pause");
    } else {
      // General voice search query sent to TV search box!
      onSendCommand("TEXT_INPUT", text);
      setActionFeedback(`Delivered text search: "${text}"`);
    }
  };

  return (
    <div id="voice-remote-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="voice-remote-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">Voice Remote Assistant</h3>
              <p className="text-xs text-zinc-400">{device?.name || "Connected TV"}</p>
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
        <div className="p-6 flex flex-col items-center text-center space-y-6">
          {!isVoiceSupported ? (
            <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl text-xs text-amber-300 space-y-2 text-left">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Voice control is not supported by this TV.</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                The {device?.platform.toUpperCase() || "TV"} network protocol does not support remote microphone voice injection. Please use the virtual keyboard instead.
              </p>
            </div>
          ) : (
            <>
              {/* Giant Mic Button */}
              <div className="relative">
                {isListening && (
                  <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-ping pointer-events-none" />
                )}
                <button
                  id="voice-mic-trigger-btn"
                  onClick={isListening ? stopListening : startListening}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl transition-all cursor-pointer ${
                    isListening
                      ? "bg-rose-600 scale-110 shadow-rose-600/40 ring-4 ring-rose-500/30"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                  }`}
                >
                  {isListening ? (
                    <Mic className="w-10 h-10 animate-pulse" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </button>
              </div>

              {/* Status and transcript */}
              <div className="space-y-2 w-full">
                <p className="text-xs text-zinc-400 font-medium">{statusMsg}</p>
                {transcript && (
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-sm text-indigo-300">
                    "{transcript}"
                  </div>
                )}
                {actionFeedback && (
                  <div className="p-2.5 bg-emerald-950/50 border border-emerald-800/60 rounded-xl flex items-center justify-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{actionFeedback}</span>
                  </div>
                )}
              </div>

              {/* Spoken phrase examples */}
              <div className="w-full pt-2 border-t border-zinc-800/80 text-left space-y-2">
                <span className="text-[11px] text-zinc-500 uppercase font-semibold">Try Saying:</span>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-zinc-400">
                  <span className="p-1.5 bg-zinc-950 rounded border border-zinc-800/60">"Open YouTube"</span>
                  <span className="p-1.5 bg-zinc-950 rounded border border-zinc-800/60">"Volume Up"</span>
                  <span className="p-1.5 bg-zinc-950 rounded border border-zinc-800/60">"Pause Video"</span>
                  <span className="p-1.5 bg-zinc-950 rounded border border-zinc-800/60">"Search Interstellar"</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
