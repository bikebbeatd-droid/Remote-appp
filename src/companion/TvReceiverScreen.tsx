import React, { useEffect, useState } from "react";
import { TvDevice } from "../core/types";
import { Tv, Volume2, VolumeX, Radio, CheckCircle, Wifi, Monitor, Play, AppWindow, QrCode } from "lucide-react";
import { buildTvPairingPayload } from "../utils/qrCodeGenerator";

interface TvReceiverScreenProps {
  device: TvDevice | null;
  lastCommand: { command: string; value?: any; timestamp: string } | null;
  pairingPin: string | null;
}

export const TvReceiverScreen: React.FC<TvReceiverScreenProps> = ({
  device,
  lastCommand,
  pairingPin
}) => {
  const [powerOn, setPowerOn] = useState(true);
  const [currentApp, setCurrentApp] = useState("Google TV Home");
  const [volume, setVolume] = useState(24);
  const [isMuted, setIsMuted] = useState(false);
  const [channel, setChannel] = useState(7);
  const [recentNotification, setRecentNotification] = useState<string | null>(null);
  const [showPairingQr, setShowPairingQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const activePin = pairingPin || "";

  useEffect(() => {
    if (!device) {
      setQrDataUrl("");
      return;
    }
    try {
      const { pairingUrl } = buildTvPairingPayload(device);
      // QR contains connection metadata only; never embed a PIN or token.
      import("../utils/qrCodeGenerator").then(({ generateQrDataUrl }) =>
        generateQrDataUrl(pairingUrl, { width: 200 }).then(url => setQrDataUrl(url))
      );
    } catch {
      setQrDataUrl("");
    }
  }, [device, activePin]);

  // Synchronize state when real commands arrive from remote
  useEffect(() => {
    if (!lastCommand) return;
    const { command, value } = lastCommand;

    if (command === "POWER") {
      setPowerOn(prev => !prev);
      setRecentNotification(powerOn ? "Standby mode activated" : "Power On");
    } else if (command === "VOLUME_UP") {
      setVolume(v => Math.min(100, v + 2));
      setIsMuted(false);
      setRecentNotification(`Volume: ${Math.min(100, volume + 2)}`);
    } else if (command === "VOLUME_DOWN") {
      setVolume(v => Math.max(0, v - 2));
      setIsMuted(false);
      setRecentNotification(`Volume: ${Math.max(0, volume - 2)}`);
    } else if (command === "SET_VOLUME" && typeof value === "number") {
      setVolume(value);
      setRecentNotification(`Volume: ${value}`);
    } else if (command === "MUTE") {
      setIsMuted(m => !m);
      setRecentNotification(isMuted ? "Unmuted" : "Muted");
    } else if (command === "HOME") {
      setCurrentApp("Google TV Home");
      setRecentNotification("Home Screen");
    } else if (command === "CHANNEL_UP") {
      setChannel(c => c + 1);
      setRecentNotification(`Channel: ${channel + 1}`);
    } else if (command === "CHANNEL_DOWN") {
      setChannel(c => Math.max(1, c - 1));
      setRecentNotification(`Channel: ${Math.max(1, channel - 1)}`);
    } else if (command === "LAUNCH_APP") {
      const appName = value?.includes("youtube")
        ? "YouTube"
        : value?.includes("netflix")
        ? "Netflix"
        : value?.includes("spotify")
        ? "Spotify"
        : value || "Application";
      setCurrentApp(appName);
      setRecentNotification(`Launched ${appName}`);
    } else if (command === "TEXT_INPUT") {
      setRecentNotification(`Searched: "${value}"`);
    } else {
      setRecentNotification(`Command: ${command}`);
    }

    const timer = setTimeout(() => {
      setRecentNotification(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [lastCommand]);

  return (
    <div id="tv-receiver-screen-container" className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
      
      {/* Television Bezel Frame */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs sm:text-sm text-zinc-100">{device?.name || "Android TV / Google TV Companion"}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                RECEIVER APP LIVE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Companion display reflecting incoming network packets in real-time</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[11px]">
              LAN: {device?.ip && device.ip !== "127.0.0.1" ? device.ip : (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? window.location.hostname : "Active LAN")}
            </span>
          </div>
        </div>
      </div>

      {/* Simulated TV Display Screen */}
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden border-2 transition-all duration-500 flex flex-col justify-between p-6 ${
        powerOn
          ? "bg-gradient-to-tr from-zinc-900 via-indigo-950/40 to-zinc-900 border-zinc-700 shadow-inner"
          : "bg-black border-zinc-900"
      }`}>
        
        {!powerOn ? (
          <div className="m-auto text-center space-y-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 mx-auto animate-pulse" />
            <p className="text-xs text-zinc-600 font-mono">STANDBY / SLEEP</p>
            <p className="text-[10px] text-zinc-700">Press POWER button on remote to wake TV</p>
          </div>
        ) : (
          <>
            {/* Top Bar of TV UI */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-xs font-semibold text-white tracking-wider">
                  {currentApp.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-zinc-400">CH {channel}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 font-mono">
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-400">MUTED</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-indigo-300" />
                      <span>{volume}%</span>
                    </>
                  )}
                </div>
                <span className="font-mono text-[11px] text-zinc-400">1080p 60Hz</span>
              </div>
            </div>

            {/* Center Area: Apps or Pairing PIN / QR Code Display */}
            <div className="my-auto text-center space-y-3 z-10 flex flex-col items-center">
              {showPairingQr ? (
                <div className="p-4 bg-zinc-900/95 border-2 border-indigo-400 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col items-center space-y-2 animate-in fade-in zoom-in-95 max-w-xs">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5" />
                    Scan with Phone Remote
                  </span>
                  <div className="p-2 bg-white rounded-xl shadow-lg">
                    {qrDataUrl && (
                      <img src={qrDataUrl} alt="TV Pairing QR Code" className="w-36 h-36 object-contain" />
                    )}
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-zinc-400">Pairing PIN: </span>
                    <span className="font-mono font-bold text-sm text-indigo-200">{activePin}</span>
                  </div>
                  <button
                    onClick={() => setShowPairingQr(false)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[10px] font-bold"
                  >
                    Hide QR
                  </button>
                </div>
              ) : pairingPin ? (
                <div className="max-w-xs mx-auto p-4 bg-indigo-950/90 border-2 border-indigo-400 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                    Pairing Request From Mobile
                  </span>
                  <div className="text-3xl font-mono font-black text-white tracking-widest my-1">
                    {pairingPin}
                  </div>
                  <p className="text-[10px] text-indigo-200">
                    Enter this PIN in your remote app to authorize
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                    {currentApp === "Google TV Home" ? "Ready to Stream" : currentApp}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {device?.name || "Smart TV"} • Listening for incoming controller commands
                  </p>
                  <button
                    id="show-tv-qr-btn"
                    onClick={() => setShowPairingQr(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 rounded-xl text-xs font-semibold backdrop-blur-sm cursor-pointer transition-all shadow-md"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Display Pairing QR Code</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom notification overlay on screen */}
            <div className="flex items-center justify-between z-10">
              {recentNotification ? (
                <div className="px-3.5 py-1.5 bg-indigo-600/90 text-white rounded-xl text-xs font-semibold shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{recentNotification}</span>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500 font-mono">
                  Status: Ready
                </div>
              )}

              {lastCommand && (
                <div className="text-[10px] font-mono text-zinc-400 bg-black/50 px-2 py-1 rounded border border-white/5">
                  Last Packet: {lastCommand.command} ({lastCommand.timestamp})
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
};
