import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getPlayersByTeamId } from "../../../api/teamApi";
import Media from "../cricket/modals/Media";
import FavouritePlayerModal from "../cricket/modals/FavouritePlayerModal";
import {
  ArrowLeft,
  Camera,
  ShieldAlert,
  XCircle,
  CheckCircle,
  ChevronRight,
  Trophy,
} from "lucide-react";
import {
  PanelWrapper,
  PanelHeading,
  WizardHeader,
  UI_CLASSES,
} from "../common/ScoringUI";
import { getMatchAccess } from "../../../utils/accessControl";
import MilestonePopup from "../../common/MilestonePopup";
import { detectFutsalMilestone } from "../../../utils/milestoneDetector"; // Reuse or create if needed, assuming reuse for now

const EVENT_CONFIG = {
  GOAL: { icon: "🏑", label: "Goal" },
  OWN_GOAL: { icon: "🔴", label: "Own Goal" },
  FOUL: { icon: "⚠️", label: "Foul" },
  GREEN_CARD: { icon: "🟩", label: "Green Card" },
  YELLOW_CARD: { icon: "🟨", label: "Yellow Card" },
  RED_CARD: { icon: "🟥", label: "Red Card" },
  SUBSTITUTION: { icon: "↔", label: "Substitution" },
  PENALTY_CORNER: { icon: "🎯", label: "Penalty Corner" },
  END_PERIOD: { icon: "🔔", label: "End Period" },
  TIMEOUT: { icon: "⏸", label: "Timeout" },
};

function useMatchTimer(periodStartTime, periodDurationMinutes, status) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!periodStartTime || status !== "LIVE") {
      setElapsed(0);
      return;
    }
    const tick = () =>
      setElapsed(Math.floor((Date.now() - periodStartTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [periodStartTime, status]);

  const totalSec = (periodDurationMinutes || 15) * 60;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return { mins, secs, elapsed, totalSec };
}

export default function HockeyScoring({
  matchId,
  status,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
  winnerTeamName,
  scorerId,
  mediaScorerUsername,
}) {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const isAdminRef = useRef(
    getMatchAccess(scorerId, mediaScorerUsername).canEditMatch,
  );

  const [score, setScore] = useState({
    team1Score: 0,
    team2Score: 0,
    team1Fouls: 0,
    team2Fouls: 0,
    team1GreenCards: 0,
    team2GreenCards: 0,
    team1YellowCards: 0,
    team2YellowCards: 0,
    team1RedCards: 0,
    team2RedCards: 0,
    team1PenaltyCorners: 0,
    team2PenaltyCorners: 0,
    currentPeriod: 1,
    status: "LIVE",
    inExtraTime: false,
    periodStartTime: null,
    periodDurationMinutes: 15,
    hockeyEvents: [],
    comment: "",
  });

  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [activeModal, setActiveModal] = useState(null);

  const [selGoalTeamId, setSelGoalTeamId] = useState(null);
  const [selGoalType, setSelGoalType] = useState(null);
  const [selPlayerId, setSelPlayerId] = useState(null);
  const [selAssistId, setSelAssistId] = useState(null);

  const [selFoulTeamId, setSelFoulTeamId] = useState(null);
  const [selFoulPlayerId, setSelFoulPlayerId] = useState(null);
  const [selCardType, setSelCardType] = useState(null);

  const [selSubTeamId, setSelSubTeamId] = useState(null);
  const [selOutId, setSelOutId] = useState(null);
  const [selInId, setSelInId] = useState(null);

  const [selPcTeamId, setSelPcTeamId] = useState(null);

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showLineupEditor, setShowLineupEditor] = useState(false);
  const timer = useMatchTimer(
    score.periodStartTime,
    score.periodDurationMinutes,
    score.status,
  );
  const [team1Active, setTeam1Active] = useState([]);
  const [team2Active, setTeam2Active] = useState([]);

  // ── Milestone popup ───────────────────────────────────────────────────────
  const [milestone, setMilestone] = useState(null);
  const onDismissRef = useRef(() => setMilestone(null));
  const prevDataRef = useRef(null);

  useEffect(() => {
    const access = getMatchAccess(scorerId, mediaScorerUsername);
    isAdminRef.current = access.canEditMatch;
  }, [scorerId, mediaScorerUsername]);

  useEffect(() => {
    if (score.status === "COMPLETED") {
      setActiveTab("Scoring");
      setActiveModal("favPlayerModal");
    }
  }, [score.status]);

  useEffect(() => {
    if (status === "COMPLETED") {
      setActiveModal("favPlayerModal");
    }
  }, [status]);

  const fetchPlayers = useCallback(async () => {
    const [p1, p2] = await Promise.all([
      getPlayersByTeamId(team1Id),
      getPlayersByTeamId(team2Id),
    ]);
    setTeam1Players(p1 || []);
    setTeam2Players(p2 || []);
  }, [team1Id, team2Id]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    const ws = new WebSocket(
      import.meta.env.VITE_SOCKET_URL + "?matchId=" + matchId + "&sport=hockey",
    );
    ws.onopen = () => {
      socketRef.current = ws;
      showToast("🔴 Live connected", "success");
    };
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      setScore((prev) => {
        // Milestone detection can be customized for hockey if needed
        const next = { ...prev, ...d };
        const detected = detectFutsalMilestone(next, prevDataRef.current);
        if (detected) setMilestone(detected);
        prevDataRef.current = next;
        return next;
      });
      setIsWaiting(false);
      if (d.team1OnField?.length) setTeam1Active(d.team1OnField);
      if (d.team2OnField?.length) setTeam2Active(d.team2OnField);
      if (d.comment === "UNDO") showToast("↩ Undo successful", "info");
      if (d.status === "BREAK") showToast("🔔 End of Period!", "info");
      if (d.status === "EXTRA_TIME") showToast("⏱ Draw! Extra Time?", "info");
      if (d.status === "COMPLETED") showToast("🏆 Match Completed!", "info");
    };
    ws.onerror = () => showToast("WebSocket error", "error");
    ws.onclose = () => {
      socketRef.current = null;
    };
    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  const send = (payload) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      showToast("Not connected", "error");
      return;
    }
    setIsWaiting(true);
    socketRef.current.send(JSON.stringify({ matchId, ...payload }));
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelGoalTeamId(null);
    setSelGoalType(null);
    setSelPlayerId(null);
    setSelAssistId(null);
    setSelCardType(null);
    setSelOutId(null);
    setSelInId(null);
    setSelFoulTeamId(null);
    setSelFoulPlayerId(null);
    setSelSubTeamId(null);
    setSelPcTeamId(null);
  };

  const isCompleted = score.status === "COMPLETED";
  const isBreak = score.status === "BREAK";
  const isExtraTime = score.status === "EXTRA_TIME";
  const onFieldPlayers = () => {
    const active = selGoalTeamId === team1Id ? team1Active : team2Active;
    const all = selGoalTeamId === team1Id ? team1Players : team2Players;
    return active.length > 0 ? active : all;
  };

  const benchPlayers = () => {
    const active = selGoalTeamId === team1Id ? team1Active : team2Active;
    const all = selGoalTeamId === team1Id ? team1Players : team2Players;
    if (active.length === 0) return all;
    const onFieldIds = new Set(active.map((p) => p.id));
    return all.filter((p) => !onFieldIds.has(p.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {milestone && (
        <MilestonePopup
          milestone={milestone}
          onDismiss={onDismissRef.current}
        />
      )}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-100 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-2xl ${
            toast.type === "error"
              ? "bg-red-500"
              : toast.type === "success"
                ? "bg-green-500"
                : "bg-slate-700"
          } text-white`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex items-center bg-red-600 h-16 px-4">
        <ArrowLeft
          className="w-6 h-6 text-white cursor-pointer"
          size={24}
          onClick={() => navigate(-1)}
        />
        <h1 className="text-white font-semibold text-2xl ml-2">Match Center</h1>
      </div>

      <div className="flex justify-between mt-4 px-4 gap-2">
        {["Scoring", "Summary", "Events", "Info"].map((item) => (
          <button
            key={item}
            className={`flex-1 py-2 rounded-lg font-semibold text-base transition-colors ${
              activeTab === item
                ? "bg-red-600 text-white shadow"
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <hr className="my-3 border-gray-200" />

      {/* ══════════════════════════════════════════════════════
          SCORING TAB
         ══════════════════════════════════════════════════════ */}
      {activeTab === "Scoring" && (
        <PanelWrapper>
          <PanelHeading title="Live Scoring" />

          {isCompleted ? (
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-2xl p-6 shadow-md mb-4 gap-3">
              <Trophy className="text-yellow-500 w-16 h-16 mb-1" />
              <h2 className="text-2xl font-black text-red-600 tracking-wide">
                Match Completed!
              </h2>
              <div className="text-5xl font-black text-gray-800">
                {score.team1Score} – {score.team2Score}
              </div>
              <div className="flex gap-3 text-sm text-gray-500 font-semibold">
                <span className="text-blue-600">{team1Name}</span>
                <span>vs</span>
                <span className="text-rose-600">{team2Name}</span>
              </div>

              {score.team1Score > score.team2Score ? (
                <div className="mt-2 bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md text-center">
                  🏆 {team1Name} Wins!
                </div>
              ) : score.team2Score > score.team1Score ? (
                <div className="mt-2 bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md text-center">
                  🏆 {team2Name} Wins!
                </div>
              ) : (
                <div className="mt-2 bg-gray-200 text-gray-700 font-bold text-xl px-6 py-3 rounded-full text-center">
                  🤝 Match Drawn
                </div>
              )}

              <div className="w-full mt-3 grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="font-bold text-blue-600 text-sm mb-1">
                    {team1Name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Fouls: <strong>{score.team1Fouls}</strong>
                  </p>
                  <p className="text-xs text-gray-600">
                    🟩 {score.team1GreenCards} &nbsp; 🟨{" "}
                    {score.team1YellowCards} &nbsp; 🟥 {score.team1RedCards}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="font-bold text-rose-600 text-sm mb-1">
                    {team2Name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Fouls: <strong>{score.team2Fouls}</strong>
                  </p>
                  <p className="text-xs text-gray-600">
                    🟩 {score.team2GreenCards} &nbsp; 🟨{" "}
                    {score.team2YellowCards} &nbsp; 🟥 {score.team2RedCards}
                  </p>
                </div>
              </div>

              <button
                className="mt-2 w-full bg-red-600 text-white font-bold py-3 rounded-xl text-base"
                onClick={() => setActiveTab("Events")}
              >
                View Full Timeline →
              </button>
            </div>
          ) : (
            <>
              {/* Timer */}
              <div className="text-center mb-4">
                <span className="text-lg font-bold text-gray-500">
                  {score.currentPeriod === 1
                    ? "1st Period"
                    : score.currentPeriod === 2
                      ? "2nd Period"
                      : score.currentPeriod === 3
                        ? "3rd Period"
                        : "Extra Time"}{" "}
                  — {String(timer.mins).padStart(2, "0")}:
                  {String(timer.secs).padStart(2, "0")}
                </span>
              </div>

              {/* Scoreboard */}
              <div className="flex w-full items-center justify-between mb-4 border border-gray-200 rounded-xl p-3 bg-gray-50 shadow-sm">
                <div className="text-base sm:text-xl font-bold flex-1 text-center truncate px-1 text-blue-600">
                  {team1Name}
                </div>
                <div className="text-4xl sm:text-5xl font-black bg-white px-4 py-2 rounded-xl border border-gray-300 shadow-inner flex items-center gap-3">
                  <span>{score.team1Score}</span>
                  <span className="text-red-500 text-3xl">-</span>
                  <span>{score.team2Score}</span>
                </div>
                <div className="text-base sm:text-xl font-bold flex-1 text-center truncate px-1 text-rose-600">
                  {team2Name}
                </div>
              </div>

              {/* Fouls & Status Row */}
              <div className="flex justify-between items-center mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
                <span className="text-base font-semibold text-gray-600">
                  Fouls: <strong>{score.team1Fouls}</strong> –{" "}
                  <strong>{score.team2Fouls}</strong>
                </span>
                <span className="text-base font-semibold text-gray-600">
                  Status:{" "}
                  <strong className="text-red-600">
                    {score.status === "BREAK"
                      ? "BREAK"
                      : score.status === "COMPLETED"
                        ? "FT"
                        : score.status}
                  </strong>
                </span>
              </div>

              {/* Recent Events Strip */}
              <div className="flex flex-row overflow-x-auto w-full max-h-36 border border-gray-200 rounded-xl p-2 bg-gray-50 shadow-inner space-x-2 mb-4">
                {score.hockeyEvents
                  ?.slice(-10)
                  .reverse()
                  .map((ev, index) => (
                    <div
                      key={index}
                      className="flex flex-col flex-shrink-0 min-w-100px justify-center items-center text-sm border border-gray-200 rounded-lg p-2 bg-white cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        if (ev.id) setSelectedEventId(ev.id);
                      }}
                    >
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-xl">
                          {ev.eventType === "GOAL"
                            ? "🏑"
                            : ev.eventType === "FOUL"
                              ? "🛑"
                              : ev.eventType === "GREEN_CARD"
                                ? "🟩"
                                : ev.eventType === "YELLOW_CARD"
                                  ? "🟨"
                                  : ev.eventType === "RED_CARD"
                                    ? "🟥"
                                    : ev.eventType === "SUBSTITUTION"
                                      ? "🔄"
                                      : ev.eventType === "PENALTY_CORNER"
                                        ? "🎯"
                                        : ""}
                        </span>
                        <span className="font-semibold text-gray-500 text-xs">
                          {Math.floor(ev.eventTimeSeconds / 60)}'{" "}
                          {ev.period === 4
                            ? "(ET)"
                            : ev.period
                              ? `(P${ev.period})`
                              : ""}
                        </span>
                        {ev.id && <Camera size={12} className="text-sky-500" />}
                      </div>
                      <span className="truncate text-center font-bold text-gray-700 w-full text-xs">
                        {ev.scorerName || ev.playerId
                          ? `${ev.scorerName || ev.playerId}`
                          : ev.eventType?.replace(/_/g, " ") || "Event"}
                      </span>
                    </div>
                  ))}
                {(!score.hockeyEvents || score.hockeyEvents.length === 0) && (
                  <div className="text-center text-gray-400 py-4 font-semibold text-sm w-full">
                    No recent events
                  </div>
                )}
              </div>

              {/* ── ACTION PANEL ── */}
              {isAdminRef.current && !isCompleted && (
                <div
                  className={`flex flex-col gap-3 ${isWaiting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {!activeModal && (
                    <>
                      <button
                        className={UI_CLASSES.primaryBtn}
                        onClick={() => setActiveModal("goal")}
                      >
                        🏑 Record Goal
                      </button>
                      <button
                        className={UI_CLASSES.primaryBtn}
                        onClick={() => setActiveModal("foul")}
                      >
                        ⚠️ Record Foul / Card
                      </button>
                      <button
                        className={UI_CLASSES.primaryBtn}
                        onClick={() => setActiveModal("sub")}
                      >
                        🔄 Substitution
                      </button>
                      <button
                        className={UI_CLASSES.primaryBtn}
                        onClick={() => setActiveModal("period")}
                      >
                        ⏱ Period Control
                      </button>
                      <button
                        className="w-full bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md border border-red-200"
                        onClick={() => send({ undo: true })}
                      >
                        ↩ UNDO LAST EVENT
                      </button>
                      <button
                        onClick={() => setShowLineupEditor(true)}
                        className="w-full mt-2 py-2 rounded-xl text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                      >
                        ✏️ Edit Playing Lineup
                      </button>
                    </>
                  )}

                  {/* ── GOAL PANEL ── */}
                  {activeModal === "goal" && (
                    <div className="bg-red-600 p-3 rounded-xl shadow-md animate-fade-in">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-black text-sm">
                          🏑 Record Goal
                        </p>
                        <button
                          onClick={closeModal}
                          className="text-white font-bold text-xl leading-none"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <select
                          className={UI_CLASSES.selectCls}
                          value={selGoalTeamId || ""}
                          onChange={(e) =>
                            setSelGoalTeamId(Number(e.target.value))
                          }
                        >
                          <option value="">Select Team</option>
                          <option value={team1Id}>{team1Name}</option>
                          <option value={team2Id}>{team2Name}</option>
                        </select>
                        <select
                          className={UI_CLASSES.selectCls}
                          value={selGoalType || ""}
                          onChange={(e) => setSelGoalType(e.target.value)}
                        >
                          <option value="">Select Goal Type</option>
                          <option value="NORMAL">Normal / Field Goal</option>
                          <option value="PENALTY_CORNER">Penalty Corner</option>
                          <option value="PENALTY_STROKE">Penalty Stroke</option>
                          <option value="OWN_GOAL">Own Goal</option>
                        </select>
                        <select
                          className={UI_CLASSES.selectCls}
                          value={selPlayerId || ""}
                          onChange={(e) =>
                            setSelPlayerId(Number(e.target.value))
                          }
                        >
                          <option value="">Select Scorer</option>
                          {(selGoalTeamId
                            ? selGoalType === "OWN_GOAL"
                              ? selGoalTeamId === team1Id
                                ? team2Players
                                : team1Players
                              : onFieldPlayers()
                            : []
                          ).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <select
                          className={UI_CLASSES.selectCls}
                          value={selAssistId || ""}
                          onChange={(e) =>
                            setSelAssistId(Number(e.target.value))
                          }
                        >
                          <option value="">Assist (Optional)</option>
                          {onFieldPlayers()
                            .filter((p) => p.id !== selPlayerId)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                        <button
                          disabled={
                            !selGoalTeamId || !selGoalType || !selPlayerId
                          }
                          className={UI_CLASSES.confirmBtn}
                          onClick={() => {
                            send({
                              eventType:
                                selGoalType === "OWN_GOAL"
                                  ? "OWN_GOAL"
                                  : "GOAL",
                              goalType: selGoalType,
                              teamId: selGoalTeamId,
                              playerId: selPlayerId,
                              assistPlayerId: selAssistId || null,
                            });
                            closeModal();
                          }}
                        >
                          CONFIRM GOAL ✅
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── FOUL / CARD PANEL ── */}
                  {activeModal === "foul" && (
                    <div className="bg-orange-600 p-3 rounded-xl shadow-md animate-fade-in">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-black text-sm">
                          ⚠️ Record Foul / Card
                        </p>
                        <button
                          onClick={closeModal}
                          className="text-white font-bold text-xl leading-none"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <select
                          className={UI_CLASSES.selectCls}
                          value={selFoulTeamId || ""}
                          onChange={(e) =>
                            setSelFoulTeamId(Number(e.target.value))
                          }
                        >
                          <option value="">Select Team</option>
                          <option value={team1Id}>{team1Name}</option>
                          <option value={team2Id}>{team2Name}</option>
                        </select>
                        <select
                          className={UI_CLASSES.selectCls}
                          value={selCardType || ""}
                          onChange={(e) =>
                            setSelCardType(
                              e.target.value === "null" ? null : e.target.value,
                            )
                          }
                        >
                          <option value="">Select Card Type</option>
                          <option value="null">Foul (No Card)</option>
                          <option value="GREEN">🟩 Green Card (2-min)</option>
                          <option value="YELLOW">🟨 Yellow Card</option>
                          <option value="RED">🟥 Red Card</option>
                        </select>
                        <select
                          className={UI_CLASSES.selectCls}
                          value={selFoulPlayerId || ""}
                          onChange={(e) =>
                            setSelFoulPlayerId(Number(e.target.value))
                          }
                        >
                          <option value="">Select Player</option>
                          {(selFoulTeamId
                            ? selFoulTeamId === team1Id
                              ? team1Active.length > 0
                                ? team1Active
                                : team1Players
                              : team2Active.length > 0
                                ? team2Active
                                : team2Players
                            : []
                          ).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={!selFoulTeamId || !selFoulPlayerId}
                          className={UI_CLASSES.confirmBtn}
                          onClick={() => {
                            const evType =
                              selCardType === "GREEN"
                                ? "GREEN_CARD"
                                : selCardType === "YELLOW"
                                  ? "YELLOW_CARD"
                                  : selCardType === "RED"
                                    ? "RED_CARD"
                                    : "FOUL";
                            send({
                              eventType: evType,
                              cardType: selCardType,
                              teamId: selFoulTeamId,
                              playerId: selFoulPlayerId,
                            });
                            closeModal();
                          }}
                        >
                          CONFIRM FOUL ✅
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── PENALTY CORNER PANEL ── */}
                  {activeModal === "pc" && (
                    <div className="bg-blue-600 p-3 rounded-xl shadow-md animate-fade-in">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-black text-sm">
                          🎯 Penalty Corner
                        </p>
                        <button
                          onClick={closeModal}
                          className="text-white font-bold text-xl leading-none"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                            selPcTeamId === team1Id
                              ? "bg-white text-blue-600 border-white"
                              : "bg-blue-700 text-white border-blue-500"
                          }`}
                          onClick={() => setSelPcTeamId(team1Id)}
                        >
                          {team1Name}
                        </button>
                        <button
                          className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                            selPcTeamId === team2Id
                              ? "bg-white text-blue-600 border-white"
                              : "bg-blue-700 text-white border-blue-500"
                          }`}
                          onClick={() => setSelPcTeamId(team2Id)}
                        >
                          {team2Name}
                        </button>
                      </div>
                      <button
                        disabled={!selPcTeamId}
                        className={`w-full mt-2 ${UI_CLASSES.confirmBtn}`}
                        onClick={() => {
                          send({
                            eventType: "PENALTY_CORNER",
                            teamId: selPcTeamId,
                          });
                          closeModal();
                        }}
                      >
                        CONFIRM PENALTY CORNER ✅
                      </button>
                    </div>
                  )}

                  {/* ── SUBSTITUTION PANEL ── */}
                  {activeModal === "sub" && (
                    <div className="bg-slate-700 p-3 rounded-xl shadow-md animate-fade-in">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-black text-sm">
                          🔄 Substitution
                        </p>
                        <button
                          onClick={closeModal}
                          className="text-white font-bold text-xl leading-none"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <select
                          className={UI_CLASSES.selectCls}
                          value={selSubTeamId || ""}
                          onChange={(e) => {
                            setSelSubTeamId(Number(e.target.value));
                            setSelOutId(null);
                            setSelInId(null);
                          }}
                        >
                          <option value="">Select Team</option>
                          <option value={team1Id}>{team1Name}</option>
                          <option value={team2Id}>{team2Name}</option>
                        </select>
                        <select
                          className={UI_CLASSES.selectCls}
                          value={selOutId || ""}
                          onChange={(e) => setSelOutId(Number(e.target.value))}
                        >
                          <option value="">Player OUT</option>
                          {(selSubTeamId
                            ? selSubTeamId === team1Id
                              ? team1Active.length > 0
                                ? team1Active
                                : team1Players
                              : team2Active.length > 0
                                ? team2Active
                                : team2Players
                            : []
                          ).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <select
                          className={UI_CLASSES.selectCls}
                          value={selInId || ""}
                          onChange={(e) => setSelInId(Number(e.target.value))}
                        >
                          <option value="">Player IN</option>
                          {(selSubTeamId
                            ? (() => {
                                const onField =
                                  selSubTeamId === team1Id
                                    ? team1Active.length > 0
                                      ? team1Active
                                      : []
                                    : team2Active.length > 0
                                      ? team2Active
                                      : [];
                                const all =
                                  selSubTeamId === team1Id
                                    ? team1Players
                                    : team2Players;
                                const onFieldIds = new Set(
                                  onField.map((p) => p.id),
                                );
                                return all.filter(
                                  (p) =>
                                    !onFieldIds.has(p.id) && p.id !== selOutId,
                                );
                              })()
                            : []
                          ).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={!selSubTeamId || !selOutId || !selInId}
                          className={UI_CLASSES.confirmBtn}
                          onClick={() => {
                            send({
                              eventType: "SUBSTITUTION",
                              teamId: selSubTeamId,
                              outPlayerId: selOutId,
                              inPlayerId: selInId,
                            });
                            closeModal();
                          }}
                        >
                          CONFIRM SUB ✅
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── PERIOD CONTROL ── */}
                  {activeModal === "period" && (
                    <div className="bg-gray-800 p-3 rounded-xl shadow-md flex flex-col gap-2 animate-fade-in">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-black text-sm">
                          ⏱ Period Control
                        </p>
                        <button
                          onClick={closeModal}
                          className="text-white font-bold text-xl leading-none"
                        >
                          &times;
                        </button>
                      </div>
                      {isBreak ? (
                        <button
                          className={UI_CLASSES.confirmBtn}
                          onClick={() => {
                            send({ eventType: "START_NEXT_PERIOD" });
                            closeModal();
                          }}
                        >
                          ▶ Start Next Period
                        </button>
                      ) : (
                        <button
                          className="w-full bg-yellow-500 text-white p-3 rounded-lg font-black"
                          onClick={() => {
                            send({ eventType: "END_PERIOD" });
                            closeModal();
                          }}
                        >
                          🔔 End Period / Match
                        </button>
                      )}
                      {isExtraTime && (
                        <button
                          className={UI_CLASSES.confirmBtn}
                          onClick={() => {
                            send({ eventType: "EXTRA_TIME" });
                            closeModal();
                          }}
                        >
                          ⏱ Start Extra Time
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </PanelWrapper>
      )}

      {/* ══════════════════════════════════════════════════════
          SUMMARY TAB
         ══════════════════════════════════════════════════════ */}
      {activeTab === "Summary" && (
        <PanelWrapper>
          <PanelHeading title="Match Summary" />
          <table className="w-full border border-gray-300 text-center rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-red-50">
                <th className="border border-gray-300 p-2 text-lg text-blue-600 font-bold">
                  {team1Name}
                </th>
                <th className="border border-gray-300 p-2 text-lg text-gray-600 font-bold">
                  Stat
                </th>
                <th className="border border-gray-300 p-2 text-lg text-rose-600 font-bold">
                  {team2Name}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Goals", t1: score.team1Score, t2: score.team2Score },
                { label: "Fouls", t1: score.team1Fouls, t2: score.team2Fouls },
                {
                  label: "Green Cards 🟩",
                  t1: score.team1GreenCards,
                  t2: score.team2GreenCards,
                  cls: "text-green-600",
                },
                {
                  label: "Yellow Cards 🟨",
                  t1: score.team1YellowCards,
                  t2: score.team2YellowCards,
                  cls: "text-yellow-600",
                },
                {
                  label: "Red Cards 🟥",
                  t1: score.team1RedCards,
                  t2: score.team2RedCards,
                  cls: "text-red-600",
                },
                {
                  label: "Penalty Corners 🎯",
                  t1: score.team1PenaltyCorners,
                  t2: score.team2PenaltyCorners,
                  cls: "text-blue-600",
                },
              ].map(({ label, t1, t2, cls = "text-gray-800" }) => (
                <tr key={label}>
                  <td
                    className={`border border-gray-300 p-2 text-xl font-bold ${cls}`}
                  >
                    {t1}
                  </td>
                  <td className="border border-gray-300 p-2 text-base font-semibold text-gray-500 bg-gray-50">
                    {label}
                  </td>
                  <td
                    className={`border border-gray-300 p-2 text-xl font-bold ${cls}`}
                  >
                    {t2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelWrapper>
      )}

      {/* ══════════════════════════════════════════════════════
          EVENTS TAB
         ══════════════════════════════════════════════════════ */}
      {activeTab === "Events" && (
        <PanelWrapper>
          <PanelHeading title="Event Timeline" />
          <div className="space-y-2">
            {score.hockeyEvents
              ?.slice()
              .reverse()
              .map((ev, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border border-gray-200 rounded-xl p-3 bg-gray-50 shadow-sm"
                >
                  <div>
                    <p className="font-bold text-red-600 text-base flex items-center gap-2">
                      <span>{EVENT_CONFIG[ev.eventType]?.icon || "🔹"}</span>
                      <span>
                        {ev.eventType}{" "}
                        {ev.goalType && ev.goalType !== "NORMAL"
                          ? `(${ev.goalType})`
                          : ""}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {ev.scorerName ? `Scorer: ${ev.scorerName} ` : ""}
                      {ev.assistPlayerName
                        ? `(Assist: ${ev.assistPlayerName}) `
                        : ""}
                      {ev.inPlayerName
                        ? `In: ${ev.inPlayerName} Out: ${ev.outPlayerName} `
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-700">
                      {Math.floor(ev.eventTimeSeconds / 60)}'{" "}
                      {ev.period === 4
                        ? "ET"
                        : ev.period
                          ? `P${ev.period}`
                          : ""}
                    </p>
                  </div>
                </div>
              ))}
            {(!score.hockeyEvents || score.hockeyEvents.length === 0) && (
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
                    label: "Period Duration",
                    value: `${score.periodDurationMinutes} minutes`,
                    icon: "⏱",
                  },
                  {
                    label: "Current Period",
                    value: score.currentPeriod,
                    icon: "🔔",
                  },
                  {
                    label: "Current Time",
                    value: `${timer.mins}:${String(timer.secs).padStart(2, "0")}`,
                    icon: "⌚",
                  },
                  {
                    label: "Score",
                    value: `${score.team1Score} - ${score.team2Score}`,
                    icon: "🏑",
                  },
                  {
                    label: "Scorer ID",
                    value: scorerId || "N/A",
                    icon: "👤",
                  },
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

      {/* Media Modal */}
      {selectedEventId && (
        <Media
          ballId={selectedEventId}
          matchId={matchId}
          onClose={() => setSelectedEventId(null)}
        />
      )}
      {showLineupEditor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-sm">Edit Playing Lineup</h3>
              <button
                onClick={() => setShowLineupEditor(false)}
                className="text-slate-400"
              >
                ✕
              </button>
            </div>
            {/* Team 1 */}
            <p className="text-xs font-black text-emerald-600 uppercase mb-2">
              {team1Name}
            </p>
            <div className="grid grid-cols-2 gap-1 mb-4">
              {team1Players.map((p) => {
                const onField = team1Active.some((a) => a.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setTeam1Active((prev) =>
                        onField
                          ? prev.filter((a) => a.id !== p.id)
                          : [...prev, p],
                      );
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      onField
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent"
                    }`}
                  >
                    {p.name ?? p.playerName}
                  </button>
                );
              })}
            </div>
            {/* Team 2 */}
            <p className="text-xs font-black text-rose-600 uppercase mb-2">
              {team2Name}
            </p>
            <div className="grid grid-cols-2 gap-1 mb-4">
              {team2Players.map((p) => {
                const onField = team2Active.some((a) => a.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      setTeam2Active((prev) =>
                        onField
                          ? prev.filter((a) => a.id !== p.id)
                          : [...prev, p],
                      )
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      onField
                        ? "bg-rose-500 text-white border-rose-500"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent"
                    }`}
                  >
                    {p.name ?? p.playerName}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowLineupEditor(false)}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white text-sm font-black"
            >
              Save Lineup
            </button>
          </div>
        </div>
      )}
      {activeModal === "favPlayerModal" && (
        <FavouritePlayerModal
          matchId={matchId}
          team1Id={team1Id}
          team2Id={team2Id}
          team1Name={team1Name}
          team2Name={team2Name}
          team1Players={team1Players}
          team2Players={team2Players}
          onClose={() => {
            closeModal();
            setActiveTab("Summary");
          }}
        />
      )}
    </div>
  );
}
