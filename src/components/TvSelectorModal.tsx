import React, { useState } from "react";
import { TvDevice } from "../core/types";
import { Tv, Star, Edit3, Trash2, Check, Lock, Unlock, Plus, X, Laptop, Radio, Monitor, Camera, QrCode, Wifi } from "lucide-react";

interface TvSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices?: TvDevice[];
  currentDeviceId: string | null;
  onSelectDevice: (device: TvDevice) => void;
  onUpdateDevice: (device: TvDevice) => void;
  onRemoveDevice: (deviceId: string) => void;
  onOpenScanner: () => void;
  onOpenPairing: (device: TvDevice) => void;
  onOpenQrScanner?: () => void;
}

export const TvSelectorModal: React.FC<TvSelectorModalProps> = ({
  isOpen,
  onClose,
  devices = [],
  currentDeviceId,
  onSelectDevice,
  onUpdateDevice,
  onRemoveDevice,
  onOpenScanner,
  onOpenPairing,
  onOpenQrScanner
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (!isOpen) return null;

  const safeDevices = Array.isArray(devices) ? devices : [];

  const startEdit = (dev: TvDevice) => {
    setEditingId(dev.id);
    setEditName(dev.name);
  };

  const saveEdit = (dev: TvDevice) => {
    if (editName.trim()) {
      onUpdateDevice({ ...dev, name: editName.trim() });
    }
    setEditingId(null);
  };

  const toggleFavorite = (dev: TvDevice) => {
    onUpdateDevice({ ...dev, isFavorite: !dev.isFavorite });
  };

  return (
    <div id="tv-selector-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="tv-selector-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">My Televisions</h3>
              <p className="text-xs text-zinc-400">Switch active TV, manage names, or pair new screens</p>
            </div>
          </div>
          <button
            id="close-tv-selector-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {safeDevices.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-500">
                <Tv className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-zinc-300">No Saved Televisions Found</p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Scan your local Wi-Fi network to detect Sony BRAVIA, LG webOS, Samsung Tizen, Roku, or Android TVs.
              </p>
            </div>
          ) : (
            safeDevices.map(dev => {
            const isSelected = dev.id === currentDeviceId;
            return (
              <div
                key={dev.id}
                id={`device-row-${dev.id}`}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-indigo-950/30 border-indigo-500/60 shadow-md"
                    : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleFavorite(dev)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        dev.isFavorite ? "text-amber-400 bg-amber-400/10" : "text-zinc-600 hover:text-zinc-400"
                      }`}
                      title={dev.isFavorite ? "Favorited" : "Mark as favorite"}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingId === dev.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white outline-none w-full"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(dev)}
                            className="p-1 text-emerald-400 hover:bg-zinc-800 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-zinc-200 truncate">{dev.name}</span>
                          <button
                            onClick={() => startEdit(dev)}
                            className="text-zinc-500 hover:text-zinc-300 p-0.5"
                            title="Rename"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <p className="text-[11px] text-zinc-400 truncate font-mono">
                        {dev.platform.toUpperCase()} •{" "}
                        {dev.ip === "127.0.0.1" || dev.ip === "localhost" ? (
                          <span className="text-amber-400 font-sans">Termux Backend (Set TV LAN IP)</span>
                        ) : (
                          `${dev.ip}:${dev.port}`
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {dev.requiresPairing && !dev.isPaired ? (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenPairing(dev);
                        }}
                        className="px-2.5 py-1 bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 text-amber-300 rounded text-xs font-medium flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        Pair
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectDevice(dev);
                          onClose();
                        }}
                        disabled={isSelected}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white cursor-default"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                        }`}
                      >
                        {isSelected ? "Active" : "Connect"}
                      </button>
                    )}

                    <button
                      onClick={() => onRemoveDevice(dev.id)}
                      className="p-1.5 text-zinc-600 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Remove device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>

        {/* Add New TV / Scan Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center gap-2">
          {onOpenQrScanner && (
            <button
              id="open-qr-scanner-from-selector-btn"
              onClick={() => {
                onClose();
                onOpenQrScanner();
              }}
              className="w-full sm:flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Scan TV Screen QR</span>
            </button>
          )}

          <button
            id="open-scanner-from-selector-btn"
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            className="w-full sm:flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-colors border border-zinc-700 cursor-pointer"
          >
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Scan Wi-Fi Network</span>
          </button>
        </div>
      </div>
    </div>
  );
};
