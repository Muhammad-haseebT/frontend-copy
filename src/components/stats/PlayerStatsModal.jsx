import { useState, useEffect } from "react";
import { Trophy, X } from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import CricketPlayerStats from "../../components/features/stats/CricketPlayerStats";
import FutsalPlayerStats from "../../components/features/stats/FutsalPlayerStats";
import VolleyballPlayerStats from "../../components/features/stats/VolleyballPlayerStats";
import BadmintonPlayerStats from "../../components/features/stats/BadmintonPlayerStats";
import TableTennisPlayerStats from "../../components/features/stats/TableTennisPlayerStats";
import LudoPlayerStats from "../../components/features/stats/LudoPlayerStats";
import ChessPlayerStats from "../../components/features/stats/ChessPlayerStats";
import HockeyPlayerStats from "../../components/features/stats/HockeyPlayerStats";
import {
  getPlayerStats,
  getPlayerTournamentStats,
  getTournamentNamesandIds,
} from "../../api/statsApi";

const SPORTS = [
  { key: "cricket", label: "Cricket", emoji: "🏏" },
  { key: "futsal", label: "Futsal", emoji: "⚽" },
  { key: "volleyball", label: "Volleyball", emoji: "🏐" },
  { key: "badminton", label: "Badminton", emoji: "🏸" },
  { key: "table tennis", label: "Table Tennis", emoji: "🏓" },
  { key: "ludo", label: "Ludo", emoji: "🎲" },
  { key: "chess", label: "Chess", emoji: "♟️" },
  { key: "hockey", label: "Hockey", emoji: "🏑" },
];

function StatsComponent({ activeSport, stats }) {
  const s = activeSport?.toLowerCase();
  if (s === "futsal") return <FutsalPlayerStats stats={stats} />;
  if (s === "volleyball") return <VolleyballPlayerStats stats={stats} />;
  if (s === "badminton") return <BadmintonPlayerStats stats={stats} />;
  if (s === "table tennis" || s === "tabletennis")
    return <TableTennisPlayerStats stats={stats} />;
  if (s === "ludo") return <LudoPlayerStats stats={stats} />;
  if (s === "chess") return <ChessPlayerStats stats={stats} />;
  if (s === "hockey") return <HockeyPlayerStats stats={stats} />;
  return <CricketPlayerStats stats={stats} />;
}

export default function PlayerStatsModal({ playerId, playerName, open, onClose }) {
  const [overallStats, setOverallStats] = useState(null);
  const [tournamentStats, setTournamentStats] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [loading, setLoading] = useState(true);
  const [tournamentLoading, setTournamentLoading] = useState(false);
  const [sportLoading, setSportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("overall");
  const [manualSport, setManualSport] = useState("cricket"); // Default sport

  useEffect(() => {
    if (!open || !playerId) return;

    let mounted = true;
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [statsRes, toursRes] = await Promise.all([
          getPlayerStats(playerId, "cricket"),
          getTournamentNamesandIds(),
        ]);
        if (mounted) {
          setOverallStats(statsRes);
          setTournaments(
            toursRes.map((item) => {
              const id = Object.keys(item)[0];
              return { id, name: item[id] };
            })
          );
        }
      } catch {
        if (mounted) setError("Failed to load player statistics");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      mounted = false;
    };
  }, [open, playerId]);

  const handleTournamentChange = async (tournamentId) => {
    if (!tournamentId) {
      setTournamentStats(null);
      setSelectedTournament("");
      return;
    }
    try {
      setTournamentLoading(true);
      setSelectedTournament(tournamentId);
      setTournamentStats(await getPlayerTournamentStats(playerId, tournamentId));
    } catch {
      setError("Failed to load tournament statistics");
    } finally {
      setTournamentLoading(false);
    }
  };

  const handleSportChange = async (sport) => {
    setManualSport(sport);
    if (activeView === "overall" && playerId) {
      try {
        setSportLoading(true);
        setOverallStats(await getPlayerStats(playerId, sport));
      } catch (err) {
        console.error(err);
      } finally {
        setSportLoading(false);
      }
    }
  };

  if (!open) return null;

  const stats = activeView === "overall" ? overallStats : tournamentStats;
  const activeSport = activeView === "overall" ? manualSport : (stats?.sport?.toLowerCase() || "cricket");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-6">
      <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
        <div className="flex justify-between items-center p-4 bg-white border-b sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">{playerName}'s Stats</h2>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex gap-3 overflow-x-auto">
                  {[
                    ["overall", "Overall Stats"],
                    ["tournament", "By Tournament"],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setActiveView(v)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                        activeView === v
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {activeView === "overall" && overallStats && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">
                    Sport
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
                    {SPORTS.map(({ key, label, emoji }) => (
                      <button
                        key={key}
                        onClick={() => handleSportChange(key)}
                        disabled={sportLoading}
                        className={`px-3 py-2 rounded-full font-medium transition-all whitespace-nowrap border-2 flex items-center gap-1.5 flex-shrink-0 text-sm ${
                          manualSport === key
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-white text-gray-700 border-gray-200 hover:border-red-300"
                        } ${sportLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <span>{emoji}</span> {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeView === "tournament" && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Tournament
                  </label>
                  <select
                    value={selectedTournament}
                    onChange={(e) => handleTournamentChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none bg-white"
                  >
                    <option value="">Choose a tournament...</option>
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {tournamentStats?.sport && (
                    <p className="text-xs text-gray-400 mt-2">
                      Sport:{" "}
                      <span className="font-semibold capitalize">
                        {tournamentStats.sport}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {sportLoading && (
                <div className="flex justify-center items-center min-h-[200px]">
                  <LoadingSpinner size="medium" />
                </div>
              )}

              {tournamentLoading && (
                <div className="flex justify-center items-center min-h-[200px]">
                  <LoadingSpinner size="medium" />
                </div>
              )}

              {activeView === "tournament" && !selectedTournament && !tournamentLoading && (
                <div className="bg-white rounded-lg shadow-md p-6 md:p-12 text-center">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Select a Tournament
                  </h3>
                  <p className="text-gray-500">
                    Choose a tournament to view {playerName}'s stats
                  </p>
                </div>
              )}

              {stats && !tournamentLoading && !sportLoading && (
                <StatsComponent activeSport={activeSport} stats={stats} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
