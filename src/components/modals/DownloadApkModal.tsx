import React from "react";

/**
 * APK distribution is intentionally handled by GitHub Releases, not inside
 * the remote-control application. This component remains as a compatibility
 * shim for older imports so the UI cannot accidentally expose a second
 * download flow.
 */
export interface ReleaseMetadata {
  version: string;
  tagName: string;
  name: string;
  downloadUrl: string;
  fileName: string;
  size?: number;
  sizeFormatted?: string;
  publishedAt?: string;
  checksum?: string;
  releasePageUrl: string;
  isAvailable: boolean;
  signingStatus?: string;
}

interface DownloadApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadApkModal: React.FC<DownloadApkModalProps> = () => null;
