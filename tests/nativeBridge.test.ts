import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { NativeAndroidBridge } from "../src/core/NativeAndroidBridge";

describe("NativeAndroidBridge Tests", () => {
  test("detects browser environment fallback when no native wrapper exists", async () => {
    NativeAndroidBridge.resetCache();
    const status = await NativeAndroidBridge.detectBridge();
    assert.equal(typeof status.isAvailable, "boolean");
    assert.ok(["NATIVE_ANDROID_JS", "TERMUX_LOCAL_REST", "WEB_BROWSER"].includes(status.bridgeType));
  });

  test("rejects IR transmission honestly when no physical emitter is available", async () => {
    NativeAndroidBridge.resetCache();
    const result = await NativeAndroidBridge.transmitIr(38000, [100, 100, 200, 200]);
    // In test environment without hardware, it must return honest failure
    assert.equal(result.success, false);
    assert.ok(result.error?.includes("IR emitter") || result.error?.includes("hardware"));
  });

  test("triggerNativeDiscovery returns null safely in headless test environment", async () => {
    const result = await NativeAndroidBridge.triggerNativeDiscovery();
    assert.equal(result, null);
  });
});
