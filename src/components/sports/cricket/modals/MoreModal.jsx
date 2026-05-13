import { useState } from "react";
import { X, AlertTriangle, CloudRain, Zap } from "lucide-react";

/**
 * MORE Modal — Cricket admin options
 * Props:
 *  onClose()
 *  onPenalty(runs)      — sends penalty event via socket
 *  onDLS(newTarget)     — sends DLS revised target
 *  onSuperOver()        — triggers super over start
 *  isSuperOverPending   — true when backend sent comment="Super_Over"
 *  isSecondInnings      — only show DLS in 2nd innings
 */
export default function MoreModal({
  onClose,
  onPenalty,
  onDLS,
  onSuperOver,
  isSuperOverPending = false,
  isSecondInnings = false,
}) {
  const [view, setView] = useState("menu"); // "menu" | "penalty" | "dls"
  const [penaltyRuns, setPenaltyRuns] = useState(5);
  const [dlsTarget, setDlsTarget] = useState("");

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-red-600">
            {view === "menu"
              ? "More Options"
              : view === "penalty"
                ? "Penalty Runs"
                : "DLS Method"}
          </h2>
          <button
            onClick={view === "menu" ? onClose : () => setView("menu")}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        {/* ── MENU ── */}
        {view === "menu" && (
          <div className="space-y-3">
            <MoreOption
              icon={<AlertTriangle size={22} className="text-orange-500" />}
              title="Penalty Runs"
              desc="Add penalty runs to the batting team's score"
              onClick={() => setView("penalty")}
              color="orange"
            />

            {/* DLS only makes sense in 2nd innings */}
            {isSecondInnings && (
              <MoreOption
                icon={<CloudRain size={22} className="text-blue-500" />}
                title="DLS Method"
                desc="Set a revised DLS target (rain / interruption)"
                onClick={() => setView("dls")}
                color="blue"
              />
            )}

            {/* Super Over — only show when backend detected a tie */}
            {isSuperOverPending && (
              <MoreOption
                icon={<Zap size={22} className="text-yellow-500" />}
                title="Start Super Over"
                desc="Match tied! Click to begin the super over"
                onClick={() => {
                  onSuperOver();
                  onClose();
                }}
                color="yellow"
                highlight
              />
            )}
          </div>
        )}

        {/* ── PENALTY ── */}
        {view === "penalty" && (
          <div>
            <p className="text-gray-500 text-sm mb-4">
              Select or enter the number of penalty runs to add to the batting
              team's score. No ball will be counted.
            </p>

            <div className="grid grid-cols-5 gap-2 mb-5">
              {[1, 2, 3, 5, 10].map((r) => (
                <button
                  key={r}
                  onClick={() => setPenaltyRuns(r)}
                  className={`h-14 rounded-xl font-bold text-xl transition-all ${
                    penaltyRuns === r
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm text-gray-500">Custom:</span>
              <input
                type="number"
                min={1}
                max={50}
                value={penaltyRuns}
                onChange={(e) => setPenaltyRuns(Number(e.target.value))}
                className="border-2 border-gray-200 rounded-xl p-2 w-24 text-center text-xl font-bold focus:outline-none focus:border-red-400"
              />
            </div>

            <button
              onClick={() => {
                onPenalty(penaltyRuns);
                onClose();
              }}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold text-lg active:scale-95 transition-transform"
            >
              + {penaltyRuns} Penalty Run{penaltyRuns !== 1 ? "s" : ""}
            </button>
          </div>
        )}

        {/* ── DLS ── */}
        {view === "dls" && (
          <div>
            <p className="text-gray-500 text-sm mb-4">
              Enter the new DLS revised target. The required run rate will
              automatically recalculate.
            </p>

            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Revised Target (runs)
              </label>
              <input
                type="number"
                min={1}
                value={dlsTarget}
                onChange={(e) => setDlsTarget(e.target.value)}
                placeholder="e.g. 145"
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-2xl font-bold text-center focus:outline-none focus:border-blue-400"
              />
            </div>

            <button
              onClick={() => {
                if (!dlsTarget || Number(dlsTarget) <= 0) return;
                onDLS(Number(dlsTarget));
                onClose();
              }}
              disabled={!dlsTarget || Number(dlsTarget) <= 0}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-lg disabled:opacity-40 active:scale-95 transition-transform"
            >
              Set DLS Target: {dlsTarget || "—"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────
function MoreOption({ icon, title, desc, onClick, color, highlight }) {
  const border = {
    orange: "border-orange-200 hover:border-orange-400",
    blue: "border-blue-200 hover:border-blue-400",
    yellow: "border-yellow-300 hover:border-yellow-500",
  };
  const bg = highlight ? "bg-yellow-50" : "bg-white";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 ${border[color]} ${bg} text-left transition-all active:scale-95`}
    >
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}
