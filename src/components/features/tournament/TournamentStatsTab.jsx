import { useState, useEffect } from "react";
import {
  Trophy,
  TrendingUp,
  Target,
  Award,
  Crown,
  Pencil,
  X,
  Check,
} from "lucide-react";
import LoadingSpinner from "../../common/LoadingSpinner";
import {
  getTournamentStats,
  getTopVotedPlayers,
  getTopStatPlayers,
  setManOfTournament,
  setManOfTournamentRanked,
} from "../../../api/statsApi";
import Cookies from "js-cookie";

export default function TournamentStatsTab({ tournamentId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // check admin
  const account = JSON.parse(Cookies.get("account") || "{}");
  const isAdmin = account?.role === "ADMIN";

  const loadStats = async () => {
    try {
      setLoading(true);
      setStats(await getTournamentStats(tournamentId));
    } catch {
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tournamentId) return;
    loadStats();
  }, [tournamentId]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  if (error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  if (!stats)
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700">No Stats Yet</h3>
      </div>
    );
  const motProps = {
    winners: stats.manOfTournament || [], // List<AwardDTO> → array of 3
    favouritePlayer: stats.favouritePlayer, // single AwardDTO
    tournamentId,
    isAdmin,
    onUpdated: loadStats,
  };

  console.log(stats);
  switch (stats.sport.toLowerCase()) {
    case "futsal":
      return <FutsalStats stats={stats} motProps={motProps} />;
    case "volleyball":
      return <VolleyballStats stats={stats} motProps={motProps} />;
    case "badminton":
      return <BadmintonStats stats={stats} motProps={motProps} />;
    case "table tennis":
    case "tabletennis":
      return <TableTennisStats stats={stats} motProps={motProps} />;
    case "ludo":
      return <LudoStats stats={stats} motProps={motProps} />;
    case "chess":
      return <ChessStats stats={stats} motProps={motProps} />;
    default:
      return <CricketStats stats={stats} motProps={motProps} />;
  }
}

// ── Cricket ──────────────────────────────────────────────────────
function CricketStats({ stats, motProps }) {
  return (
    <div className="space-y-6">
      <ManOfTournament {...motProps} />
      <FavouritePlayerCard {...motProps} />
      <div className="grid md:grid-cols-3 gap-4">
        <AwardCard
          title="Best Batsman"
          icon={<TrendingUp className="w-5 h-5" />}
          name={stats.bestBatsman?.playerName}
          detail={stats.bestBatsman?.reason}
        />
        <AwardCard
          title="Best Bowler"
          icon={<Target className="w-5 h-5" />}
          name={stats.bestBowler?.playerName}
          detail={stats.bestBowler?.reason}
        />
        <AwardCard
          title="Best Fielder"
          icon={<Award className="w-5 h-5" />}
          name={stats.bestFielder?.playerName}
          detail={stats.bestFielder?.reason}
        />
      </div>
      {stats.topRunScorers?.length > 0 && (
        <Leaderboard
          title="Top Batsmen"
          icon={<TrendingUp className="w-5 h-5" />}
          columns={["Runs", "Balls", "4s", "6s", "POM"]}
          rows={stats.topRunScorers.map((p) => ({
            name: p.playerName,
            cols: [
              p.runs,
              p.ballsFaced,
              p.fours,
              p.sixes,
              p.playerOfMatchCount || 0,
            ],
          }))}
        />
      )}
      {stats.topBowlers?.length > 0 && (
        <Leaderboard
          title="Top Bowlers"
          icon={<Target className="w-5 h-5" />}
          columns={["Wkts", "Runs", "Balls", "Eco", "POM"]}
          rows={stats.topBowlers.map((p) => ({
            name: p.playerName,
            cols: [
              p.wickets,
              p.runsConceded ?? 0,
              p.ballsBowled,
              p.economy != null ? Number(p.economy).toFixed(2) : "—",
              p.playerOfMatchCount || 0,
            ],
          }))}
        />
      )}
      <PomList awards={stats.allAwards} />
    </div>
  );
}

// ── Futsal ───────────────────────────────────────────────────────
function FutsalStats({ stats, motProps }) {
  return (
    <div className="space-y-6">
      <ManOfTournament {...motProps} />
      <FavouritePlayerCard {...motProps} />
      <div className="grid md:grid-cols-2 gap-4">
        <AwardCard
          title="Top Scorer"
          icon="⚽"
          name={stats.topScorer?.playerName}
          detail={stats.topScorer?.reason}
          color="emerald"
        />
        <AwardCard
          title="Top Assist"
          icon="🤝"
          name={stats.topAssist?.playerName}
          detail={stats.topAssist?.reason}
          color="blue"
        />
      </div>
      {stats.topGoalScorers?.length > 0 && (
        <Leaderboard
          title="Top Scorers"
          icon="⚽"
          accentColor="emerald"
          columns={["Goals", "Assists", "G+A", "🟨", "🟥"]}
          highlightCol={0}
          rows={stats.topGoalScorers.map((p) => ({
            name: p.playerName,
            cols: [
              p.goals,
              p.assists,
              (p.goals || 0) + (p.assists || 0),
              p.yellowCards || 0,
              p.redCards || 0,
            ],
          }))}
        />
      )}
      {stats.topAssisters?.length > 0 && (
        <Leaderboard
          title="Top Assisters"
          icon="🤝"
          accentColor="blue"
          columns={["Assists", "Goals", "G+A"]}
          highlightCol={0}
          rows={stats.topAssisters.map((p) => ({
            name: p.playerName,
            cols: [p.assists, p.goals, (p.goals || 0) + (p.assists || 0)],
          }))}
        />
      )}
      <PomList awards={stats.allAwards} />
    </div>
  );
}

// ── Volleyball ───────────────────────────────────────────────────
function VolleyballStats({ stats, motProps }) {
  return (
    <div className="space-y-6">
      <ManOfTournament {...motProps} />
      <FavouritePlayerCard {...motProps} />
      <div className="grid md:grid-cols-2 gap-4">
        <AwardCard
          title="Top Scorer"
          icon="🏐"
          name={stats.topScorer?.playerName}
          detail={stats.topScorer?.reason}
          color="blue"
        />
        <AwardCard
          title="Best Server"
          icon="🎯"
          name={stats.topAssist?.playerName}
          detail={stats.topAssist?.reason}
          color="purple"
        />
      </div>
      {stats.topGoalScorers?.length > 0 && (
        <Leaderboard
          title="Top Point Scorers"
          icon="🏐"
          accentColor="blue"
          columns={["Points", "Aces", "Blocks"]}
          highlightCol={0}
          rows={stats.topGoalScorers.map((p) => ({
            name: p.playerName,
            cols: [p.goals, p.assists, p.futsalFouls || 0],
          }))}
        />
      )}
      <PomList awards={stats.allAwards} />
    </div>
  );
}

// ── Badminton ────────────────────────────────────────────────────
function BadmintonStats({ stats, motProps }) {
  return (
    <div className="space-y-6">
      <ManOfTournament {...motProps} />
      <FavouritePlayerCard {...motProps} />
      <div className="grid md:grid-cols-2 gap-4">
        <AwardCard
          title="Top Scorer"
          icon="🏸"
          name={stats.topScorer?.playerName}
          detail={stats.topScorer?.reason}
          color="violet"
        />
        <AwardCard
          title="Top Attacker"
          icon="💥"
          name={stats.topAssist?.playerName}
          detail={stats.topAssist?.reason}
          color="orange"
        />
      </div>
      {stats.topGoalScorers?.length > 0 && (
        <Leaderboard
          title="Top Scorers"
          icon="🏸"
          accentColor="violet"
          columns={["Points", "Smashes+Aces", "Faults"]}
          highlightCol={0}
          rows={stats.topGoalScorers.map((p) => ({
            name: p.playerName,
            cols: [p.goals, p.assists, p.futsalFouls || 0],
          }))}
        />
      )}
      <PomList awards={stats.allAwards} />
    </div>
  );
}

// ── Table Tennis ─────────────────────────────────────────────────
function TableTennisStats({ stats, motProps }) {
  return (
    <div className="space-y-6">
      <ManOfTournament {...motProps} />
      <FavouritePlayerCard {...motProps} />
      <div className="grid md:grid-cols-2 gap-4">
        <AwardCard
          title="Top Scorer"
          icon="🏓"
          name={stats.topScorer?.playerName}
          detail={stats.topScorer?.reason}
          color="blue"
        />
        <AwardCard
          title="Top Attacker"
          icon="💥"
          name={stats.topAssist?.playerName}
          detail={stats.topAssist?.reason}
          color="orange"
        />
      </div>
      {stats.topGoalScorers?.length > 0 && (
        <Leaderboard
          title="Top Scorers"
          icon="🏓"
          accentColor="blue"
          columns={["Points", "Smashes+Aces", "Faults"]}
          highlightCol={0}
          rows={stats.topGoalScorers.map((p) => ({
            name: p.playerName,
            cols: [p.goals, p.assists, p.futsalFouls || 0],
          }))}
        />
      )}
      <PomList awards={stats.allAwards} />
    </div>
  );
}

// ── Ludo ─────────────────────────────────────────────────────────
function LudoStats({ stats, motProps }) {
  return (
    <div className="space-y-6">
      <ManOfTournament {...motProps} />
      <FavouritePlayerCard {...motProps} />
      <div className="grid md:grid-cols-2 gap-4">
        <AwardCard
          title="Top Home Runs"
          icon="🏠"
          name={stats.topScorer?.playerName}
          detail={stats.topScorer?.reason}
          color="amber"
        />
        <AwardCard
          title="Top Captures"
          icon="⚔️"
          name={stats.topAssist?.playerName}
          detail={stats.topAssist?.reason}
          color="red"
        />
      </div>
      {stats.topGoalScorers?.length > 0 && (
        <Leaderboard
          title="Top Players"
          icon="🎲"
          accentColor="amber"
          columns={["Home Runs", "Captures"]}
          highlightCol={0}
          rows={stats.topGoalScorers.map((p) => ({
            name: p.playerName,
            cols: [p.goals, p.assists],
          }))}
        />
      )}
      <PomList awards={stats.allAwards} />
    </div>
  );
}

// ── Chess ─────────────────────────────────────────────────────────
function ChessStats({ stats, motProps }) {
  return (
    <div className="space-y-6">
      <ManOfTournament {...motProps} color="slate" />
      <FavouritePlayerCard {...motProps} />
      <div className="grid md:grid-cols-2 gap-4">
        <AwardCard
          title="Most Wins"
          icon="👑"
          name={stats.topScorer?.playerName}
          detail={stats.topScorer?.reason}
          color="slate"
        />
        <AwardCard
          title="Most Checks"
          icon="⚔️"
          name={stats.topAssist?.playerName}
          detail={stats.topAssist?.reason}
          color="gray"
        />
      </div>
      {stats.topGoalScorers?.length > 0 && (
        <Leaderboard
          title="Leaderboard"
          icon="♟️"
          accentColor="slate"
          columns={["Wins", "Checks", "POM"]}
          highlightCol={0}
          rows={stats.topGoalScorers.map((p) => ({
            name: p.playerName,
            cols: [p.goals, p.assists, p.playerOfMatchCount || 0],
          }))}
        />
      )}
      <PomList awards={stats.allAwards} />
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────

function ManOfTournament({ winners, tournamentId, isAdmin, onUpdated }) {
  const [editingRank, setEditingRank] = useState(null); // 1, 2, or 3
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const slots = [winners[0] || null, winners[1] || null, winners[2] || null];
  const medals = ["🥇", "🥈", "🥉"];

  const openEdit = async (rank) => {
    setEditingRank(rank);
    setErr("");
    setSelectedId(null);
    setLoadingCandidates(true);
    try {
      const data = await getTopStatPlayers(tournamentId);
      // Dedup by playerId in case backend still has duplicates
      const unique = data.filter(
        (c, idx, arr) =>
          arr.findIndex((x) => x.playerId === c.playerId) === idx,
      );
      setCandidates(unique);
    } catch {
      setErr("Players load nahi hue");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await setManOfTournamentRanked(tournamentId, selectedId, editingRank);
      setEditingRank(null);
      onUpdated();
    } catch {
      setErr("Save nahi hua, dobara try karo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-8 h-8" />
          <h3 className="text-lg font-semibold">Men of the Tournament</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">
            {slots[0]?.playerName || "TBD"}
          </div>
          {isAdmin && (
            <button
              onClick={() => openEdit(1)}
              className="bg-white/20 hover:bg-white/30 transition rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-sm font-semibold"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingRank && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Select Man of Tournament
              </h3>
              <button
                onClick={() => setEditingRank(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {err && (
              <p className="text-red-500 text-sm mb-3 bg-red-50 rounded-lg p-2 text-center">
                {err}
              </p>
            )}
            {loadingCandidates ? (
              <div className="text-center py-6 text-gray-500">
                Loading players...
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                Koi votes nahi mile
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {candidates.map((c, i) => {
                  const isSelected = selectedId === c.playerId;
                  return (
                    <div
                      key={c.playerId}
                      onClick={() => setSelectedId(c.playerId)}
                      className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-yellow-50 border-yellow-500 ring-2 ring-yellow-300"
                          : "bg-gray-100 border-gray-200 hover:bg-yellow-50 hover:border-yellow-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-yellow-500 bg-yellow-500" : "border-gray-400"}`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-xl">{medals[i]}</span>
                      <span className="font-semibold text-gray-800">
                        {c.playerName || `Player #${c.playerId}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              disabled={!selectedId || saving}
              onClick={handleSave}
              className="w-full bg-yellow-500 text-white py-3 rounded-xl font-bold hover:bg-yellow-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Check className="w-5 h-5" /> Confirm & Save
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
function FavouritePlayerCard({
  favouritePlayer,
  tournamentId,
  isAdmin,
  onUpdated,
}) {
  const [editing, setEditing] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const openEdit = async () => {
    setEditing(true);
    setErr("");
    setSelectedId(null);
    setLoadingCandidates(true);
    try {
      setCandidates(await getTopVotedPlayers(tournamentId));
    } catch {
      setErr("Players load nahi hue");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await setManOfTournament(tournamentId, selectedId); // existing API — fan vote winner
      setEditing(false);
      onUpdated();
    } catch {
      setErr("Save nahi hua");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <h3 className="text-lg font-semibold">
              Favourite Player of Tournament
            </h3>
          </div>
          {isAdmin && (
            <button
              onClick={openEdit}
              className="bg-white/20 hover:bg-white/30 transition rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-sm font-semibold"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
        <div className="text-3xl font-bold">
          {favouritePlayer?.playerName || "TBD"}
        </div>
        {favouritePlayer?.reason && (
          <p className="text-white/70 text-sm mt-1">{favouritePlayer.reason}</p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Favourite Player Select Karo
              </h3>
              <button
                onClick={() => setEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {err && (
              <p className="text-red-500 text-sm mb-3 bg-red-50 rounded-lg p-2 text-center">
                {err}
              </p>
            )}
            {loadingCandidates ? (
              <div className="text-center py-6 text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-2 mb-4">
                {candidates.map((c, i) => {
                  const isSelected = selectedId === c.playerId;
                  return (
                    <div
                      key={c.playerId}
                      onClick={() => setSelectedId(c.playerId)}
                      className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition-all ${isSelected ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300" : "bg-gray-100 border-gray-200 hover:bg-indigo-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-400"}`}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="font-semibold text-gray-800">
                          {c.playerName}
                        </span>
                        <span className="text-xs text-gray-400">#{i + 1}</span>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-100 rounded-full px-2 py-0.5">
                        {c.votes} votes
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              disabled={!selectedId || saving}
              onClick={handleSave}
              className="w-full bg-indigo-500 text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Check className="w-5 h-5" /> Confirm & Save
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function AwardCard({ title, icon, name, detail, color = "red" }) {
  const colors = {
    red: "text-red-500",
    emerald: "text-emerald-500",
    blue: "text-blue-500",
    purple: "text-purple-500",
    violet: "text-violet-500",
    orange: "text-orange-500",
    amber: "text-amber-500",
    slate: "text-slate-600",
    gray: "text-gray-500",
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div
        className={`flex items-center gap-2 ${colors[color] || "text-red-500"} mb-3`}
      >
        {typeof icon === "string" ? (
          <span className="text-xl">{icon}</span>
        ) : (
          icon
        )}
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="text-2xl font-bold text-gray-800">{name || "TBD"}</div>
      {detail && <div className="text-gray-500 text-sm mt-1">{detail}</div>}
    </div>
  );
}

function Leaderboard({
  title,
  icon,
  columns,
  rows,
  accentColor = "red",
  highlightCol = 0,
}) {
  const g = {
    red: "from-red-500 to-red-600",
    emerald: "from-emerald-500 to-emerald-600",
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    violet: "from-violet-500 to-violet-600",
    orange: "from-orange-500 to-orange-600",
    amber: "from-amber-500 to-amber-600",
    slate: "from-slate-600 to-slate-700",
    gray: "from-gray-500 to-gray-600",
  };
  const t = {
    red: "text-red-500",
    emerald: "text-emerald-500",
    blue: "text-blue-500",
    purple: "text-purple-500",
    violet: "text-violet-500",
    orange: "text-orange-500",
    amber: "text-amber-500",
    slate: "text-slate-600",
    gray: "text-gray-500",
  };
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div
        className={`bg-gradient-to-r ${g[accentColor] || g.red} text-white px-6 py-4`}
      >
        <h3 className="text-lg font-bold flex items-center gap-2">
          {typeof icon === "string" ? <span>{icon}</span> : icon} {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: 360 }}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Player
              </th>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <RankBadge rank={i + 1} />
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800 text-sm">
                  {row.name}
                </td>
                {row.cols.map((v, j) => (
                  <td
                    key={j}
                    className={`px-4 py-3 text-center text-sm ${j === highlightCol ? `font-bold ${t[accentColor] || t.red}` : "text-gray-600"}`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PomList({ awards }) {
  if (!awards?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5" /> Player of the Match Awards
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {awards.map((a, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-3">
            <span className="font-semibold text-gray-800">{a.playerName}</span>
            <span className="text-xs text-gray-400">{a.reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  const c =
    rank === 1
      ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white"
      : rank === 2
        ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
        : rank === 3
          ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white"
          : "bg-gray-200 text-gray-700";
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${c}`}
    >
      {rank}
    </div>
  );
}
