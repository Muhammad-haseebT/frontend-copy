import { Trophy, TrendingUp, Award, Target } from "lucide-react";

export default function CricketPlayerStats({ stats }) {
  if (!stats) return null;

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
            {stats.playerName?.charAt(0) || "P"}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{stats.playerName}</h2>
            <p className="text-red-100 flex items-center gap-2">
              🏏 Cricket Player
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats — cricketMatchesPlayed */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <Trophy className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">
            {stats.cricketMatchesPlayed ?? stats.matchesPlayed ?? 0}
          </div>
          <div className="text-sm text-gray-600">Cricket Matches</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <TrendingUp className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">
            {stats.totalRuns || 0}
          </div>
          <div className="text-sm text-gray-600">Runs</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <Target className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">
            {stats.wickets || 0}
          </div>
          <div className="text-sm text-gray-600">Wickets</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <Award className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">
            {stats.pomCount || 0}
          </div>
          <div className="text-sm text-gray-600">Man of Match</div>
        </div>
      </div>

      {/* Batting */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Batting Statistics
          </h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatItem label="Runs" value={stats.totalRuns || 0} highlight />
          <StatItem label="Balls Faced" value={stats.ballsFaced || 0} />
          <StatItem
            label="Strike Rate"
            value={stats.strikeRate?.toFixed?.(2) ?? stats.strikeRate ?? "0.00"}
          />
          <StatItem label="Highest" value={stats.highest || 0} />
          <StatItem label="Fours" value={stats.fours || 0} />
          <StatItem label="Sixes" value={stats.sixes || 0} />
          <StatItem label="Not Outs" value={stats.notOuts || 0} />
          <StatItem
            label="Average"
            value={stats.battingAvg?.toFixed?.(2) ?? "0.00"}
          />
        </div>
      </div>

      {/* Bowling */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Target className="w-5 h-5" /> Bowling Statistics
          </h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatItem label="Wickets" value={stats.wickets || 0} highlight />
          <StatItem label="Balls Bowled" value={stats.ballsBowled || 0} />
          <StatItem label="Runs Conceded" value={stats.runsConceded || 0} />
          <StatItem
            label="Economy"
            value={stats.economy?.toFixed?.(2) ?? "0.00"}
          />
          <StatItem
            label="Average"
            value={stats.bowlingAverage?.toFixed?.(2) ?? "0.00"}
          />
        </div>
      </div>

      {/* Cross-sport note */}
      {stats.futsalMatchesPlayed > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700">
          ⚽ This player has also played{" "}
          <strong>{stats.futsalMatchesPlayed}</strong> futsal match
          {stats.futsalMatchesPlayed !== 1 ? "es" : ""}. Switch to Futsal in the
          sport selector to see those stats.
        </div>
      )}
    </>
  );
}

function StatItem({ label, value, highlight }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">{label}</span>
      <span
        className={`text-2xl font-bold ${highlight ? "text-red-500" : "text-gray-800"}`}
      >
        {value}
      </span>
    </div>
  );
}
