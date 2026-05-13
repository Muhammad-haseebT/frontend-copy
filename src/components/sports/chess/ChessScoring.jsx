import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import {
  PanelWrapper,
  PanelHeading,
  WizardHeader,
  UI_CLASSES,
} from "../common/ScoringUI";
import FavouritePlayerModal from "../cricket/modals/FavouritePlayerModal";
import { getPlayersByTeamId } from "../../../api/teamApi";
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

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

// FIX: human-readable result type labels
const RESULT_LABELS = {
  CHECKMATE: "Checkmate",
  RESIGN: "Resignation",
  TIMEOUT: "Timeout",
  STALEMATE: "Stalemate",
  DRAW_AGREED: "Draw by Agreement",
};

export default function ChessScoring({
  matchId,
  status,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
  scorerId,
  mediaScorerUsername,
}) {
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const isAdmin = useRef(
    getMatchAccess(scorerId, mediaScorerUsername).canEditMatch,
  );

  const [score, setScore] = useState({
    status: "LIVE",
    resultType: null,
    isDraw: false,
    winnerTeamId: null, // FIX: server now sends this
    matchStartTime: null,
    chessEvents: [],
  });

  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [waiting, setWaiting] = useState(false);

  // pendingWinner: { id, name } | null — set when user picks a team
  // pendingDraw: true | false — set when user clicks draw
  const [pendingWinner, setPendingWinner] = useState(null);
  const [pendingDraw, setPendingDraw] = useState(false);
  const [team1P, setTeam1P] = useState([]);
  const [team2P, setTeam2P] = useState([]);
  const [showFavModal, setShowFavModal] = useState(false);

  const matchTimer = useMatchTimer(score.matchStartTime, score.status);
  const isCompleted = score.status === "COMPLETED";

  useEffect(() => {
    const access = getMatchAccess(scorerId, mediaScorerUsername);
    isAdmin.current = access.canEditMatch;

    if (status === "COMPLETED") {
      setActiveTab("Scoring");
      setShowFavModal(true);
      fetchPlayers();
    }
  }, [scorerId, mediaScorerUsername, status]);

  const fetchPlayers = async () => {
    const [a, b] = await Promise.all([
      getPlayersByTeamId(team1Id),
      getPlayersByTeamId(team2Id),
    ]);
    setTeam1P(a || []);
    setTeam2P(b || []);
  };

  useEffect(() => {
    fetchPlayers();
  }, [team1Id, team2Id]);

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
        showToast("♟️ Match Complete!", "info");
        setShowFavModal(true);
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

  // Step 1: user picks winner
  const selectWinner = (teamId, teamName) => {
    setPendingDraw(false);
    setPendingWinner({ id: teamId, name: teamName });
  };

  // Step 1b: user clicks draw
  const selectDraw = () => {
    setPendingWinner(null);
    setPendingDraw(true);
  };

  // Step 2a: confirm win
  const confirmWin = () => {
    send({ eventType: "CHECKMATE", teamId: pendingWinner.id });
    setPendingWinner(null);
  };

  // Step 2b: confirm draw
  const confirmDraw = () => {
    send({ eventType: "DRAW_AGREED" });
    setPendingDraw(false);
  };

  const cancelPending = () => {
    setPendingWinner(null);
    setPendingDraw(false);
  };

  // FIX: derive names from winnerTeamId (now provided by server)
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

  const pendingLoserName =
    pendingWinner?.id === team1Id ? team2Name : team1Name;

  // FIX: result type label for summary
  const resultLabel = RESULT_LABELS[score.resultType] || score.resultType;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Toast */}
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

      {/* Header */}
      <div className="flex items-center bg-slate-800 h-16 px-4">
        <ArrowLeft
          className="w-6 h-6 text-white cursor-pointer"
          onClick={() => navigate(-1)}
        />
        <h1 className="text-white font-semibold text-2xl ml-2">
          ♟️ Chess Match
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-between mt-4 px-4 gap-2">
        {["Scoring", "Events", "Info"].map((item) => (
          <button
            key={item}
            className={`flex-1 py-2 rounded-lg font-semibold text-base ${
              activeTab === item
                ? "bg-slate-800 text-white shadow"
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <hr className="my-3 border-gray-200" />

      {/* ── SCORING TAB ── */}
      {activeTab === "Scoring" && (
        <PanelWrapper>
          <PanelHeading title="Live Chess" />

          {/* FIX: Completed banner — shows draw OR winner/loser with resultType */}
          {isCompleted ? (
            <div className="text-center p-6 border rounded-2xl shadow space-y-2">
              {score.isDraw ? (
                <>
                  <p className="text-4xl">🤝</p>
                  <h2 className="text-2xl font-black text-slate-700">
                    It's a Draw!
                  </h2>
                  <p className="text-gray-500 text-sm font-semibold">
                    {team1Name} vs {team2Name}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl">🏆</p>
                  <h2 className="text-2xl font-black text-slate-700">
                    {winnerName ? `${winnerName} Wins!` : "Match Completed!"}
                  </h2>
                  {loserName && (
                    <p className="text-red-500 text-sm font-semibold">
                      ❌ {loserName} loses
                    </p>
                  )}
                </>
              )}
              {resultLabel && (
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mt-1">
                  via {resultLabel}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Scoreboard */}
              <div className="flex justify-around items-center bg-slate-800 rounded-2xl p-5 my-3">
                <div className="text-center flex-1">
                  <p className="text-white font-black text-xl">{team1Name}</p>
                </div>
                <div className="text-center px-4">
                  <Clock className="mx-auto text-slate-400 mb-1" size={18} />
                  <p className="text-slate-300 text-sm font-bold">
                    {matchTimer}
                  </p>
                  <p className="text-white font-black text-2xl mt-1">VS</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-white font-black text-xl">{team2Name}</p>
                </div>
              </div>

              {/* Admin controls */}
              {isAdmin.current && (
                <div
                  className={`flex flex-col gap-3 ${waiting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {/* Step 1: pick winner or draw — only shown when no pending action */}
                  {!pendingWinner && !pendingDraw && (
                    <div className="bg-slate-800 p-4 rounded-xl space-y-3">
                      <p className="text-white text-xs font-black uppercase tracking-widest text-center mb-1">
                        🏆 Record Result
                      </p>
                      <button
                        className={UI_CLASSES.confirmBtn}
                        onClick={() => selectWinner(team1Id, team1Name)}
                      >
                        {team1Name} Wins
                      </button>
                      <button
                        className={UI_CLASSES.confirmBtn}
                        onClick={() => selectWinner(team2Id, team2Name)}
                      >
                        {team2Name} Wins
                      </button>
                      {/* FIX: Draw button */}
                      <button
                        className="w-full bg-yellow-500 text-white p-3 rounded-lg text-sm font-black"
                        onClick={selectDraw}
                      >
                        🤝 Draw
                      </button>
                    </div>
                  )}

                  {/* Step 2a: confirm win */}
                  {pendingWinner && (
                    <div className="bg-slate-800 p-4 rounded-xl space-y-3">
                      <WizardHeader
                        title="✅ Confirm Result"
                        onClose={cancelPending}
                      />
                      <div className="bg-slate-700 rounded-xl p-3 text-center space-y-1">
                        <p className="text-green-400 font-black text-base">
                          🏆 {pendingWinner.name}{" "}
                          <span className="text-white">wins</span>
                        </p>
                        <p className="text-red-400 font-black text-base">
                          ❌ {pendingLoserName}{" "}
                          <span className="text-white">loses</span>
                        </p>
                      </div>
                      <button
                        className="w-full bg-green-600 text-white p-3 rounded-lg text-sm font-black"
                        onClick={confirmWin}
                      >
                        ✅ Confirm Win
                      </button>
                      <button
                        className="w-full bg-white/10 text-white p-3 rounded-lg text-sm font-bold"
                        onClick={cancelPending}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Step 2b: confirm draw */}
                  {pendingDraw && (
                    <div className="bg-slate-800 p-4 rounded-xl space-y-3">
                      <WizardHeader
                        title="🤝 Confirm Draw"
                        onClose={cancelPending}
                      />
                      <div className="bg-slate-700 rounded-xl p-3 text-center space-y-1">
                        <p className="text-yellow-400 font-black text-base">
                          🤝 {team1Name} <span className="text-white">vs</span>{" "}
                          {team2Name}
                        </p>
                        <p className="text-slate-300 text-xs">
                          Draw by Agreement — both teams get 1 point
                        </p>
                      </div>
                      <button
                        className="w-full bg-yellow-500 text-white p-3 rounded-lg text-sm font-black"
                        onClick={confirmDraw}
                      >
                        ✅ Confirm Draw
                      </button>
                      <button
                        className="w-full bg-white/10 text-white p-3 rounded-lg text-sm font-bold"
                        onClick={cancelPending}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </PanelWrapper>
      )}

      {/* ── EVENTS TAB ── */}
      {activeTab === "Events" && (
        <PanelWrapper>
          <PanelHeading title="Events" />
          <div className="space-y-2">
            {score.chessEvents?.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">
                No events yet
              </p>
            )}
            {score.chessEvents?.map((ev, i) => (
              <div
                key={i}
                className="border rounded-xl p-3 bg-gray-50 flex items-center gap-2"
              >
                <span className="text-lg">
                  {ev.eventType === "CHECKMATE"
                    ? "♟️"
                    : ev.eventType === "DRAW_AGREED" ||
                        ev.eventType === "STALEMATE"
                      ? "🤝"
                      : "🏁"}
                </span>
                <div>
                  <p className="font-bold text-sm capitalize">
                    {RESULT_LABELS[ev.eventType] ||
                      ev.eventType?.replace("_", " ")}
                  </p>
                  {ev.teamName && (
                    <p className="text-xs text-gray-500">{ev.teamName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </PanelWrapper>
      )}

      {/* ── INFO TAB ── */}
      {activeTab === "Info" && (
        <PanelWrapper>
          <PanelHeading title="Match Info" />
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-bold">Status:</span> {score.status}
            </p>
            <p>
              <span className="font-bold">Timer:</span> {matchTimer}
            </p>
            {isCompleted && (
              <>
                {score.isDraw ? (
                  <p>
                    <span className="font-bold">Result:</span> 🤝 Draw
                  </p>
                ) : (
                  <>
                    {winnerName && (
                      <p>
                        <span className="font-bold">Winner:</span> 🏆{" "}
                        {winnerName}
                      </p>
                    )}
                    {loserName && (
                      <p>
                        <span className="font-bold">Loser:</span> ❌ {loserName}
                      </p>
                    )}
                  </>
                )}
                {resultLabel && (
                  <p>
                    <span className="font-bold">Via:</span> {resultLabel}
                  </p>
                )}
              </>
            )}
          </div>
        </PanelWrapper>
      )}
      {showFavModal && (
        <FavouritePlayerModal
          matchId={matchId}
          team1Id={team1Id}
          team2Id={team2Id}
          team1Name={team1Name}
          team2Name={team2Name}
          team1Players={team1P}
          team2Players={team2P}
          onClose={() => {
            setShowFavModal(false);
            setActiveTab("Info");
          }}
        />
      )}
    </div>
  );
}
