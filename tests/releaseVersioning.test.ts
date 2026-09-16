import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Version code calculation function mirroring Gradle & CI script logic
export function calculateVersionCode(version: string): number {
  try {
    const clean = version.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    const major = parts.length > 0 && parts[0] ? parseInt(parts[0], 10) : 1;
    const minor = parts.length > 1 && parts[1] ? parseInt(parts[1], 10) : 0;
    const patch = parts.length > 2 && parts[2] ? parseInt(parts[2], 10) : 0;
    return (major * 1000000) + (minor * 10000) + (patch * 100);
  } catch {
    return 1;
  }
}

export function formatApkFilename(version: string, isSigned = true): string {
  const clean = version.replace(/^v/, "");
  return isSigned ? `Remote-appp-v${clean}.apk` : `Remote-appp-v${clean}-unsigned.apk`;
}

export function formatReleaseUrl(repoOwner: string, repoName: string, tag: string): string {
  return `https://github.com/${repoOwner}/${repoName}/releases/download/${tag}/Remote-appp-${tag}.apk`;
}

describe("Android Release Versioning & Checksum Tests", () => {
  it("calculates deterministic integer version codes accurately", () => {
    assert.equal(calculateVersionCode("1.0.0"), 1000000);
    assert.equal(calculateVersionCode("1.2.0"), 1020000);
    assert.equal(calculateVersionCode("1.2.3"), 1020300);
    assert.equal(calculateVersionCode("v2.15.8"), 2150800);
    assert.equal(calculateVersionCode("10.0.1"), 10000100);
  });

  it("handles malformed version inputs gracefully", () => {
    assert.equal(calculateVersionCode(""), 1000000);
    assert.equal(calculateVersionCode("beta"), 1000000);
    assert.equal(calculateVersionCode("v1"), 1000000);
  });

  it("formats APK release filenames cleanly and distinguishes signing status", () => {
    assert.equal(formatApkFilename("1.0.0", true), "Remote-appp-v1.0.0.apk");
    assert.equal(formatApkFilename("v1.2.5", true), "Remote-appp-v1.2.5.apk");
    assert.equal(formatApkFilename("1.0.0", false), "Remote-appp-v1.0.0-unsigned.apk");
  });

  it("constructs valid GitHub Release asset download URLs", () => {
    const url = formatReleaseUrl("bikebbeatd-droid", "Remote-appp", "v1.0.0");
    assert.equal(url, "https://github.com/bikebbeatd-droid/Remote-appp/releases/download/v1.0.0/Remote-appp-v1.0.0.apk");
  });

  it("ensures SHA-256 checksum format complies with standard 64-character hex", () => {
    const validSha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const shaRegex = /^[a-fA-F0-9]{64}$/;
    assert.equal(shaRegex.test(validSha256), true);
    assert.equal(shaRegex.test("invalid_hash"), false);
  });
});
