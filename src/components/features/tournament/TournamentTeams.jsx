import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { Plus, X } from "lucide-react";
import Cookies from "js-cookie";
import {
  getTeamsByTournamentId,
  getMyTeamByTournamentIdAndAccountId,
  createTeam,
  reuseTeam,
  getPlayerTeamHistory,
} from "../../../api/teamApi";
import { GetAllPlayers } from "../../../api/accountsApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../common/LoadingSpinner";
import { createPlayerRequest, removePlayerFromTeam } from "../../../api/playerRequestApi";
import { createTeamRequest } from "../../../api/teamApi";
import TeamDetailSheet from "./TeamDetailSheet";


export const PlayerRow = ({ player, canRemove, onRemove }) => (
  <div className="bg-gray-100 rounded-xl p-3 flex items-center justify-between border border-red-600">
    <div className="flex items-center gap-3">
      {player.profilePhotoUrl ? (
        <img
          src={player.profilePhotoUrl}
          className="w-6 h-6 rounded-full object-cover"
          alt={player.name}
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-600">
          {player.name?.[0]?.toUpperCase()}
        </div>
      )}
      <div className="font-medium">{player.name}</div>
    </div>
    <div className="flex items-center gap-2">
      <div className="text-sm text-gray-700">{player.status}</div>
      {canRemove && (
        <button
          onClick={() => onRemove(player.playerId || player.id)}
          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
          title="Remove Player"
        >
          <X size={16} />
        </button>
      )}
    </div>
  </div>
);

const ReuseTeamModal = ({ tournamentId, onClose, onSuccess }) => {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const accountStr = Cookies.get("account");
        if (!accountStr) return;
        const account = JSON.parse(accountStr);
        if (!account || !account.playerId) return;

        const res = await getPlayerTeamHistory(account.playerId);
        setHistory(res.data || []);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleReuse = async () => {
    setConfirming(true);
    try {
      const accountStr = Cookies.get("account");
      const account = JSON.parse(accountStr);
      
      const res = await reuseTeam({
        sourceTeamId: selected.teamId,
        targetTournamentId: tournamentId,
        creatorPlayerId: account.playerId,
      });

      toast.success(
        `Team reused! ${res.data.invitesSent} players invited.`
      );
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data || "Failed to reuse team");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto p-6 relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold mb-4">🔄 Reuse Existing Team</h2>

        {loading ? (
          <div className="py-10 flex justify-center"><Loading /></div>
        ) : selected ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-bold text-lg">{selected.teamName}</p>
              <p className="text-gray-600 text-sm">{selected.tournamentName}</p>
              <p className="text-gray-500 text-sm mt-1">
                {selected.playerCount} players will be invited
              </p>
            </div>
            <p className="text-xs text-gray-500 text-center italic">
              You will be automatically approved as Captain
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-gray-300 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleReuse}
                disabled={confirming}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-red-700 transition"
              >
                {confirming ? "Reusing..." : "Confirm"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400">No previous teams found</p>
              </div>
            ) : (
              history.map((t) => (
                <div
                  key={t.teamId}
                  onClick={() => setSelected(t)}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-red-600 hover:bg-red-50 transition group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold group-hover:text-red-600 transition">{t.teamName}</p>
                      <p className="text-sm text-gray-500">{t.tournamentName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wider">{t.sport}</p>
                      <p className="text-[10px] text-gray-400">{t.playerCount} members</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function TournamentTeams({ tournamentId, onCreateTeam, sportId }) {
  const account = useMemo(() => {
    try {
      return JSON.parse(Cookies.get("account") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [tab, setTab] = useState(account.id ? "myTeam" : "teams");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reuseModalOpen, setReuseModalOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [myTeam, setMyTeam] = useState(null);
  const [playerText, setPlayerText] = useState("");

  const isCreator = myTeam?.creatorPlayerId === account.playerId || myTeam?.creatorId === account.id;
  const canEdit = isCreator && (myTeam?.teamStatus === "DRAFT" || myTeam?.teamStatus === "REJECTED");

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
      const accountCookie = Cookies.get("account");
      if (!accountCookie) {
        setMyTeam(null);
        return;
      }
      const accountId = JSON.parse(accountCookie).id;

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
      const accountCookie = Cookies.get("account");
      if (!accountCookie) return;
      const playerId = JSON.parse(accountCookie).playerId;
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

  const handleRemovePlayer = async (playerId) => {
    console.log("Removing player with ID:", playerId, "from team:", myTeam.teamId);
    if (!window.confirm("Remove this player from team?")) return;
    try {
      setLoading(true);
      await removePlayerFromTeam(myTeam.teamId, playerId);
      toast.success("Player removed");
      fetchedRef.current.myTeam = false;
      await fetchMyTeam();
    } catch (err) {
      toast.error(err.response?.data || "Failed to remove player");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      const accountCookie = Cookies.get("account");
      if (!accountCookie) return;
      setLoading(true);
      await createTeamRequest({
        teamId: myTeam.teamId,
        tournamentId: tournamentId,
        playerId: JSON.parse(accountCookie).playerId,
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
                <PlayerRow
                  key={p.id}
                  player={p}
                  canRemove={canEdit && p.playerId !== account.playerId}
                  onRemove={handleRemovePlayer}
                />
              ))}
            </div>

            {canEdit && myTeam?.teamStatus === "REJECTED" ? (
              <button
                className="bg-green-600 text-white rounded-full p-3 shadow-lg absolute bottom-0 left-1/2 transform -translate-x-1/2 w-11/12 mb-4 font-bold"
                onClick={handleSendRequest}
              >
                Re-submit Team for Approval
              </button>
            ) : (
              <button
                className="bg-red-600 text-white rounded-full p-3 shadow-lg absolute bottom-0 left-1/2 transform -translate-x-1/2 w-11/12 mb-4"
                onClick={handleSendRequest}
              >
                Send Request
              </button>
            )}
          </div>
        ) : !account?.id ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-red-600 p-6 max-w-xs mx-auto">
            <p className="text-red-600 font-semibold mb-2">Access Denied</p>
            <p className="text-gray-500 text-sm italic">Please log in to create or manage your team.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center justify-center min-h-[300px] w-full max-w-xs mx-auto">
            <button
              className="bg-red-600 text-white rounded-2xl w-full py-4 px-6 flex items-center justify-center gap-2 shadow-lg hover:bg-red-700 transition active:scale-95"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={24} />
              <span className="font-bold text-lg">Create New Team</span>
            </button>

            <div className="flex items-center w-full gap-3">
              <div className="h-[1px] bg-gray-200 flex-1"></div>
              <span className="text-gray-400 text-xs font-bold uppercase">or</span>
              <div className="h-[1px] bg-gray-200 flex-1"></div>
            </div>

            <button
              className="border-2 border-red-600 text-red-600 rounded-2xl w-full py-4 px-6 flex items-center justify-center gap-2 hover:bg-red-50 transition active:scale-95"
              onClick={() => setReuseModalOpen(true)}
            >
              <span className="font-bold text-lg">🔄 Reuse Old Team</span>
            </button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="bg-gray-100 rounded-xl p-3 border border-red-600 flex justify-between items-center cursor-pointer hover:bg-red-50 transition"
            >
              <span className="font-semibold">{team.name}</span>
              {team.groupName && <span className="text-sm font-bold text-red-600">{team.groupName}</span>}
            </div>
          ))}
        </div>
      )}

      {selectedTeam && (
        <TeamDetailSheet
          team={selectedTeam}
          tournamentId={tournamentId}
          sportId={sportId}
          onClose={() => setSelectedTeam(null)}
        />
      )}

      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm transform transition-all duration-300 ease-out relative">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              onClick={() => setCreateModalOpen(false)}
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-bold mb-6">Create New Team</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  placeholder="Enter Team Name"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <button
                className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg active:scale-95"
                onClick={handleCreateTeam}
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {reuseModalOpen && (
        <ReuseTeamModal
          tournamentId={tournamentId}
          onClose={() => setReuseModalOpen(false)}
          onSuccess={() => {
            fetchedRef.current.myTeam = false;
            fetchMyTeam();
          }}
        />
      )}
    </div>
  );
}
