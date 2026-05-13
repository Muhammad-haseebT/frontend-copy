import React from 'react';

// ─── HELPERS ─────────────────────────────────────────────────────
export function PanelWrapper({ children }) {
  return <div className="mt-2 mb-2 px-4">{children}</div>;
}

export function PanelHeading({ title }) {
  return (
    <h1 className="text-2xl font-semibold text-red-600 mt-2 mb-4">{title}</h1>
  );
}

// ─── WIZARD HEADER ────────────────────────────────────────────────
export function WizardHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-red-600 bg-white px-3 py-1.5 rounded-lg shadow-sm">
        {title}
      </h2>
      <button
        className="text-white font-semibold text-sm border-2 border-white/40 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
        onClick={onClose}
      >
        ✕ Close
      </button>
    </div>
  );
}

// ─── SCORE CIRCLES ───────────────────────────────────────────────
// Replaces GameCircles, SetCircles, RoundCircles
export function ScoreCircles({ won, toWin, color, size = "md", showCheckmark = false }) {
  const isSm = size === "sm";
  const isLg = size === "lg";
  const sizeClass = isSm ? "w-3.5 h-3.5" : isLg ? "w-6 h-6" : "w-4 h-4";
  const borderClass = isLg ? "border-2" : "border";
  const gapClass = isSm ? "gap-1" : isLg ? "gap-2" : "gap-1.5";
  
  return (
    <div className={`flex items-center ${gapClass}`}>
      {Array.from({ length: toWin }).map((_, i) => {
        const isWon = i < won;
        let colorClass = "bg-gray-200 border-gray-300";
        if (isWon) {
          if (color === "blue") {
            colorClass = isLg ? "bg-blue-500 border-blue-600 shadow-lg shadow-blue-500/50 scale-110" : "bg-blue-500 border-transparent shadow-md scale-110";
          } else {
            colorClass = isLg ? "bg-rose-500 border-rose-600 shadow-lg shadow-rose-500/50 scale-110" : "bg-rose-500 border-transparent shadow-md scale-110";
          }
        }
        return (
          <div
            key={i}
            className={`${sizeClass} rounded-full ${borderClass} transition-all duration-500 flex items-center justify-center ${colorClass}`}
          >
            {showCheckmark && isWon && <span className="text-white text-xs font-black">✓</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── UI CLASSES ──────────────────────────────────────────────────
export const UI_CLASSES = {
  selectCls: "w-full p-3 rounded-lg text-xl sm:text-2xl bg-white text-red-600 font-bold border border-red-200 shadow-sm",
  primaryBtn: "w-full bg-white text-red-600 p-3 rounded-lg text-2xl sm:text-3xl font-black shadow-md flex items-center justify-center active:bg-gray-200 transition-colors border border-red-200",
  confirmBtn: "w-full bg-emerald-500 text-white p-3 rounded-lg text-2xl sm:text-3xl font-black shadow-md flex items-center justify-center active:bg-emerald-400 transition-colors disabled:opacity-50",
  backBtn: "w-full bg-gray-100 text-gray-700 p-3 rounded-lg text-xl font-bold shadow-sm flex items-center justify-center active:bg-gray-200 transition-colors border border-gray-300",
};
