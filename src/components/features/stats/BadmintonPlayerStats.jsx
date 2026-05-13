import { Trophy, ShieldAlert } from "lucide-react";

// Badminton Stats mapping:
// goals       = total points scored
// assists     = smashes + service aces (attacking shots)
// futsalFouls = faults (net/foot)
// yellowCards = "out" shots (forced shuttle out)

export default function BadmintonPlayerStats({ stats }) {
  if (!stats) return null;

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {stats.playerName?.charAt(0) || "P"}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{stats.playerName}</h2>
            <p className="text-violet-100">🏸 Badminton Player</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat icon={<Trophy className="w-8 h-8 text-violet-500" />}
          value={stats.matchesPlayed ?? 0} label="Matches" />
        <QuickStat icon={<span className="text-3xl">🏸</span>}
          value={stats.goals || 0} label="Points" />
        <QuickStat icon={<span className="text-3xl">💥</span>}
          value={stats.assists || 0} label="Smashes+Aces" />
        <QuickStat icon={<Trophy className="w-8 h-8 text-amber-500" />}
          value={stats.pomCount || 0} label="Man of Match" />
      </div>

      {/* Performance */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-violet-500 to-violet-600 text-white px-6 py-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-xl">🏸</span> Performance
          </h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
          <StatItem label="Points Scored"  value={stats.goals   || 0} highlight />
          <StatItem label="Smashes + Aces" value={stats.assists || 0} />
        </div>
      </div>

      {/* Faults */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Faults
          </h3>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <StatItem label="Faults (Net/Foot)" value={stats.futsalFouls || 0} warn />
          <StatItem label="Out Shots"          value={stats.yellowCards || 0} />
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

function StatItem({ label, value, highlight, warn }) {
  const color = warn ? "text-orange-600" : highlight ? "text-violet-600" : "text-gray-800";
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}
