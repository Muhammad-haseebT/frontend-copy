import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { Plus } from "lucide-react";
import Cookies from "js-cookie";
import {
  getTeamsByTournamentId,
  getMyTeamByTournamentIdAndAccountId,
  createTeam,
} from "../../../api/teamApi";
import { GetAllPlayers } from "../../../api/accountsApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../common/LoadingSpinner";
import { createPlayerRequest } from "../../../api/playerRequestApi";
import { createTeamRequest } from "../../../api/teamApi";

export const PlayerRow = ({ player }) => (
  <div className="bg-gray-100 rounded-xl p-3 flex items-center justify-between border border-red-600">
    <div className="font-medium">{player.name}</div>
    <div className="text-sm text-gray-700">{player.status}</div>
  </div>
);

export default function TournamentTeams({ tournamentId, onCreateTeam }) {
  const [tab, setTab] = useState("teams");
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [myTeam, setMyTeam] = useState(null);
  const [playerText, setPlayerText] = useState("");

  // Cache to prevent duplicate fetches
  const fetchedRef = useRef({
    teams: false,
    myTeam: false,
    players: false,
  });

  const filteredPlayers = useMemo(() => {
    const t = playerText.trim().toLowerCase();
    if (!t) return [];

    return (players || []).filter((p) => {
      const displayName = (p.name || "").toLowerCase();
      const displayUsername = (p.username || "").toLowerCase();

      const isAlreadyInTeam = (myTeam?.players || []).some(
        (teamPlayer) => teamPlayer.playerId === p.playerId,
      );

      const matchesSearch =
        displayName.includes(t) || displayUsername.includes(t);
      return matchesSearch && !isAlreadyInTeam;
    });
  }, [playerText, players, myTeam]);

  const selectedPlayer = useMemo(() => {
    const t = playerText.trim().toLowerCase();
    return (players || []).find((p) => {
      const displayName = p.name || "";
      const displayUsername = p.username || "";
      return `${displayName} (${displayUsername})`.toLowerCase() === t;
    });
  }, [playerText, players]);

  const selectedPlayerId = selectedPlayer?.playerId || selectedPlayer?.id || "";

  // Memoized fetch functions to prevent recreating on every render
  const fetchTeams = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchedRef.current.teams) return;

    try {
      fetchedRef.current.teams = true;
      const res = await getTeamsByTournamentId(tournamentId);
      setTeams(res ?? []);
    } catch (e) {
      console.error("Error fetching teams:", e);
      setTeams([]);
      fetchedRef.current.teams = false; // Allow retry on error
    }
  }, [tournamentId]);

  const fetchPlayers = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchedRef.current.players) return;

    try {
      fetchedRef.current.players = true;
      const res = await GetAllPlayers(tournamentId);
      setPlayers(res || []);
    } catch (e) {
      console.error("Error fetching players:", e);
      setPlayers([]);
      toast.error("Failed to load players");
      fetchedRef.current.players = false; // Allow retry on error
    }
  }, [tournamentId]);

  const fetchMyTeam = useCallback(async () => {
    try {
      const accountId = JSON.parse(Cookies.get("account")).id;

      if (!accountId) {
        setMyTeam(null);
        return;
      }

      const res = await getMyTeamByTournamentIdAndAccountId(
        tournamentId,
        accountId,
      );

      setMyTeam(res ?? null);

      // Only fetch players if we have a team and haven't fetched before
      if (res && !fetchedRef.current.players) {
        await fetchPlayers();
      }
    } catch (e) {
      console.error("Error fetching my team:", e);
      setMyTeam(null);
    }
  }, [tournamentId, fetchPlayers]);

  // Main effect - only runs when tab or tournamentId changes
  useEffect(() => {
    if (!tournamentId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        if (tab === "teams") {
          await fetchTeams();
        } else {
          await fetchMyTeam();
        }
      } catch (e) {
        console.error("Error loading tournament data:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tournamentId, tab, fetchTeams, fetchMyTeam]);

  // Reset cache when tournamentId changes
  useEffect(() => {
    fetchedRef.current = {
      teams: false,
      myTeam: false,
      players: false,
    };
    setPlayers([]);
    setMyTeam(null);
    setTeams([]);
  }, [tournamentId]);

  const handleCreateTeam = async () => {
    try {
      const playerId = JSON.parse(Cookies.get("account")).playerId;
      const res = await createTeam(form, playerId, tournamentId);
      toast.success("Team created successfully");

      // Update states directly instead of refetching
      setTeams([...teams, res]);
      setCreateModalOpen(false);

      // Reset cache and refetch
      fetchedRef.current.myTeam = false;
      fetchedRef.current.teams = false;
      await fetchMyTeam();
    } catch (e) {
      console.error(
        "Error creating team:",
        e.response?.data?.error || "Error creating team",
      );
      toast.error(e.response?.data?.error || "Error creating team");
    }
  };

  const handlePlusClick = async () => {
    if (!selectedPlayerId) {
      toast.error("Please select a player from dropdown list");
      return;
    }

    const playerRequest = {
      playerId: selectedPlayerId,
      teamId: myTeam.teamId,
      tournamentId: tournamentId,
      us: "",
    };

    try {
      setLoading(true);
      await createPlayerRequest(playerRequest);
      toast.success("Player request sent successfully");
      setPlayerText("");

      await fetchMyTeam();
    } catch (e) {
      console.error("Error creating player request:", e);
      toast.error(e.response?.data?.error || "Error creating player request");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      await createTeamRequest({
        teamId: myTeam.teamId,
        tournamentId: tournamentId,
        playerId: JSON.parse(Cookies.get("account")).playerId,
      });
      toast.success("Team request sent successfully");
      setPlayerText("");

      await fetchMyTeam();
    } catch (e) {
      console.error("Error creating team request:", e);
      toast.error(e.response?.data?.error || "Error creating team request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <ToastContainer />
      {loading && <Loading />}

      {/* Tabs */}
      <div className="flex gap-3 mb-4 justify-center">
        <button
          className={`px-3 py-1 rounded-full border border-red-600 w-1/2 ${
            tab === "myTeam" ? "bg-red-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTab("myTeam")}
        >
          My Team
        </button>

        <button
          className={`px-3 py-1 rounded-full border border-red-600 w-1/2 ${
            tab === "teams" ? "bg-red-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTab("teams")}
        >
          Teams
        </button>
      </div>

      {/* Content */}
      {tab === "myTeam" ? (
        myTeam ? (
          <div className="space-y-4 h-max-96 overflow-y-auto pb-16 relative">
            {/* Team card */}
            <div className="bg-gray-100 rounded-xl p-3 border border-red-600">
              <div className="text-sm text-gray-600">My Team</div>
              <div className="text-lg font-bold">{myTeam.teamName}</div>
              <div className="text-sm text-gray-600">{myTeam.teamStatus}</div>
            </div>

            {/* Search + plus */}
            <div className="bg-gray-100 rounded-xl p-1 flex items-center gap-3">
              <div className="flex-1 w-full relative">
                <input
                  className="w-full bg-transparent outline-none border border-red-600 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Type player name or username..."
                  value={playerText}
                  onChange={(e) => setPlayerText(e.target.value)}
                />

                {/* Dropdown */}
                {playerText.trim() &&
                  filteredPlayers.length > 0 &&
                  !selectedPlayer && (
                    <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredPlayers.map((player) => {
                        const displayName = player.name || "Unknown";
                        const displayUsername = player.username || "";

                        return (
                          <div
                            key={player.playerId || player.id}
                            className="p-3 hover:bg-red-50 cursor-pointer border-b last:border-0"
                            onClick={() =>
                              setPlayerText(
                                `${displayName} (${displayUsername})`,
                              )
                            }
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{displayName}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-500">
                                {displayUsername}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* No results message */}
                {playerText.trim() &&
                  filteredPlayers.length === 0 &&
                  !selectedPlayer && (
                    <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg p-3">
                      <div className="text-sm text-gray-500 text-center">
                        No players found or all players already in team
                      </div>
                    </div>
                  )}
              </div>

              <button
                className="bg-red-600 text-white rounded-full p-1 shadow-lg disabled:opacity-50"
                onClick={handlePlusClick}
                disabled={!selectedPlayerId}
                type="button"
                title={!selectedPlayerId ? "Select player from list" : "Add"}
              >
                <Plus size={24} className="font-bold" />
              </button>
            </div>

            {/* Players */}
            <div className="space-y-3">
              {(myTeam.players ?? []).map((p) => (
                <PlayerRow key={p.id} player={p} />
              ))}
            </div>

            <button
              className="bg-red-600 text-white rounded-full p-3 shadow-lg absolute bottom-0 left-1/2 transform -translate-x-1/2 w-11/12 mb-4"
              onClick={handleSendRequest}
            >
              Send Request
            </button>
          </div>
        ) : (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <button
              className="pointer-events-auto bg-red-600 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg"
              title="Create Team"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={40} />
            </button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-gray-100 rounded-xl p-3 border border-red-600"
            >
              {team.name}
            </div>
          ))}
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded shadow-lg w-[90vw] max-w-sm md:w-96 transform transition-all duration-300 ease-out relative">
            <div
              className="relative mb-4 text-right cursor-pointer"
              onClick={() => setCreateModalOpen(false)}
            >
              <span className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                &times;
              </span>
            </div>

            <h2 className="text-xl font-bold mb-4">Create New Team</h2>

            <input
              type="text"
              placeholder="Enter Team Name"
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <div className="flex justify-end mt-4">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
                onClick={handleCreateTeam}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
