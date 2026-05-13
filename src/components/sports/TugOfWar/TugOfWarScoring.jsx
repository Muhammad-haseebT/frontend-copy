import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Media from "../cricket/modals/Media";
import FavouritePlayerModal from "../cricket/modals/FavouritePlayerModal";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { getPlayersByTeamId } from "../../../api/teamApi";
import {
  PanelWrapper,
  PanelHeading,
  ScoreCircles,
  UI_CLASSES,
} from "../common/ScoringUI";
import { getMatchAccess } from "../../../utils/accessControl";

function useRoundTimer(roundStartTime, status) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!roundStartTime || status !== "LIVE") {
      setElapsed(0);
      return;
    }
    const tick = () =>
      setElapsed(Math.floor((Date.now() - roundStartTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [roundStartTime, status]);
  return {
    mins: String(Math.floor(elapsed / 60)).padStart(2, "0"),
    secs: String(elapsed % 60).padStart(2, "0"),
    elapsed,
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────

export default function TugOfWarScoring({
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
    team1Rounds: 0,
    team2Rounds: 0,
    currentRound: 1,
    roundsToWin: 3,
    totalRounds: 5,
    status: "LIVE",
    roundStartTime: null,
    tugOfWarEvents: [],
    comment: "",
  });

  const [team1P, setTeam1P] = useState([]);
  const [team2P, setTeam2P] = useState([]);
  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [mediaId, setMediaId] = useState(null);
  const [showFav, setShowFav] = useState(false);
  const [confirm, setConfirm] = useState(null); // teamId to confirm round win

  const timer = useRoundTimer(score.roundStartTime, score.status);

  useEffect(() => {
    const access = getMatchAccess(scorerId, mediaScorerUsername);
    isAdmin.current = access.canEditMatch;

    if (status === "COMPLETED") {
      setActiveTab("Scoring");
      setShowFav(true);
    }
  }, [scorerId, mediaScorerUsername, status]);

  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        getPlayersByTeamId(team1Id),
        getPlayersByTeamId(team2Id),
      ]);
      setTeam1P(a || []);
      setTeam2P(b || []);
    })();
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
      setScore((p) => ({ ...p, ...d }));
      setWaiting(false);
      if (d.comment === "UNDO") showToast("↩ Undo done", "info");
      if (d.status === "COMPLETED") {
        showToast("🏆 Match Complete!", "info");
        setTimeout(() => setShowFav(true), 1500);
      }
    };
    ws.onerror = () => showToast("WebSocket error", "error");
    ws.onclose = () => (wsRef.current = null);
    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  const send = (payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      showToast("Not connected", "error");
      return;
    }
    setWaiting(true);
    wsRef.current.send(JSON.stringify({ matchId, ...payload }));
  };

  const recordRoundWin = (teamId) => {
    send({ eventType: "ROUND_WIN", winnerTeamId: teamId });
    setConfirm(null);
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isCompleted = score.status === "COMPLETED";
  const rtw = score.roundsToWin || 3;
  const totalR = score.totalRounds || rtw * 2 - 1;
  const roundLabel = `Round ${score.currentRound} of ${totalR}`;
  const winnerName =
    (score.team1Rounds || 0) >= rtw
      ? team1Name
      : (score.team2Rounds || 0) >= rtw
        ? team2Name
        : null;

  // Rope tension visualization
  const t1Pct = Math.min(100, ((score.team1Rounds || 0) / rtw) * 100);
  const t2Pct = Math.min(100, ((score.team2Rounds || 0) / rtw) * 100);

  // Styles using centralized UI_CLASSES

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
        <h1 className="text-white font-semibold text-2xl ml-2">Match Center</h1>
      </div>

      <div className="flex justify-between mt-4 px-4 gap-2">
        {["Scoring", "Events", "Info"].map((item) => (
          <button
            key={item}
            className={`flex-1 py-2 rounded-lg font-semibold text-base transition-colors ${activeTab === item ? "bg-red-600 text-white shadow" : "bg-gray-100 text-gray-600 border border-gray-200"}`}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <hr className="my-3 border-gray-200" />

      {activeTab === "Scoring" && (
        <PanelWrapper>
          <PanelHeading title="Tug of War" />

          {isCompleted ? (
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-2xl p-6 shadow-md mb-4 gap-4">
              <Trophy className="text-yellow-500 w-16 h-16" />
              <h2 className="text-2xl font-black text-red-600">
                Match Completed!
              </h2>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-600 mb-2">
                    {team1Name}
                  </p>
                  <ScoreCircles
                    size="lg"
                    showCheckmark={true}
                    won={score.team1Rounds || 0}
                    toWin={rtw}
                    color="blue"
                  />
                </div>
                <div className="text-4xl font-black text-gray-800">
                  {score.team1Rounds} – {score.team2Rounds}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-rose-600 mb-2">
                    {team2Name}
                  </p>
                  <ScoreCircles
                    size="lg"
                    showCheckmark={true}
                    won={score.team2Rounds || 0}
                    toWin={rtw}
                    color="rose"
                  />
                </div>
              </div>
              {winnerName && (
                <div className="bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md">
                  💪 {winnerName} Wins!
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Timer + Round label */}
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-gray-500">{roundLabel}</p>
                <p className="text-3xl font-black text-amber-600 tabular-nums">
                  {timer.mins}:{timer.secs}
                </p>
              </div>

              {/* Scoreboard */}
              <div className="flex w-full items-center justify-between mb-4 border border-gray-200 rounded-xl px-3 pt-4 pb-3 bg-gray-50 shadow-sm">
                <div className="flex flex-col items-center flex-1 gap-2">
                  <p className="text-base sm:text-xl font-bold text-blue-600 truncate">
                    {team1Name}
                  </p>
                  <ScoreCircles
                    size="lg"
                    showCheckmark={true}
                    won={score.team1Rounds || 0}
                    toWin={rtw}
                    color="blue"
                  />
                  <p className="text-3xl font-black text-blue-600">
                    {score.team1Rounds}
                  </p>
                </div>
                <div className="flex flex-col items-center px-2">
                  <span className="text-2xl font-black text-gray-400">vs</span>
                  <span className="text-xs font-bold text-gray-400 mt-1">
                    rounds
                  </span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-2">
                  <p className="text-base sm:text-xl font-bold text-rose-600 truncate">
                    {team2Name}
                  </p>
                  <ScoreCircles
                    size="lg"
                    showCheckmark={true}
                    won={score.team2Rounds || 0}
                    toWin={rtw}
                    color="rose"
                  />
                  <p className="text-3xl font-black text-rose-600">
                    {score.team2Rounds}
                  </p>
                </div>
              </div>

              {/* Rope visualization */}
              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden border border-gray-200 mb-2">
                <div
                  className="absolute left-0 top-0 h-full bg-blue-400 transition-all duration-700 rounded-l-full"
                  style={{ width: `${t1Pct / 2}%` }}
                />
                <div
                  className="absolute right-0 top-0 h-full bg-rose-400 transition-all duration-700 rounded-r-full"
                  style={{ width: `${t2Pct / 2}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-gray-600">
                    🪢 ROPE
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mb-4">
                First to {rtw} rounds wins
              </p>

              {/* Action panel */}
              {!confirm && isAdmin.current && (
                <div
                  className={`bg-red-600 p-3 rounded-xl shadow-md flex flex-col gap-3 ${waiting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <p className="text-white font-black text-center text-lg mb-1">
                    💪 Who Won This Round?
                  </p>
                  <button
                    className={UI_CLASSES.primaryBtn}
                    onClick={() => setConfirm(team1Id)}
                  >
                    🔵 {team1Name} Won Round
                  </button>
                  <button
                    className={UI_CLASSES.primaryBtn}
                    onClick={() => setConfirm(team2Id)}
                  >
                    🔴 {team2Name} Won Round
                  </button>
                  <button
                    className="w-full bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                    onClick={() => send({ undo: true })}
                  >
                    <RotateCcw size={18} className="mr-2" /> UNDO LAST ROUND
                  </button>
                  <button
                    className="w-full bg-white text-red-600 p-2 rounded-lg text-base font-bold shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                    onClick={() => send({ eventType: "END_MATCH" })}
                  >
                    🏁 End Match
                  </button>
                </div>
              )}

              {/* Confirm dialog */}
              {confirm && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md flex flex-col gap-3">
                  <p className="text-white font-black text-center text-lg">
                    Confirm:{" "}
                    <span className="text-yellow-300">
                      {confirm === team1Id ? team1Name : team2Name}
                    </span>{" "}
                    won this round?
                  </p>
                  <button
                    className={UI_CLASSES.confirmBtn}
                    onClick={() => recordRoundWin(confirm)}
                  >
                    ✅ YES — Record Round Win
                  </button>
                  <button
                    className={UI_CLASSES.backBtn}
                    onClick={() => setConfirm(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </PanelWrapper>
      )}

      {activeTab === "Events" && (
        <PanelWrapper>
          <PanelHeading title="Match Timeline" />
          <div className="space-y-2">
            {score.tugOfWarEvents
              ?.slice()
              .reverse()
              .map((ev, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border border-gray-200 rounded-xl p-3 bg-gray-50 shadow-sm"
                >
                  <div>
                    <p className="font-bold text-red-600 text-base">
                      {ev.eventType === "ROUND_WIN"
                        ? "💪 Round Win"
                        : ev.eventType === "END_MATCH"
                          ? "🏁 Match End"
                          : ev.eventType}
                    </p>
                    {ev.winnerTeamName && (
                      <p className="text-sm text-gray-600 font-semibold">
                        {ev.winnerTeamName}
                      </p>
                    )}
                    {ev.roundDurationSeconds && (
                      <p className="text-xs text-gray-400">
                        Duration: {Math.floor(ev.roundDurationSeconds / 60)}m{" "}
                        {ev.roundDurationSeconds % 60}s
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-700">
                      Round {ev.roundNumber}
                    </p>
                  </div>
                </div>
              ))}
            {(!score.tugOfWarEvents || score.tugOfWarEvents.length === 0) && (
              <div className="text-center text-gray-400 py-8 font-semibold">
                No events yet
              </div>
            )}
          </div>
        </PanelWrapper>
      )}

      {activeTab === "Info" && (
        <div className="max-w-4xl mx-auto p-4 bg-gray-50 rounded-xl shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-red-600 pb-2">
            Match Information
          </h1>
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <table className="w-full border-collapse">
              <tbody>
                {[
                  { label: "Match ID", value: matchId, icon: "🆔" },
                  {
                    label: "Status",
                    value: (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          score.status === "LIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {score.status}
                      </span>
                    ),
                    icon: "📊",
                  },
                  {
                    label: "Current Round",
                    value: score.currentRound,
                    icon: "🔄",
                  },
                  { label: "Rounds to Win", value: rtw, icon: "🏆" },
                  { label: "Best of", value: totalR, icon: "🔢" },
                  {
                    label: "Timer",
                    value: `${timer.mins}:${timer.secs}`,
                    icon: "⏱",
                  },
                  { label: "Scorer ID", value: scorerId || "N/A", icon: "👤" },
                  {
                    label: "Media Scorer",
                    value: mediaScorerUsername || "N/A",
                    icon: "🎥",
                  },
                ].map(({ label, value, icon }) => (
                  <tr
                    key={label}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 w-1/3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <span className="font-bold text-gray-500 uppercase text-xs tracking-wider">
                          {label}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-800 font-semibold text-sm">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mediaId && (
        <Media
          ballId={mediaId}
          matchId={matchId}
          onClose={() => setMediaId(null)}
        />
      )}
      {showFav && (
        <FavouritePlayerModal
          matchId={matchId}
          team1Id={team1Id}
          team2Id={team2Id}
          team1Name={team1Name}
          team2Name={team2Name}
          team1Players={team1P}
          team2Players={team2P}
          onClose={() => {
            setShowFav(false);
            setActiveTab("Info");
          }}
        />
      )}
    </div>
  );
}
