import { useEffect } from "react";

/** Auto-dismiss duration in milliseconds */
const AUTO_MS = 2500;

/**
 * Maps color keys to Tailwind border + shadow classes.
 * Using explicit class names so Tailwind v4 can detect them statically.
 */
const COLOR_CLASSES = {
  gold:  "border-yellow-400 shadow-yellow-400/30",
  red:   "border-red-500   shadow-red-500/30",
  blue:  "border-blue-500  shadow-blue-500/30",
  green: "border-green-500 shadow-green-500/30",
};

/**
 * Auto-dismissing milestone popup.
 *
 * - Render it conditionally: `{milestone && <MilestonePopup ... />}`
 * - It calls `onDismiss` after AUTO_MS milliseconds automatically.
 * - pointer-events-none so it never blocks scoring buttons underneath.
 *
 * @param {Object}   props.milestone  - { title, subtitle, emoji, color }
 * @param {Function} props.onDismiss  - called when the timer expires
 */
export default function MilestonePopup({ milestone, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_MS);
    return () => clearTimeout(t);
  }, [onDismiss, milestone]);

  if (!milestone) return null;

  const borderClass = COLOR_CLASSES[milestone.color] ?? COLOR_CLASSES.gold;

  return (
    <div
      className={[
        "fixed top-4 left-1/2 -translate-x-1/2 z-[9999]",
        "bg-gray-900 border-l-4",
        borderClass,
        "rounded-xl px-6 py-4 shadow-2xl",
        "min-w-[260px] max-w-[90vw] text-center",
        "animate-milestone-in",
        "pointer-events-none",
      ].join(" ")}
    >
      <div className="text-5xl mb-2 leading-none">{milestone.emoji}</div>
      <div className="text-white font-black text-xl tracking-tight leading-snug">
        {milestone.title}
      </div>
      {milestone.subtitle && (
        <div className="text-gray-400 text-sm mt-1 font-medium">
          {milestone.subtitle}
        </div>
      )}
    </div>
  );
}
