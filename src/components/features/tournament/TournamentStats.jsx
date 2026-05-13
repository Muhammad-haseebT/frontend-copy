import { useState, useEffect } from "react";
import { Trophy, Award, TrendingUp, Target, Crown } from "lucide-react";
import LoadingSpinner from "../../common/LoadingSpinner";
import {
  getTournamentStats,
  getTournamentNamesandIds,
} from "../../../api/statsApi";

export default function TournamentStats() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const response = await getTournamentNamesandIds();

        // Transform tournaments array from [{id: name}] to [{id, name}]
        const transformedTournaments = response.map((item) => {
          const id = Object.keys(item)[0];
          const name = item[id];
          return { id, name };
        });

        setTournaments(transformedTournaments);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
        setError("Failed to load tournaments");
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const handleTournamentChange = async (tournamentId) => {
    if (!tournamentId) {
      setStats(null);
      setSelectedTournament("");
      return;
    }

    try {
      setStatsLoading(true);
      setSelectedTournament(tournamentId);
      const tournamentStats = await getTournamentStats(tournamentId);
      setStats(tournamentStats);
    } catch (err) {
      console.error("Error fetching tournament stats:", err);
      setError("Failed to load tournament statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Tournament
        </label>
        <select
          value={selectedTournament}
          onChange={(e) => handleTournamentChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors bg-white"
        >
          <option value="">Choose a tournament...</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {statsLoading && (
        <div className="flex justify-center items-center min-h-[200px]">
          <LoadingSpinner size="medium" />
        </div>
      )}

      {/* No Tournament Selected */}
      {!selectedTournament && !statsLoading && (
        <div className="bg-white rounded-lg shadow-md p-6 md:p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Select a Tournament
          </h3>
          <p className="text-gray-500">
            Choose a tournament from the dropdown to view detailed statistics
          </p>
        </div>
      )}

      {/* Tournament Stats Display */}
      {stats && !statsLoading && (
        <>
          {/* Man of the Tournament Card */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8" />
              <h3 className="text-lg font-semibold">Man of the Tournament</h3>
            </div>
            <div className="text-3xl font-bold">
              {stats.manOfTournamentName}
            </div>
            <p className="text-yellow-100 mt-1">Outstanding Performance</p>
          </div>

          {/* Top Performers Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Best Batsman */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <div className="flex items-center gap-2 text-red-500 mb-3">
                <TrendingUp className="w-5 h-5" />
                <h4 className="font-semibold">Best Batsman</h4>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.bestBatsmanName}
              </div>
              <div className="text-gray-600 mt-1">
                {stats.bestBatsmanRuns} runs
              </div>
            </div>

            {/* Best Bowler */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <div className="flex items-center gap-2 text-red-500 mb-3">
                <Target className="w-5 h-5" />
                <h4 className="font-semibold">Best Bowler</h4>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.bestBowlerName}
              </div>
              <div className="text-gray-600 mt-1">
                {stats.bestBowlerWickets} wickets
              </div>
            </div>

            {/* Highest Scorer */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <div className="flex items-center gap-2 text-red-500 mb-3">
                <Award className="w-5 h-5" />
                <h4 className="font-semibold">Highest Score</h4>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.highestScorerName}
              </div>
              <div className="text-gray-600 mt-1">{stats.highestRuns} runs</div>
            </div>
          </div>

          {/* Top Batsmen Leaderboard */}
          {stats.topBatsmen && stats.topBatsmen.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top Batsmen
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Runs
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Balls
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        4s
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        6s
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        POM
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.topBatsmen.map((player, index) => (
                      <tr
                        key={player.playerId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <RankBadge rank={index + 1} />
                        </td>
                        <td className="px-4 py-4 font-semibold text-gray-800">
                          {player.playerName}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-red-500">
                          {player.runs}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-600">
                          {player.ballsFaced}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-600">
                          {player.fours}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-600">
                          {player.sixes}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                            {player.pomCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Bowlers Leaderboard */}
          {stats.topBowlers && stats.topBowlers.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Top Bowlers
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Wickets
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Runs
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Balls
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Economy
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        POM
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.topBowlers.map((player, index) => (
                      <tr
                        key={player.playerId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <RankBadge rank={index + 1} />
                        </td>
                        <td className="px-4 py-4 font-semibold text-gray-800">
                          {player.playerName}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-red-500">
                          {player.wickets}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-600">
                          {player.runsConceded}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-600">
                          {player.ballsBowled}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-600">
                          {player.economy?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                            {player.pomCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Rank Badge Component
function RankBadge({ rank }) {
  const getBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white";
      case 2:
        return "bg-gradient-to-br from-gray-300 to-gray-400 text-white";
      case 3:
        return "bg-gradient-to-br from-orange-400 to-orange-500 text-white";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getBadgeColor(
        rank,
      )}`}
    >
      {rank}
    </div>
  );
}
