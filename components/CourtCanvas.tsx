import type { ReactNode } from "react";

export function CourtCanvas({ children }: { children?: ReactNode }) {
  return (
    <svg viewBox="0 0 100 94" className="h-full min-h-[420px] w-full overflow-visible">
      <defs>
        <linearGradient id="courtFill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#0f1724" />
          <stop offset="100%" stopColor="#1c1411" />
        </linearGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="2" y="2" width="96" height="90" rx="2" fill="url(#courtFill)" stroke="rgba(242,210,165,0.45)" />
      <line x1="50" x2="50" y1="2" y2="92" stroke="rgba(242,210,165,0.24)" strokeWidth="0.4" />
      <circle cx="50" cy="47" r="11" fill="none" stroke="rgba(242,210,165,0.28)" strokeWidth="0.5" />
      <circle cx="50" cy="47" r="2" fill="none" stroke="rgba(242,210,165,0.34)" strokeWidth="0.4" />
      <path d="M 25 92 A 25 25 0 0 1 75 92" fill="none" stroke="rgba(242,210,165,0.36)" strokeWidth="0.55" />
      <path d="M 25 2 A 25 25 0 0 0 75 2" fill="none" stroke="rgba(242,210,165,0.36)" strokeWidth="0.55" />
      <rect x="38" y="70" width="24" height="22" fill="rgba(23,33,54,0.45)" stroke="rgba(242,210,165,0.28)" strokeWidth="0.45" />
      <rect x="38" y="2" width="24" height="22" fill="rgba(23,33,54,0.35)" stroke="rgba(242,210,165,0.2)" strokeWidth="0.45" />
      <circle cx="50" cy="70" r="8" fill="none" stroke="rgba(242,210,165,0.28)" strokeWidth="0.4" />
      <circle cx="50" cy="24" r="8" fill="none" stroke="rgba(242,210,165,0.18)" strokeWidth="0.4" />
      {children}
    </svg>
  );
}
