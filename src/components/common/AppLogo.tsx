import React from "react";

export type AppLogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface AppLogoProps {
  size?: AppLogoSize;
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

const SIZE_CONFIGS: Record<AppLogoSize, { container: string; iconSize: number; titleClass: string; subClass: string }> = {
  xs: {
    container: "w-6 h-6 rounded-lg",
    iconSize: 14,
    titleClass: "text-[11px]",
    subClass: "text-[8px]"
  },
  sm: {
    container: "w-9 h-9 rounded-xl",
    iconSize: 20,
    titleClass: "text-sm",
    subClass: "text-[9px]"
  },
  md: {
    container: "w-11 h-11 rounded-2xl",
    iconSize: 24,
    titleClass: "text-base",
    subClass: "text-[10px]"
  },
  lg: {
    container: "w-14 h-14 rounded-2xl",
    iconSize: 32,
    titleClass: "text-lg",
    subClass: "text-xs"
  },
  xl: {
    container: "w-20 h-20 rounded-3xl",
    iconSize: 44,
    titleClass: "text-2xl",
    subClass: "text-sm"
  },
  "2xl": {
    container: "w-28 h-28 rounded-[32px]",
    iconSize: 62,
    titleClass: "text-3xl",
    subClass: "text-base"
  }
};

export const AppLogo: React.FC<AppLogoProps> = ({
  size = "md",
  showText = false,
  animated = false,
  className = ""
}) => {
  const config = SIZE_CONFIGS[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Visual Logo Emblem */}
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/40 shrink-0 ${config.container} ${
          animated ? "animate-pulse" : ""
        }`}
      >
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-cyan-400/20 rounded-inherit blur-sm pointer-events-none" />

        {/* Custom High-Definition Smart TV + Wireless Remote Emblem SVG */}
        <svg
          width={config.iconSize}
          height={config.iconSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-md"
        >
          {/* Outer Smart TV Screen Bezel */}
          <rect
            x="4"
            y="6"
            width="40"
            height="26"
            rx="4"
            className="fill-zinc-950/80 stroke-white"
            strokeWidth="2.5"
          />

          {/* TV Display Inner Glow Glass */}
          <rect
            x="7"
            y="9"
            width="34"
            height="20"
            rx="2"
            fill="url(#tvScreenGradient)"
            opacity="0.9"
          />

          {/* TV Display Stand */}
          <path
            d="M20 32L17 40H31L28 32"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Stand Base Bar */}
          <line
            x1="14"
            y1="40"
            x2="34"
            y2="40"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Glowing Status LED indicator */}
          <circle cx="24" cy="30" r="1.5" fill="#34D399" />

          {/* Wireless Remote Beam Waves emanating from center */}
          <path
            d="M17 19C17 15.134 20.134 12 24 12C27.866 12 31 15.134 31 19"
            stroke="#67E8F9"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M20 19C20 16.7909 21.7909 15 24 15C26.2091 15 28 16.7909 28 19"
            stroke="#A5B4FC"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.95"
          />
          <circle cx="24" cy="19" r="2" fill="white" />

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="tvScreenGradient" x1="7" y1="9" x2="41" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#312E81" />
              <stop offset="0.5" stopColor="#1E1B4B" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>
          </defs>
        </svg>

        {/* Status Indicator Dot */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-zinc-950"></span>
        </span>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black text-white tracking-tight ${config.titleClass}`}>
              UNIVERSAL
            </span>
            <span className={`font-bold text-cyan-400 tracking-wider ${config.titleClass}`}>
              REMOTE
            </span>
          </div>
          <span className={`font-semibold text-indigo-300 uppercase tracking-widest mt-0.5 ${config.subClass}`}>
            Smart TV Controller
          </span>
        </div>
      )}
    </div>
  );
};
