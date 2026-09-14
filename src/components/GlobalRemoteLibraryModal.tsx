import React, { useState, useMemo } from "react";
import { 
  Search, 
  Tv, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Settings, 
  SlidersHorizontal, 
  Sparkles, 
  Radio, 
  Zap, 
  ShieldCheck, 
  X, 
  PlusCircle, 
  ChevronRight,
  Info
} from "lucide-react";
import { DeviceProfile, DeviceCategory } from "../database/types";
import { DeviceDatabaseService } from "../database/deviceDatabase";
import { TvDevice } from "../core/types";

interface GlobalRemoteLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeviceProfile: (profile: DeviceProfile) => void;
  onOpenCompatibilityCenter?: (profileId: string) => void;
}

export const GlobalRemoteLibraryModal: React.FC<GlobalRemoteLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectDeviceProfile,
  onOpenCompatibilityCenter
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProfile, setSelectedProfile] = useState<DeviceProfile | null>(null);

  const allBrands = useMemo(() => ["ALL", ...DeviceDatabaseService.getAllBrands()], []);
  const allCategories = useMemo(() => ["ALL", ...DeviceDatabaseService.getAllCategories()], []);

  const filteredProfiles = useMemo(() => {
    return DeviceDatabaseService.searchProfiles({
      query: searchQuery || undefined,
      brand: selectedBrand === "ALL" ? undefined : selectedBrand,
      category: selectedCategory === "ALL" ? undefined : (selectedCategory as DeviceCategory)
    });
  }, [searchQuery, selectedBrand, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-5xl h-[90vh] max-h-[820px] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-4 md:p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-white">Global Remote Library</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 border border-indigo-700/50 text-indigo-300">
                  {DeviceDatabaseService.getAllProfiles().length}+ Profiles
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Verified hardware specifications, native protocols, and capability profiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/90 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Brand, Model, Series (e.g. Samsung QN90C, LG C3, Bravia XR, Roku Ultra)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Brand:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              {allBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Type:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 capitalize"
            >
              {allCategories.map(c => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Area: Grid + Details Split */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Profiles List */}
          <div className={`overflow-y-auto p-4 space-y-2 border-r border-zinc-800/80 ${selectedProfile ? 'hidden md:block md:col-span-5' : 'col-span-12'}`}>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1 flex justify-between">
              <span>Matching Devices ({filteredProfiles.length})</span>
              <span>Select to inspect</span>
            </div>

            {filteredProfiles.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-xs">
                No matching device profiles found. Try a different search term or filter.
              </div>
            ) : (
              filteredProfiles.map((profile) => {
                const isSelected = selectedProfile?.id === profile.id;
                return (
                  <div
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-950/50"
                        : "bg-zinc-950/60 border-zinc-800/60 hover:bg-zinc-800/50 hover:border-zinc-700"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{profile.brand}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300">
                          {profile.series}
                        </span>
                        {profile.verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-300 font-medium">{profile.model}</p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <span>{profile.yearRange}</span>
                        <span>•</span>
                        <span className="capitalize">{profile.platform.replace(/_/g, " ")}</span>
                        <span>•</span>
                        <span>Port {profile.defaultPort || "IR"}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-indigo-400 translate-x-1' : 'text-zinc-600'}`} />
                  </div>
                );
              })
            )}
          </div>

          {/* Profile Detailed Specification Pane */}
          {selectedProfile && (
            <div className="col-span-12 md:col-span-7 overflow-y-auto p-5 space-y-5 bg-zinc-950/80 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/40 uppercase">
                        {selectedProfile.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{selectedProfile.yearRange}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {selectedProfile.brand} {selectedProfile.series}
                    </h3>
                    <p className="text-xs text-zinc-400">{selectedProfile.model}</p>
                  </div>

                  <button
                    onClick={() => setSelectedProfile(null)}
                    className="md:hidden text-xs text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-lg"
                  >
                    Back to list
                  </button>
                </div>

                {/* Protocol & Pairing Specifications */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase">Platform Protocol</span>
                    <p className="font-mono font-medium text-indigo-300 truncate">{selectedProfile.protocol}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase">Pairing Method</span>
                    <p className="font-semibold text-emerald-400">{selectedProfile.pairingMethod.replace(/_/g, " ")}</p>
                  </div>
                </div>

                {/* Authentication & Discovery Details */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Security & Transport Protocol</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    {selectedProfile.authDescription}
                  </p>
                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Discovery: <strong className="text-zinc-400">{selectedProfile.discoveryMethod}</strong></span>
                    <span>Default Port: <strong className="text-zinc-400">{selectedProfile.defaultPort}</strong></span>
                  </div>
                </div>

                {/* Capability Matrix Badges */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400">Verified Protocol Capabilities</span>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    {Object.entries(selectedProfile.defaultCapabilities).map(([cap, status]) => {
                      const isSupported = status === "SUPPORTED";
                      const isReqHw = status === "REQUIRES_HARDWARE";
                      return (
                        <div
                          key={cap}
                          className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${
                            isSupported
                              ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                              : isReqHw
                              ? "bg-amber-950/20 border-amber-800/40 text-amber-300"
                              : "bg-zinc-900/50 border-zinc-800/60 text-zinc-500"
                          }`}
                        >
                          <span className="capitalize">{cap}</span>
                          <span className="font-bold">{isSupported ? "✓" : isReqHw ? "⚡" : "✕"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Required TV Settings */}
                {selectedProfile.tvSettingsRequired && selectedProfile.tvSettingsRequired.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Required TV Settings</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px]">
                      {selectedProfile.tvSettingsRequired.map((set, i) => (
                        <li key={i}>{set}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    onSelectDeviceProfile(selectedProfile);
                    onClose();
                  }}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Tv className="w-4 h-4" />
                  <span>Use This Remote Profile</span>
                </button>

                {onOpenCompatibilityCenter && (
                  <button
                    onClick={() => {
                      onOpenCompatibilityCenter(selectedProfile.id);
                      onClose();
                    }}
                    className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>Check Compatibility</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
