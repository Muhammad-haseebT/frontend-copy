import { Trophy, Users } from "lucide-react";

// Stats mapping for Tug of War (team sport — individual stats are limited):
// goals       = rounds won as part of team
// assists     = matches won
// futsalFouls = matches lost
// pomCount    = Player of Match awards

export default function TugOfWarPlayerStats({ stats }) {
  if (!stats) return null;

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {stats.playerName?.charAt(0) || "P"}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{stats.playerName}</h2>
            <p className="text-yellow-100">🪢 Tug of War Player</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          icon={<Users className="w-8 h-8 text-amber-600" />}
          value={stats.tugOfWarMatchesPlayed ?? stats.matchesPlayed ?? 0}
          label="Matches"
        />
        <QuickStat
          icon={<span className="text-3xl">🏆</span>}
          value={stats.assists || 0}
          label="Matches Won"
        />
        <QuickStat
          icon={<span className="text-3xl">🪢</span>}
          value={stats.goals || 0}
          label="Rounds Won"
        />
        <QuickStat
          icon={<Trophy className="w-8 h-8 text-amber-500" />}
          value={stats.pomCount || 0}
          label="Man of Match"
        />
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white px-6 py-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-xl">🪢</span> Performance
          </h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
          <StatItem
            label="Matches Played"
            value={stats.tugOfWarMatchesPlayed ?? stats.matchesPlayed ?? 0}
          />
          <StatItem label="Matches Won" value={stats.assists || 0} highlight />
          <StatItem label="Matches Lost" value={stats.futsalFouls || 0} warn />
          <StatItem label="Rounds Won" value={stats.goals || 0} highlight />
          <StatItem
            label="Win Rate"
            value={
              (stats.tugOfWarMatchesPlayed ?? stats.matchesPlayed ?? 0) > 0
                ? `${Math.round(
                    ((stats.assists || 0) /
                      (stats.tugOfWarMatchesPlayed ?? stats.matchesPlayed)) *
                      100,
                  )}%`
                : "—"
            }
          />
          <StatItem
            label="Man of Match"
            value={stats.pomCount || 0}
            highlight
          />
        </div>
      </div>

      {/* Note: team sport */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
        🪢 Tug of War is a team sport. Individual stats reflect participation
        and team outcomes. Switch sports using the selector above to view stats
        for other sports.
      </div>

      {/* Cross-sport note */}
      {(stats.cricketMatchesPlayed > 0 || stats.futsalMatchesPlayed > 0) && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
          This player also plays other sports. Use the sport selector to switch
          views.
        </div>
      )}
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
  const color = warn
    ? "text-orange-600"
    : highlight
      ? "text-amber-600"
      : "text-gray-800";
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}
