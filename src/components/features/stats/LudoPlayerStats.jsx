import { Trophy } from "lucide-react";

// Ludo stats mapping: goals=homeRuns, assists=captures

export default function LudoPlayerStats({ stats }) {
  if (!stats) return null;
  return (
    <>
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {stats.playerName?.charAt(0) || "P"}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{stats.playerName}</h2>
            <p className="text-amber-100">🎲 Ludo Player</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat icon={<Trophy className="w-8 h-8 text-amber-500"/>} value={stats.ludoMatchesPlayed ?? stats.matchesPlayed ?? 0} label="Matches" />
        <QuickStat icon={<span className="text-3xl">🏠</span>} value={stats.goals || 0} label="Home Runs" />
        <QuickStat icon={<span className="text-3xl">⚔️</span>} value={stats.assists || 0} label="Captures" />
        <QuickStat icon={<Trophy className="w-8 h-8 text-yellow-500"/>} value={stats.pomCount || 0} label="Man of Match" />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><span className="text-xl">🎲</span> Performance</h3>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <StatItem label="Home Runs" value={stats.goals   || 0} highlight />
          <StatItem label="Captures"  value={stats.assists || 0} />
        </div>
      </div>
    </>
  );
}

function QuickStat({ icon, value, label }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
function StatItem({ label, value, highlight }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">{label}</span>
      <span className={`text-2xl font-bold ${highlight?"text-amber-600":"text-gray-800"}`}>{value}</span>
    </div>
  );
}
