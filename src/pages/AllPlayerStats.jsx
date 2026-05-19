import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import PlayerStatsModal from "../components/stats/PlayerStatsModal";
import LoadingSpinner from "../components/common/LoadingSpinner";

const url = import.meta.env.VITE_BASE_URL;

export default function AllPlayerStats() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [playersRes, teamsRes] = await Promise.all([
          axios.get(`${url}/player`),
          axios.get(`${url}/team`)
        ]);
        
        if (mounted) {
          setPlayers(playersRes.data);
          setTeams(teamsRes.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (mounted) setError("Failed to load players and teams data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchData();
    
    return () => { mounted = false; };
  }, []);

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTeam = true;
      if (selectedTeamId) {
        matchesTeam = player.playerRequests?.some(
          req => req.teamId?.toString() === selectedTeamId.toString() && (req.status === "ACCEPTED" || req.status === "APPROVED")
        );
      }
      
      return matchesSearch && matchesTeam;
    });
  }, [players, searchQuery, selectedTeamId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8 min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-50 mt-16 lg:mt-0">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Player Stats</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search players by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="sm:w-64">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors bg-white"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
            <p className="text-gray-500">No players found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredPlayers.map(player => (
              <div 
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg hover:border-red-300 transition-all cursor-pointer flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-gray-100 group-hover:border-red-500 transition-colors bg-gray-100 flex items-center justify-center">
                  {player.profilePhotoUrl ? (
                    <img 
                      src={player.profilePhotoUrl} 
                      alt={player.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-400">
                      {player.name ? player.name.charAt(0).toUpperCase() : "P"}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-800 text-lg line-clamp-1 w-full">{player.name}</h3>
                <div className="text-sm text-gray-500 mt-1 flex flex-col items-center w-full">
                  {player.playerRole && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 mb-1 max-w-full truncate">
                      {player.playerRole.replace(/_/g, " ")}
                    </span>
                  )}
                  {player.jerseyNumber && (
                    <span className="text-red-600 font-semibold text-xs mt-1">
                      Jersey #{player.jerseyNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PlayerStatsModal 
        playerId={selectedPlayer?.id}
        playerName={selectedPlayer?.name}
        open={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
}
