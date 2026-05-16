import React, { useState, useEffect } from "react";
import axios from "axios";
import { getPlayersByTeamId } from "../../../../api/teamApi";
import Swal from "sweetalert2";

export default function SubstituteModal({
  matchId,
  inningsId,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
  battingTeamId,
  onClose,
  onSuccess,
  availableBatters,
  availableBowlers,
  strikerId,
  nonStrikerId,
  bowlerId
}) {
  const [subTeam, setSubTeam] = useState("batting"); // "batting" or "bowling"
  const [outPlayerId, setOutPlayerId] = useState("");
  const [inPlayerId, setInPlayerId] = useState("");

  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);

  useEffect(() => {
    async function fetchPlayers() {
      const t1 = await getPlayersByTeamId(team1Id);
      const t2 = await getPlayersByTeamId(team2Id);
      setTeam1Players(t1 || []);
      setTeam2Players(t2 || []);
    }
    fetchPlayers();
  }, [team1Id, team2Id]);

  const bowlingTeamId = battingTeamId === team1Id ? team2Id : team1Id;

  // Determine current players (who can go out)
  const battingSquad = battingTeamId === team1Id ? team1Players : team2Players;
  const bowlingSquad = bowlingTeamId === team1Id ? team1Players : team2Players;

  const currentBattersIds = new Set(availableBatters.map(b => b.id));
  if (strikerId) currentBattersIds.add(strikerId);
  if (nonStrikerId) currentBattersIds.add(nonStrikerId);

  const currentBowlersIds = new Set(availableBowlers.map(b => b.id));
  if (bowlerId) currentBowlersIds.add(bowlerId);

  const currentPlayers = subTeam === "batting" 
    ? battingSquad.filter(p => currentBattersIds.has(p.id))
    : bowlingSquad.filter(p => currentBowlersIds.has(p.id));

  // Determine available substitutes (who can come in)
  // For simplicity, anyone in squad who is NOT currently playing
  const availableSubs = subTeam === "batting"
    ? battingSquad.filter(p => !currentBattersIds.has(p.id))
    : bowlingSquad.filter(p => !currentBowlersIds.has(p.id));

  const handleSubstitute = async () => {
    try {
      const BASE_URL = import.meta.env.VITE_BASE_URL;
      const teamId = subTeam === "batting" ? battingTeamId : bowlingTeamId;
      const res = await axios.post(`${BASE_URL}/match/${matchId}/substitute`, {
        inningsId,
        outPlayerId: Number(outPlayerId),
        inPlayerId: Number(inPlayerId),
        teamId
      });
      Swal.fire({
        title: "Success",
        text: "Player substituted successfully",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
      onSuccess(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Error",
        text: err?.response?.data || "Failed to substitute player",
        icon: "error"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          🔄 Player Substitution
        </h2>
        
        {/* Team selector */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setSubTeam("batting"); setOutPlayerId(""); setInPlayerId(""); }}
            className={subTeam === "batting" 
              ? "flex-1 bg-red-600 text-white py-2 rounded-lg font-bold"
              : "flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold"}>
            Batting Team
          </button>
          <button onClick={() => { setSubTeam("bowling"); setOutPlayerId(""); setInPlayerId(""); }}
            className={subTeam === "bowling"
              ? "flex-1 bg-red-600 text-white py-2 rounded-lg font-bold"  
              : "flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold"}>
            Bowling Team
          </button>
        </div>

        {/* Player Out */}
        <label className="text-xs font-bold text-gray-500 uppercase">
          Player Out (Injured)
        </label>
        <select value={outPlayerId} onChange={e=>setOutPlayerId(e.target.value)}
          className="w-full border p-2 rounded-lg mb-3 mt-1">
          <option value="">Select player...</option>
          {currentPlayers.map(p => 
            <option key={p.id} value={p.id}>{p.name}</option>
          )}
        </select>

        {/* Player In */}
        <label className="text-xs font-bold text-gray-500 uppercase">
          Substitute In
        </label>
        <select value={inPlayerId} onChange={e=>setInPlayerId(e.target.value)}
          className="w-full border p-2 rounded-lg mb-4 mt-1">
          <option value="">Select substitute...</option>
          {availableSubs.map(p => 
            <option key={p.id} value={p.id}>{p.name}</option>
          )}
        </select>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">
            Cancel
          </button>
          <button onClick={handleSubstitute}
            disabled={!outPlayerId || !inPlayerId}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
            Confirm Sub
          </button>
        </div>
      </div>
    </div>
  );
}
