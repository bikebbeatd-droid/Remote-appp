import React, { useState, useEffect } from "react";
import {
  Cloud,
  CloudCheck,
  CloudOff,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tv,
  X,
  UserCheck,
  CheckCircle2,
  Database,
  ArrowUpDown,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  auth,
  loginWithGoogle,
  logoutUser,
  onAuthChanged,
  syncDeviceToCloud,
  testFirestoreConnection,
} from "../../core/firebase";
import { TvDevice } from "../../core/types";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  localDevices: TvDevice[];
  onSyncCompleted?: (devices: TvDevice[]) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  localDevices,
}) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [firestoreHealthy, setFirestoreHealthy] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthChanged((currentUser) => {
      setUser(currentUser);
    });
    // Check firestore health
    testFirestoreConnection().then((healthy) => {
      setFirestoreHealthy(healthy);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const signedInUser = await loginWithGoogle();
      setUser(signedInUser);
      setStatusMessage("Signed in successfully with Google!");
      // Automatically sync local devices to user's cloud account
      if (localDevices.length > 0) {
        setIsSyncing(true);
        for (const dev of localDevices) {
          await syncDeviceToCloud(signedInUser.uid, dev);
        }
        setIsSyncing(false);
        setStatusMessage(`Synced ${localDevices.length} device(s) to your cloud account.`);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setStatusMessage("Signed out. Local devices are preserved on this device.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSyncAll = async () => {
    if (!user) return;
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      for (const dev of localDevices) {
        await syncDeviceToCloud(user.uid, dev);
      }
      setStatusMessage(`Successfully synced ${localDevices.length} TV(s) to Firestore!`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to sync devices to cloud."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Cloud Sync & Multi-Device
              </h2>
              <p className="text-xs text-zinc-400">
                Sync paired TVs, layouts & tokens across all your devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Banners */}
          {errorMessage && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-2xl text-xs text-red-300">
              {errorMessage}
            </div>
          )}
          {statusMessage && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* User Account Card */}
          {user ? (
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-11 h-11 rounded-full border border-zinc-700"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      {user.displayName || "Smart TV Remote User"}
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">
                      {user.email || user.uid}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Cloud Sync details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                <div className="p-2.5 bg-zinc-900/60 rounded-xl">
                  <div className="text-[11px] text-zinc-400">Database Engine</div>
                  <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 mt-0.5">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    Firestore Cloud
                  </div>
                </div>
                <div className="p-2.5 bg-zinc-900/60 rounded-xl">
                  <div className="text-[11px] text-zinc-400">Local Devices Ready</div>
                  <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 mt-0.5">
                    <Tv className="w-3.5 h-3.5 text-emerald-400" />
                    {localDevices.length} Connected
                  </div>
                </div>
              </div>

              {/* Sync Action Button */}
              <button
                onClick={handleManualSyncAll}
                disabled={isSyncing || localDevices.length === 0}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <ArrowUpDown className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                <span>
                  {isSyncing
                    ? "Pushing Devices to Cloud..."
                    : `Sync ${localDevices.length} Device(s) to Cloud Account`}
                </span>
              </button>
            </div>
          ) : (
            <div className="p-5 bg-gradient-to-b from-indigo-950/30 to-zinc-950 border border-indigo-900/40 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Sign In with Google</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Automatically sync your paired Android TVs, Samsung Tizen, Roku, and LG webOS
                  remotes across all your smartphones, tablets, and computers.
                </p>
              </div>

              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-white/10"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                <span>{loading ? "Signing in..." : "Continue with Google"}</span>
              </button>
            </div>
          )}

          {/* Benefits Info */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Cloud Features & Zero-Config
            </div>
            <div className="grid gap-2">
              <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-start gap-3">
                <Smartphone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-zinc-200">Cross-Phone Roaming:</span>{" "}
                  <span className="text-zinc-400">
                    Pair once on your main phone, use immediately on family phones or tablets.
                  </span>
                </div>
              </div>
              <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-zinc-200">Private Firestore Rules:</span>{" "}
                  <span className="text-zinc-400">
                    Strict owner-only Firestore security rules protect your paired device tokens.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span
              className={`w-2 h-2 rounded-full ${
                firestoreHealthy ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              }`}
            />
            <span>{firestoreHealthy ? "Firestore Live" : "Local Mode"}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
