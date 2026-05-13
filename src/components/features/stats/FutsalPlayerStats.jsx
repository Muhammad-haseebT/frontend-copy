import { Trophy, ShieldAlert } from "lucide-react";

export default function FutsalPlayerStats({ stats }) {
  if (!stats) return null;

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {stats.playerName?.charAt(0) || "P"}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{stats.playerName}</h2>
            <p className="text-emerald-100">⚽ Futsal Player</p>
          </div>
        </div>
      </div>

      {/* Quick Stats — futsalMatchesPlayed */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          icon={<Trophy className="w-8 h-8 text-emerald-500" />}
          value={stats.futsalMatchesPlayed ?? stats.matchesPlayed ?? 0}
          label="Futsal Matches"
        />
        <QuickStat
          icon={<span className="text-3xl">⚽</span>}
          value={stats.goals || 0}
          label="Goals"
        />
        <QuickStat
          icon={<span className="text-3xl">🤝</span>}
          value={stats.assists || 0}
          label="Assists"
        />
        <QuickStat
          icon={<Trophy className="w-8 h-8 text-amber-500" />}
          value={stats.pomCount || 0}
          label="Man of Match"
        />
      </div>

      {/* Scoring */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-xl">⚽</span> Scoring
          </h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
          <StatItem label="Goals" value={stats.goals || 0} highlight />
          <StatItem label="Assists" value={stats.assists || 0} />
          <StatItem
            label="G+A"
            value={(stats.goals || 0) + (stats.assists || 0)}
          />
        </div>
      </div>

      {/* Discipline */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Discipline
          </h3>
        </div>
        <div className="p-6 grid grid-cols-3 gap-6">
          <StatItem label="Fouls" value={stats.futsalFouls || 0} />
          <StatItem label="🟨 Yellows" value={stats.yellowCards || 0} warn />
          <StatItem label="🟥 Reds" value={stats.redCards || 0} danger />
        </div>
      </div>

      {/* Cross-sport note if player has cricket stats too */}
      {stats.cricketMatchesPlayed > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          🏏 This player has also played{" "}
          <strong>{stats.cricketMatchesPlayed}</strong> cricket match
          {stats.cricketMatchesPlayed !== 1 ? "es" : ""}. Switch to Cricket in
          the sport selector to see those stats.
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

function StatItem({ label, value, highlight, warn, danger }) {
  const color = danger
    ? "text-red-600"
    : warn
      ? "text-yellow-600"
      : highlight
        ? "text-emerald-600"
        : "text-gray-800";
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}
