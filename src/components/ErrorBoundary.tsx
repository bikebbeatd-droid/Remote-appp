import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, WifiOff, Activity, Terminal, ShieldAlert } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDiagnostics: boolean;
  offlineMode: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDiagnostics: false,
    offlineMode: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled application error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDiagnostics: false,
    });
  };

  private handleContinueOffline = () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ustv_force_offline", "true");
      }
    } catch {}

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      offlineMode: true,
      showDiagnostics: false,
    });
  };

  private toggleDiagnostics = () => {
    this.setState((prev) => ({ showDiagnostics: !prev.showDiagnostics }));
  };

  public render() {
    if (this.state.hasError) {
      const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";

      return (
        <div
          id="app-error-boundary-screen"
          className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6"
        >
          <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Something went wrong
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  An error occurred during application execution.
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold text-zinc-300">Error Summary:</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/40">
                  Caught Safely
                </span>
              </div>
              <p className="text-rose-300 font-mono break-all leading-relaxed">
                {this.state.error?.message || "Unknown runtime exception encountered."}
              </p>
            </div>

            {/* Action Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                id="error-boundary-retry-btn"
                onClick={this.handleRetry}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>

              <button
                id="error-boundary-offline-btn"
                onClick={this.handleContinueOffline}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-zinc-700 cursor-pointer"
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Continue Offline</span>
              </button>

              <button
                id="error-boundary-diagnostics-btn"
                onClick={this.toggleDiagnostics}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-zinc-700 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>Diagnostics</span>
              </button>
            </div>

            {/* Diagnostics Panel */}
            {this.state.showDiagnostics && (
              <div
                id="error-boundary-diagnostics-panel"
                className="p-4 bg-black/60 border border-zinc-800 rounded-2xl space-y-3 animate-in fade-in duration-150"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Diagnostic Information</span>
                </div>

                <div className="space-y-1.5 text-[11px] text-zinc-400 font-mono">
                  <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                    <span>Network Connectivity:</span>
                    <span className={isOnline ? "text-emerald-400" : "text-rose-400"}>
                      {isOnline ? "Online (LAN reachable)" : "Offline (No Internet/LAN)"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                    <span>Host Platform:</span>
                    <span className="text-zinc-300 truncate max-w-[200px]" title={userAgent}>
                      {userAgent.split(" ")[0]}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                    <span>Timestamp:</span>
                    <span className="text-zinc-300">{new Date().toISOString()}</span>
                  </div>
                </div>

                {this.state.error?.stack && (
                  <div className="mt-2">
                    <span className="text-[10px] text-zinc-500 font-semibold">Stack Trace:</span>
                    <pre className="mt-1 p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] text-zinc-400 font-mono max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="text-center pt-2">
              <p className="text-[11px] text-zinc-500">
                Universal Smart TV Remote preserves your paired keys and configuration locally.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
