import React, { useState, useEffect } from "react";
import { TvDevice } from "../../core/types";
import { Wifi, Radio, Clock, ShieldCheck, Volume2, VolumeX, Sparkles } from "lucide-react";
import { AppLogo } from "../../components/common/AppLogo";
import { TvSpeechFeedback } from "../TvSpeechFeedback";

interface TvReceiverHeaderProps {
  device: TvDevice | null;
  powerOn: boolean;
  connectedPhoneCount: number;
  onVoiceFeedbackToggle?: (enabled: boolean) => void;
  voiceFeedbackEnabled?: boolean;
}

export const TvReceiverHeader: React.FC<TvReceiverHeaderProps> = ({
  device,
  powerOn,
  connectedPhoneCount,
  onVoiceFeedbackToggle,
  voiceFeedbackEnabled = true
}) => {
  const [time, setTime] = useState<string>("");
  const [speechActive, setSpeechActive] = useState<boolean>(voiceFeedbackEnabled);
  const [testActive, setTestActive] = useState(false);

  useEffect(() => {
    setSpeechActive(TvSpeechFeedback.isEnabled());
  }, [voiceFeedbackEnabled]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleVoice = () => {
    const next = !speechActive;
    setSpeechActive(next);
    TvSpeechFeedback.setEnabled(next);
    if (onVoiceFeedbackToggle) onVoiceFeedbackToggle(next);
    if (next) {
      TvSpeechFeedback.speak("Voice feedback enabled", true);
    }
  };

  const handleTestSpeech = () => {
    setTestActive(true);
    TvSpeechFeedback.speak("Connected to Mobile", true);
    setTimeout(() => setTestActive(false), 2000);
  };

  return (
    <header className="w-full bg-zinc-900/90 border-b-2 border-zinc-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
      
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-3.5 min-w-0">
        <AppLogo size="md" showText={false} />
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg sm:text-xl font-black text-zinc-100 tracking-wide truncate">
              {device?.name || "Android TV / Google TV"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider shrink-0">
              {device?.platform ? device.platform.toUpperCase() : "RECEIVER OS 14"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5 truncate">
            <span>LAN: {device?.ip && device.ip !== "127.0.0.1" ? device.ip : (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? window.location.hostname : "Active LAN")}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              Secure WebSocket Server Active
            </span>
          </p>
        </div>
      </div>

      {/* 10-Foot Status & Live Controls */}
      <div className="flex items-center gap-3 sm:gap-5 text-sm shrink-0">
        
        {/* Browser SpeechSynthesis Announcement Feedback Control */}
        <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
          <button
            id="tv-voice-feedback-toggle-btn"
            onClick={handleToggleVoice}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              speechActive
                ? "bg-indigo-600/90 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title={speechActive ? "Voice announcements active (SpeechSynthesis)" : "Voice announcements muted"}
          >
            {speechActive ? <Volume2 className="w-3.5 h-3.5 text-cyan-300" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
            <span className="hidden sm:inline">Voice TTS</span>
          </button>

          <button
            id="tv-voice-test-btn"
            onClick={handleTestSpeech}
            className="px-2 py-1.5 rounded-lg text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all cursor-pointer flex items-center gap-1"
            title="Test Voice Announcement"
          >
            <Sparkles className={`w-3 h-3 text-cyan-400 ${testActive ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Test Speech</span>
          </button>
        </div>

        {/* Connected Phones Badge */}
        <div className="px-3 py-1.5 bg-zinc-800/90 border border-zinc-700 rounded-xl flex items-center gap-2 text-xs">
          <Radio className={`w-3.5 h-3.5 ${connectedPhoneCount > 0 ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`} />
          <span className="text-zinc-300 font-medium">
            {connectedPhoneCount > 0 ? (
              <span className="text-emerald-300 font-bold">● {connectedPhoneCount} Phone Connected</span>
            ) : (
              <span className="text-zinc-400">Waiting for Remote</span>
            )}
          </span>
        </div>

        {/* Digital Clock */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl font-mono text-xs sm:text-sm font-bold text-zinc-100">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{time}</span>
        </div>

      </div>

    </header>
  );
};

