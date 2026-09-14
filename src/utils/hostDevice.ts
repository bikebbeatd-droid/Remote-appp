/**
 * Host Device Detection Utility
 * Determines the environment running the web remote application.
 * Note: Classification is used to tailor UI guidance and is not guaranteed 100% infallible.
 */

export type HostDeviceType =
  | "ANDROID_PHONE"
  | "ANDROID_TABLET"
  | "IPHONE"
  | "IPAD"
  | "SMART_TV_BROWSER"
  | "DESKTOP"
  | "LAPTOP"
  | "UNKNOWN";

export interface HostDeviceInfo {
  type: HostDeviceType;
  label: string;
  description: string;
  iconName: "smartphone" | "tablet" | "monitor" | "tv" | "laptop" | "help-circle";
  isTouchDevice: boolean;
  isMobileFormFactor: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  recommendedLayout: "mobile" | "tv" | "desktop";
  vibrationSupported: boolean;
}

export function detectHostDevice(): HostDeviceInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      type: "UNKNOWN",
      label: "Unknown Device",
      description: "Generic web environment. Universal remote controls enabled.",
      iconName: "help-circle",
      isTouchDevice: false,
      isMobileFormFactor: false,
      screenWidth: 1920,
      screenHeight: 1080,
      userAgent: "",
      recommendedLayout: "desktop",
      vibrationSupported: false,
    };
  }

  const ua = navigator.userAgent || "";
  const width = window.innerWidth || screen.width || 1024;
  const height = window.innerHeight || screen.height || 768;
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const hasVibrate = typeof navigator.vibrate === "function";

  const lowerUa = ua.toLowerCase();

  // 1. Detect Smart TV Browser
  const isTv =
    lowerUa.includes("smart-tv") ||
    lowerUa.includes("smarttv") ||
    lowerUa.includes("tizen") ||
    lowerUa.includes("webos") ||
    lowerUa.includes("hbbtv") ||
    lowerUa.includes("googletv") ||
    lowerUa.includes("android tv") ||
    lowerUa.includes("bravia") ||
    lowerUa.includes("vizio") ||
    lowerUa.includes("appletv") ||
    lowerUa.includes("roku") ||
    lowerUa.includes("netcast");

  if (isTv) {
    return {
      type: "SMART_TV_BROWSER",
      label: "Smart TV Browser (10-Foot UI)",
      description:
        "This device appears to be a Smart TV or set-top box. You can use this screen as a companion display or pair it with a phone.",
      iconName: "tv",
      isTouchDevice: hasTouch,
      isMobileFormFactor: false,
      screenWidth: width,
      screenHeight: height,
      userAgent: ua,
      recommendedLayout: "tv",
      vibrationSupported: false,
    };
  }

  // 2. Android Phone vs Tablet
  if (lowerUa.includes("android")) {
    if (minDim < 600 || (maxDim < 960 && hasTouch)) {
      return {
        type: "ANDROID_PHONE",
        label: "Android Smartphone",
        description:
          "Your phone is ideal for acting as a handheld remote controller with touch haptics and one-hand navigation.",
        iconName: "smartphone",
        isTouchDevice: true,
        isMobileFormFactor: true,
        screenWidth: width,
        screenHeight: height,
        userAgent: ua,
        recommendedLayout: "mobile",
        vibrationSupported: hasVibrate,
      };
    } else {
      return {
        type: "ANDROID_TABLET",
        label: "Android Tablet",
        description:
          "Tablet detected. Expanded remote layout and dual-column controls are enabled.",
        iconName: "tablet",
        isTouchDevice: true,
        isMobileFormFactor: false,
        screenWidth: width,
        screenHeight: height,
        userAgent: ua,
        recommendedLayout: "mobile",
        vibrationSupported: hasVibrate,
      };
    }
  }

  // 3. iOS (iPhone / iPad)
  if (lowerUa.includes("iphone") || lowerUa.includes("ipod")) {
    return {
      type: "IPHONE",
      label: "Apple iPhone",
      description:
        "iPhone detected. Handheld remote control and camera QR scanner are ready.",
      iconName: "smartphone",
      isTouchDevice: true,
      isMobileFormFactor: true,
      screenWidth: width,
      screenHeight: height,
      userAgent: ua,
      recommendedLayout: "mobile",
      vibrationSupported: hasVibrate,
    };
  }

  if (lowerUa.includes("ipad") || (lowerUa.includes("macintosh") && hasTouch)) {
    return {
      type: "IPAD",
      label: "Apple iPad",
      description:
        "iPad tablet detected. Expanded dashboard view enabled.",
      iconName: "tablet",
      isTouchDevice: true,
      isMobileFormFactor: false,
      screenWidth: width,
      screenHeight: height,
      userAgent: ua,
      recommendedLayout: "mobile",
      vibrationSupported: false,
    };
  }

  // 4. Laptop vs Desktop
  if (hasTouch && minDim > 600) {
    return {
      type: "LAPTOP",
      label: "Touchscreen Laptop / PC",
      description:
        "Touch-enabled PC detected. Supports mouse, keyboard shortcuts, and touch controls.",
      iconName: "laptop",
      isTouchDevice: true,
      isMobileFormFactor: false,
      screenWidth: width,
      screenHeight: height,
      userAgent: ua,
      recommendedLayout: "desktop",
      vibrationSupported: false,
    };
  }

  if (lowerUa.includes("windows") || lowerUa.includes("macintosh") || lowerUa.includes("linux")) {
    return {
      type: "DESKTOP",
      label: "Desktop Computer",
      description:
        "Desktop computer detected. You can control Smart TVs using keyboard hotkeys, trackpad, and mouse controls.",
      iconName: "monitor",
      isTouchDevice: false,
      isMobileFormFactor: false,
      screenWidth: width,
      screenHeight: height,
      userAgent: ua,
      recommendedLayout: "desktop",
      vibrationSupported: false,
    };
  }

  return {
    type: "UNKNOWN",
    label: "Web Browser Client",
    description: "Standard browser client. Full multi-protocol remote features available.",
    iconName: "help-circle",
    isTouchDevice: hasTouch,
    isMobileFormFactor: width < 768,
    screenWidth: width,
    screenHeight: height,
    userAgent: ua,
    recommendedLayout: width < 768 ? "mobile" : "desktop",
    vibrationSupported: hasVibrate,
  };
}
