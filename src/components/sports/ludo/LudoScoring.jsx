import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Swal from "sweetalert2";
import {
  PanelWrapper,
  PanelHeading,
  WizardHeader,
  UI_CLASSES,
} from "../common/ScoringUI";
import FavouritePlayerModal from "../cricket/modals/FavouritePlayerModal";
import { getMatchAccess } from "../../../utils/accessControl";

function useMatchTimer(startTime, status) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime || status !== "LIVE") {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, status]);
  return {
    mins: String(Math.floor(elapsed / 60)).padStart(2, "0"),
    secs: String(elapsed % 60).padStart(2, "0"),
  };
}

function HomeRunDots({ count, max, color = "bg-yellow-300" }) {
  return (
    <div className="flex gap-1 justify-center mt-1 flex-wrap">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border-2 border-white ${i < count ? color : "bg-transparent"}`}
        />
      ))}
    </div>
  );
}

export default function LudoScoring({
  matchId,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
  format = "1v1", // "1v1" | "2v2"
  players1 = [],
  players2 = [],
  status,
  scorerId,
  mediaScorerUsername,
}) {
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const isAdmin = useRef(
    getMatchAccess(scorerId, mediaScorerUsername).canEditMatch,
  );

  // FIX: prop-based max as initial fallback; server value overrides once received
  const PROP_MAX = format === "2v2" ? 8 : 4;

  const [score, setScore] = useState({
    team1HomeRuns: 0,
    team2HomeRuns: 0,
    maxHomeRuns: PROP_MAX, // will be updated from server
    status: "LIVE",
    winnerTeamId: null,
    matchStartTime: null,
    ludoEvents: [],
  });

  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [modal, setModal] = useState(null);
  const [showFav, setShowFav] = useState(false);

  const timer = useMatchTimer(score.matchStartTime, score.status);
  const isCompleted = score.status === "COMPLETED";

  // FIX: use server's maxHomeRuns as authoritative; fallback to prop
  const MAX_HOME_RUNS = score.maxHomeRuns || PROP_MAX;

  useEffect(() => {
    const access = getMatchAccess(scorerId, mediaScorerUsername);
    isAdmin.current = access.canEditMatch;

    if (status === "COMPLETED") {
      setActiveTab("Scoring");
      setShowFav(true);
    }
  }, [scorerId, mediaScorerUsername, status]);

  useEffect(() => {
    const ws = new WebSocket(
      import.meta.env.VITE_SOCKET_URL + "?matchId=" + matchId,
    );
    ws.onopen = () => {
      wsRef.current = ws;
      showToast("🔴 Live connected", "success");
    };
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      console.log(d);
      setScore((prev) => ({ ...prev, ...d }));
      setWaiting(false);
      if (d.comment === "UNDO") showToast("↩ Undo done", "info");
      if (d.status === "COMPLETED") {
        showToast("🎲 Match Complete!", "info");
        setShowFav(true);
      }
    };
    ws.onerror = () => showToast("WebSocket error", "error");
    ws.onclose = () => (wsRef.current = null);
    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [matchId]);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const send = (payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      showToast("Not connected", "error");
      return;
    }
    setWaiting(true);
    wsRef.current.send(JSON.stringify({ matchId, ...payload }));
  };

  const recordHomeRun = (teamId) => {
    // Always send PROP_MAX so backend sets the correct max on first event
    send({ eventType: "HOME_RUN", teamId, maxHomeRuns: PROP_MAX });
    setModal(null);
  };

  // FIX: derive winner/loser name from winnerTeamId (now sent by backend)
  const winnerName =
    score.winnerTeamId === team1Id
      ? team1Name
      : score.winnerTeamId === team2Id
        ? team2Name
        : null;

  const loserName =
    score.winnerTeamId === team1Id
      ? team2Name
      : score.winnerTeamId === team2Id
        ? team1Name
        : null;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-2xl text-sm font-bold shadow-2xl text-white ${
            toast.type === "error"
              ? "bg-red-500"
              : toast.type === "success"
                ? "bg-green-500"
                : "bg-slate-700"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex items-center bg-red-600 h-16 px-4">
        <ArrowLeft
          className="w-6 h-6 text-white cursor-pointer"
          onClick={() => navigate(-1)}
        />
        <h1 className="text-white font-semibold text-2xl ml-2">
          🎲 Ludo — {format.toUpperCase()}
        </h1>
      </div>

      <div className="flex justify-between mt-4 px-4 gap-2">
        {["Scoring", "Events", "Info"].map((item) => (
          <button
            key={item}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              activeTab === item
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {activeTab === "Scoring" && (
        <PanelWrapper>
          <PanelHeading title="🎲 Ludo" />

          {/* FIX: Completed banner shows winner AND loser */}
          {isCompleted && (
            <div className="text-center p-5 bg-orange-50 border border-orange-200 rounded-2xl mb-3">
              <p className="text-4xl">🏆</p>
              <h2 className="text-2xl font-black text-orange-700 mt-1">
                {winnerName ? `${winnerName} Wins!` : "Match Completed!"}
              </h2>
              {loserName && (
                <p className="text-sm text-red-500 font-semibold mt-1">
                  ❌ {loserName} loses
                </p>
              )}
              <div className="mt-3 flex justify-center gap-6 text-sm text-orange-600 font-bold">
                <span>
                  {team1Name}: {score.team1HomeRuns}/{MAX_HOME_RUNS} 🏠
                </span>
                <span>
                  {team2Name}: {score.team2HomeRuns}/{MAX_HOME_RUNS} 🏠
                </span>
              </div>
            </div>
          )}

          {/* FIX: scoreboard now uses MAX_HOME_RUNS derived from server */}
          <div className="flex justify-around items-center bg-orange-700 rounded-2xl p-4 my-3">
            <div className="text-center flex-1">
              <p className="text-white font-black text-4xl">
                {score.team1HomeRuns}
              </p>
              <p className="text-orange-200 text-xs mt-1 font-bold">
                {team1Name}
              </p>
              {/* FIX: HomeRunDots correctly uses server-derived MAX_HOME_RUNS */}
              <HomeRunDots count={score.team1HomeRuns} max={MAX_HOME_RUNS} />
              <p className="text-orange-300 text-xs mt-1">
                {score.team1HomeRuns}/{MAX_HOME_RUNS} 🏠
              </p>
            </div>

            <div className="text-center px-3">
              <p className="text-orange-300 text-xs font-bold">VS</p>
              <p className="text-white text-xs mt-1">
                {timer.mins}:{timer.secs}
              </p>
            </div>

            <div className="text-center flex-1">
              <p className="text-white font-black text-4xl">
                {score.team2HomeRuns}
              </p>
              <p className="text-orange-200 text-xs mt-1 font-bold">
                {team2Name}
              </p>
              {/* FIX: HomeRunDots correctly uses server-derived MAX_HOME_RUNS */}
              <HomeRunDots count={score.team2HomeRuns} max={MAX_HOME_RUNS} />
              <p className="text-orange-300 text-xs mt-1">
                {score.team2HomeRuns}/{MAX_HOME_RUNS} 🏠
              </p>
            </div>
          </div>

          {/* Admin controls */}
          {!isCompleted && isAdmin.current && (
            <div
              className={`bg-red-600 p-3 rounded-xl flex flex-col gap-3 ${waiting ? "opacity-50 pointer-events-none" : ""}`}
            >
              {!modal && (
                <>
                  <button
                    className={UI_CLASSES.primaryBtn}
                    onClick={() => setModal("pick_team_homerun")}
                  >
                    🏠 HOME RUN
                  </button>
                  <button
                    className="w-full bg-white/10 text-white p-3 rounded-lg text-lg font-black flex items-center justify-center"
                    onClick={() => send({ undo: true })}
                  >
                    <RotateCcw size={18} className="mr-2" /> UNDO
                  </button>
                </>
              )}

              {modal === "pick_team_homerun" && (
                <div className="bg-orange-800 p-3 rounded-xl">
                  <WizardHeader
                    title="🏠 Whose Home Run?"
                    onClose={() => setModal(null)}
                  />
                  <div className="flex flex-col gap-3 mt-2">
                    <button
                      className={UI_CLASSES.confirmBtn}
                      onClick={() => recordHomeRun(team1Id)}
                    >
                      🏠 {team1Name} ({score.team1HomeRuns}/{MAX_HOME_RUNS})
                    </button>
                    <button
                      className={UI_CLASSES.confirmBtn}
                      onClick={() => recordHomeRun(team2Id)}
                    >
                      🏠 {team2Name} ({score.team2HomeRuns}/{MAX_HOME_RUNS})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isCompleted && (
            <div className="mt-3 text-center text-xs text-gray-400">
              First to {MAX_HOME_RUNS} home runs wins 🏆
              {format === "2v2" && (
                <span className="block">(2 players × 4 pieces each)</span>
              )}
            </div>
          )}
        </PanelWrapper>
      )}

      {activeTab === "Events" && (
        <PanelWrapper>
          <PanelHeading title="Events" />
          <div className="space-y-2">
            {!score.ludoEvents?.length && (
              <p className="text-gray-400 text-sm text-center py-4">
                No events yet
              </p>
            )}
            {score.ludoEvents?.map((ev, i) => (
              <div
                key={i}
                className="border rounded-xl p-3 bg-gray-50 flex items-center gap-2"
              >
                <span className="text-lg">
                  {ev.eventType === "HOME_RUN"
                    ? "🏠"
                    : ev.eventType === "WIN"
                      ? "🏆"
                      : "🏁"}
                </span>
                <div>
                  <p className="font-bold text-sm capitalize">
                    {ev.eventType?.replace("_", " ")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ev.teamId === team1Id ? team1Name : team2Name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </PanelWrapper>
      )}

      {activeTab === "Info" && (
        <PanelWrapper>
          <PanelHeading title="Match Info" />
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-bold">Status:</span> {score.status}
            </p>
            <p>
              <span className="font-bold">Format:</span> {format.toUpperCase()}
            </p>
            <p>
              <span className="font-bold">Timer:</span> {timer.mins}:
              {timer.secs}
            </p>
            <p>
              <span className="font-bold">Target:</span> {MAX_HOME_RUNS} home
              runs
            </p>
            {isCompleted && winnerName && (
              <p>
                <span className="font-bold">Winner:</span> 🏆 {winnerName}
              </p>
            )}
            {players1.length > 0 && (
              <div>
                <p className="font-bold mt-2">{team1Name} Players:</p>
                {players1.map((p) => (
                  <p key={p.id} className="text-gray-600 ml-2">
                    • {p.name}
                  </p>
                ))}
              </div>
            )}
            {players2.length > 0 && (
              <div>
                <p className="font-bold mt-2">{team2Name} Players:</p>
                {players2.map((p) => (
                  <p key={p.id} className="text-gray-600 ml-2">
                    • {p.name}
                  </p>
                ))}
              </div>
            )}
          </div>
        </PanelWrapper>
      )}
      {showFav && (
        <FavouritePlayerModal
          matchId={matchId}
          team1Id={team1Id}
          team2Id={team2Id}
          team1Name={team1Name}
          team2Name={team2Name}
          team1Players={players1}
          team2Players={players2}
          onClose={() => {
            setShowFav(false);
            setActiveTab("Info");
          }}
        />
      )}
    </div>
  );
}
