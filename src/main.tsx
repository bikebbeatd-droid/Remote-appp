import React from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Application root element (#root) is missing.");
}

const escapeHtml = (value: unknown) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const showBootError = (error: unknown) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  rootElement.innerHTML = `
    <div style="min-height:100vh;background:#050507;color:#f4f4f5;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,sans-serif">
      <div style="width:min(680px,100%);background:#18181b;border:1px solid #3f3f46;border-radius:20px;padding:22px;box-sizing:border-box">
        <div style="font-size:20px;font-weight:800;margin-bottom:6px">Universal Smart TV Remote</div>
        <div style="color:#a1a1aa;font-size:13px;margin-bottom:16px">The Android app could not load its interface.</div>
        <div style="background:#09090b;border-radius:12px;padding:12px;color:#fda4af;font:12px/1.5 monospace;white-space:pre-wrap;word-break:break-word">${escapeHtml(message)}</div>
        <button onclick="location.reload()" style="margin-top:14px;padding:11px 16px;border:0;border-radius:10px;background:#4f46e5;color:#fff;font-weight:700">Reload app</button>
      </div>
    </div>`;
};

window.addEventListener("error", (event) => {
  if (event.error) {
    console.error("Global runtime error:", event.error);
  }
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

const root = createRoot(rootElement, {
  onCaughtError: (error) => console.error("React caught error:", error),
  onUncaughtError: (error) => {
    console.error("React uncaught error:", error);
    showBootError(error);
  },
});

try {
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );

  // React 19 commits asynchronously. Do not look for a specific child selector:
  // onboarding, TV mode, and error-boundary screens intentionally use different
  // roots. The only reliable boot-complete signal is that React has replaced the
  // static #native-boot-screen inside #root.
  //
  // A MutationObserver also avoids an infinite requestAnimationFrame loop on
  // slower Android WebViews and guarantees that the boot screen is removed as
  // soon as React commits its first render.
  const nativeBootScreen = document.getElementById("native-boot-screen");
  const appMountObserver = new MutationObserver(() => {
    const bootStillPresent = document.getElementById("native-boot-screen");
    const firstChild = rootElement.firstElementChild;
    if (!bootStillPresent && firstChild) {
      appMountObserver.disconnect();
      window.dispatchEvent(new Event("ustv:app-mounted"));
    }
  });

  if (nativeBootScreen) {
    appMountObserver.observe(rootElement, { childList: true, subtree: true });
  } else if (rootElement.firstElementChild) {
    window.dispatchEvent(new Event("ustv:app-mounted"));
  }
} catch (error) {
  showBootError(error);
}
