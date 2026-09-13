import React, { useState, useEffect } from "react";
import { TvDevice } from "../../core/types";
import { Monitor, Wifi, Radio, Clock, ShieldCheck, Cpu } from "lucide-react";

interface TvReceiverHeaderProps {
  device: TvDevice | null;
  powerOn: boolean;
  connectedPhoneCount: number;
}

export const TvReceiverHeader: React.FC<TvReceiverHeaderProps> = ({
  device,
  powerOn,
  connectedPhoneCount
}) => {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-zinc-900/90 border-b-2 border-zinc-800 px-6 py-4 flex items-center justify-between shadow-2xl backdrop-blur-md">
      
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/40 border border-indigo-400">
          <Monitor className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-zinc-100 tracking-wide">
              {device?.name || "Android TV / Google TV"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
              {device?.platform ? device.platform.toUpperCase() : "RECEIVER OS 14"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
            <span>LAN: {device?.ip && device.ip !== "127.0.0.1" ? device.ip : "192.168.1.105"}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure WebSocket Server Active
            </span>
          </p>
        </div>
      </div>

      {/* 10-Foot Status & Live Clock */}
      <div className="flex items-center gap-6 text-sm">
        
        {/* Connected Phones Badge */}
        <div className="px-4 py-2 bg-zinc-800/90 border border-zinc-700 rounded-xl flex items-center gap-2">
          <Radio className={`w-4 h-4 ${connectedPhoneCount > 0 ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`} />
          <span className="text-zinc-300 font-medium">
            {connectedPhoneCount > 0 ? (
              <span className="text-emerald-300 font-bold">● {connectedPhoneCount} Phone Connected</span>
            ) : (
              <span className="text-zinc-400">Waiting for Remote</span>
            )}
          </span>
        </div>

        {/* Wi-Fi Network & Resolution */}
        <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs hidden md:flex">
          <Wifi className="w-4 h-4 text-indigo-400" />
          <span>Home_WiFi_5G</span>
          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded font-bold">4K HDR 60fps</span>
        </div>

        {/* Digital Clock */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl font-mono text-base font-bold text-zinc-100">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>{time}</span>
        </div>

      </div>

    </header>
  );
};
