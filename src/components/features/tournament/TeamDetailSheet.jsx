import { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";
const BASE = import.meta.env.VITE_BASE_URL;

export default function TeamDetailSheet({ team, tournamentId, sportId, onClose }) {
  const [activeTab, setActiveTab] = useState("players");
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [playersRes, statsRes] = await Promise.all([
          axios.get(`${BASE}/team/${team.id}/players`),
          axios.get(`${BASE}/team/${team.id}/stats`)
        ]);
        setPlayers(playersRes.data || []);
        setStats(statsRes.data || null);
      } catch (err) {
        console.error("Error fetching team details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [team.id]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" 
           onClick={onClose} />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white 
                      rounded-t-2xl z-50 max-h-[80vh] 
                      flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 
                        border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {team.name}
            </h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              team.status === "APPROVED" 
                ? "bg-green-100 text-green-700"
                : team.status === "REJECTED"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
            }`}>
              {team.status}
            </span>
          </div>
          <button onClick={onClose} 
                  className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 px-4 pt-3">
          {["players", "stats"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold 
                          transition ${
                activeTab === t
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}>
              {t === "players" ? "👥 Players" : "📊 Stats"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-2 
                              border-red-600 rounded-full 
                              border-t-transparent" />
            </div>
          ) : activeTab === "players" ? (
            <div className="space-y-2">
              {players.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  No approved players yet
                </p>
              ) : players.map(p => (
                <div key={p.id} 
                     className="flex items-center gap-3 
                                bg-gray-50 rounded-xl p-3 
                                border border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-red-100
                                  flex items-center justify-center
                                  font-bold text-red-600 text-sm">
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {p.isCreator ? "Captain" : "Player"}
                    </p>
                  </div>
                  {p.isCreator && (
                    <span className="text-xs bg-red-600 text-white 
                                     px-2 py-0.5 rounded-full font-bold">
                      C
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Match record */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  {label:"Played", val: stats?.matchesPlayed, color:"bg-blue-50 text-blue-700"},
                  {label:"Won", val: stats?.wins, color:"bg-green-50 text-green-700"},
                  {label:"Lost", val: stats?.losses, color:"bg-red-50 text-red-700"},
                  {label:"Draw", val: stats?.draws, color:"bg-yellow-50 text-yellow-700"},
                ].map(({label, val, color}) => (
                  <div key={label} 
                       className={`${color} rounded-xl p-2 text-center`}>
                    <p className="text-xl font-black">{val ?? 0}</p>
                    <p className="text-xs font-bold">{label}</p>
                  </div>
                ))}
              </div>

              {/* Sport-specific stats */}
              {(sportId == 1 || stats?.sport === "cricket") && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-gray-700 text-sm uppercase">
                    Cricket Stats
                  </h4>
                  {[
                    ["Total Runs", stats?.totalRunsScored],
                    ["Total Wickets", stats?.totalWicketsTaken],
                    ["Fours", stats?.totalFours],
                    ["Sixes", stats?.totalSixes],
                    ["Catches", stats?.totalCatches],
                    ["NRR", stats?.nrr?.toFixed(2)],
                  ].map(([label, val]) => (
                    <div key={label} 
                         className="flex justify-between 
                                    border-b border-gray-100 pb-1">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="font-bold text-sm">{val ?? 0}</span>
                    </div>
                  ))}
                </div>
              )}

              {(sportId == 2 || stats?.sport === "futsal") && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-gray-700 text-sm uppercase">
                    Futsal Stats
                  </h4>
                  {[
                    ["Goals", stats?.totalGoals],
                    ["Assists", stats?.totalAssists],
                    ["Goals For", stats?.goalsFor],
                    ["Goals Against", stats?.goalsAgainst],
                    ["Yellow Cards", stats?.totalYellowCards],
                    ["Red Cards", stats?.totalRedCards],
                  ].map(([label, val]) => (
                    <div key={label} 
                         className="flex justify-between 
                                    border-b border-gray-100 pb-1">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="font-bold text-sm">{val ?? 0}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Top performer */}
              {stats?.topScorerName && (
                <div className="bg-red-50 border border-red-100 
                                rounded-xl p-4">
                  <p className="text-xs font-bold text-red-600 
                                uppercase mb-1">⭐ Top Performer</p>
                  <p className="font-bold text-gray-800">
                    {stats.topScorerName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {stats.topScorerStat}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
