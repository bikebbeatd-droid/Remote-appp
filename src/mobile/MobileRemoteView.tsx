import React from "react";
import { TvDevice, RemoteMode, RemoteCommandType, ConnectionState } from "../core/types";
import { MobileDeviceCard } from "./components/MobileDeviceCard";
import { MobileModeBar } from "./components/MobileModeBar";
import { ClassicRemote } from "../remotes/ClassicRemote";
import { TouchpadRemote } from "../remotes/TouchpadRemote";
import { DpadRemote } from "../remotes/DpadRemote";
import { MediaRemote } from "../remotes/MediaRemote";
import { KeyboardRemote } from "../remotes/KeyboardRemote";
import { NumpadRemote } from "../remotes/NumpadRemote";
import { AppLauncherRemote } from "../remotes/AppLauncherRemote";
import { GamingRemote } from "../remotes/GamingRemote";
import { AccessibilityRemote } from "../remotes/AccessibilityRemote";

interface MobileRemoteViewProps {
  device: TvDevice | null;
  connectionState: ConnectionState;
  currentMode: RemoteMode;
  onSelectMode: (mode: RemoteMode) => void;
  onSendCommand: (command: RemoteCommandType, value?: any) => Promise<boolean>;
  isSending: boolean;
  onOpenTvSelector: () => void;
  onOpenCapabilityMatrix: () => void;
  onOpenQrScanner?: () => void;
  onOpenPairing?: () => void;
  onOpenVoiceRemote: () => void;
  onOpenButtonMapper?: () => void;
  onOpenCustomBuilder?: () => void;
  onOpenLearnRemote?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenScenes?: () => void;
  onOpenShareProfile?: () => void;
  onOpenRemoteLibrary?: () => void;
  onOpenCompatibilityCenter?: () => void;
  onOpenIrBlaster?: () => void;
  onUnsupportedAttempt?: (reason: string) => void;
}

export const MobileRemoteView: React.FC<MobileRemoteViewProps> = ({
  device,
  connectionState,
  currentMode,
  onSelectMode,
  onSendCommand,
  isSending,
  onOpenTvSelector,
  onOpenCapabilityMatrix,
  onOpenQrScanner,
  onOpenPairing,
  onOpenVoiceRemote,
  onOpenButtonMapper,
  onOpenCustomBuilder,
  onOpenLearnRemote,
  onOpenDiagnostics,
  onOpenScenes,
  onOpenShareProfile,
  onOpenRemoteLibrary,
  onOpenCompatibilityCenter,
  onOpenIrBlaster,
  onUnsupportedAttempt
}) => {
  return (
    <div id="mobile-remote-container" className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col space-y-3.5 pb-10">
      
      {/* 1. Mobile TV Device Card */}
      <MobileDeviceCard
        device={device}
        connectionState={connectionState}
        onOpenTvSelector={onOpenTvSelector}
        onOpenVoiceRemote={onOpenVoiceRemote}
        onOpenCapabilityMatrix={onOpenCapabilityMatrix}
        onOpenQrScanner={onOpenQrScanner}
        onOpenPairing={onOpenPairing}
        onOpenDiagnostics={onOpenDiagnostics}
        onOpenButtonMapper={onOpenButtonMapper}
        onOpenCustomBuilder={onOpenCustomBuilder}
        onOpenLearnRemote={onOpenLearnRemote}
        onOpenScenes={onOpenScenes}
        onOpenShareProfile={onOpenShareProfile}
        onOpenRemoteLibrary={onOpenRemoteLibrary}
        onOpenCompatibilityCenter={onOpenCompatibilityCenter}
        onOpenIrBlaster={onOpenIrBlaster}
      />

      {/* 2. Mobile Mode Switcher Bar */}
      <MobileModeBar
        currentMode={currentMode}
        onSelectMode={onSelectMode}
      />

      {/* 3. Purpose-Built Mobile Remote Screens */}
      <div id="mobile-remote-screen-body" className="w-full">
        {currentMode === "classic" && (
          <ClassicRemote
            device={device}
            onSendCommand={onSendCommand}
            isSending={isSending}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}

        {currentMode === "touchpad" && (
          <TouchpadRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}

        {currentMode === "dpad" && (
          <DpadRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}

        {currentMode === "media" && (
          <MediaRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}

        {currentMode === "keyboard" && (
          <KeyboardRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}

        {currentMode === "numpad" && (
          <NumpadRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}

        {currentMode === "apps" && (
          <AppLauncherRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}

        {currentMode === "gaming" && (
          <GamingRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}

        {currentMode === "accessibility" && (
          <AccessibilityRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}
      </div>

    </div>
  );
};
