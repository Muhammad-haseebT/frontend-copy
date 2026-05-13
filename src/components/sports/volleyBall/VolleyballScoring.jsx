import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPlayersByTeamId } from "../../../api/teamApi";
import Media from "../cricket/modals/Media";
import FavouritePlayerModal from "../cricket/modals/FavouritePlayerModal";
import {
  ArrowLeft,
  Camera,
  Trophy,
  RotateCcw,
  Flag,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import {
  PanelWrapper,
  PanelHeading,
  WizardHeader,
  ScoreCircles,
  UI_CLASSES,
} from "../common/ScoringUI";
import { getMatchAccess } from "../../../utils/accessControl";

// ─── EVENT CONFIG ─────────────────────────────────────────────────
const EV = {
  POINT: { icon: "🏐", label: "Rally Point" },
  ACE: { icon: "🎯", label: "Service Ace" },
  BLOCK: { icon: "🛡", label: "Block" },
  ATTACK_ERROR: { icon: "❌", label: "Attack Error" },
  SERVICE_ERROR: { icon: "⚡", label: "Service Error" },
  SUBSTITUTION: { icon: "↔", label: "Substitution" },
  TIMEOUT: { icon: "⏸", label: "Timeout" },
  END_SET: { icon: "🔔", label: "Set End" },
};

const POINT_TYPES = [
  { key: "POINT", emoji: "🏐", label: "Rally Point", desc: "Team wins rally" },
  { key: "ACE", emoji: "🎯", label: "Service Ace", desc: "+Point to server" },
  { key: "BLOCK", emoji: "🛡", label: "Block", desc: "+Point to blocker" },
  {
    key: "ATTACK_ERROR",
    emoji: "❌",
    label: "Attack Error",
    desc: "+Point to opponent",
  },
  {
    key: "SERVICE_ERROR",
    emoji: "⚡",
    label: "Service Error",
    desc: "+Point to opponent",
  },
];

// ─── TIMER ───────────────────────────────────────────────────────
function useSetTimer(setStartTime, status) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!setStartTime || status !== "LIVE") {
      setElapsed(0);
      return;
    }
    const tick = () =>
      setElapsed(Math.floor((Date.now() - setStartTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [setStartTime, status]);
  return {
    mins: String(Math.floor(elapsed / 60)).padStart(2, "0"),
    secs: String(elapsed % 60).padStart(2, "0"),
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────
export default function VolleyballScoring({
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
    team1Points: 0,
    team2Points: 0,
    team1Sets: 0,
    team2Sets: 0,
    currentSet: 1,
    status: "LIVE",
    team1Timeouts: 0,
    team2Timeouts: 0,
    setStartTime: null,
    setsToWin: 3,
    pointsToWin: 25,
    pointsPerSet: 25,
    finalSetPoints: 15,
    volleyballEvents: [],
    comment: "",
  });

  const [team1P, setTeam1P] = useState([]);
  const [team2P, setTeam2P] = useState([]);

  // modal state
  const [modal, setModal] = useState(null);
  const [step, setStep] = useState(1);
  const [selType, setSelType] = useState(null);
  const [selTeam, setSelTeam] = useState(null);
  const [selPlayer, setSelPlayer] = useState(null);
  const [selOut, setSelOut] = useState(null);
  const [selIn, setSelIn] = useState(null);
  const [subStep, setSubStep] = useState(1);

  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [mediaId, setMediaId] = useState(null);
  const [showLineupEditor, setShowLineupEditor] = useState(false);
  const [team1Active, setTeam1Active] = useState([]); // ← ADD
  const [team2Active, setTeam2Active] = useState([]);
  const benchPlayersVB = () => {
    const onField = selTeam === team1Id ? team1Active : team2Active;
    const all = selTeam === team1Id ? team1P : team2P;
    const ids = new Set(onField.map((p) => p.id));
    return all.filter((p) => !ids.has(p.id));
  };
  const timer = useSetTimer(score.setStartTime, score.status);

  useEffect(() => {
    const access = getMatchAccess(scorerId, mediaScorerUsername);
    isAdmin.current = access.canEditMatch;
  }, [scorerId, mediaScorerUsername]);

  useEffect(() => {
    if (score.status === "COMPLETED") {
      setActiveTab("Scoring");
      setModal("favPlayerModal");
    }
  }, [score.status]);

  useEffect(() => {
    if (status === "COMPLETED") {
      setModal("favPlayerModal");
    }
  }, [status]);

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
      if (d.team1OnField?.length) setTeam1Active(d.team1OnField);
      if (d.team2OnField?.length) setTeam2Active(d.team2OnField);
      setScore((p) => ({
        ...p,
        ...d,
        team1Sets: Number(d.team1Sets ?? p.team1Sets),
        team2Sets: Number(d.team2Sets ?? p.team2Sets),
        setsToWin: Number(d.setsToWin ?? p.setsToWin) || 3,
      }));
      setWaiting(false);
      if (d.comment === "UNDO") showToast("↩ Undo successful", "info");
      if (d.status === "COMPLETED") showToast("🏆 Match Complete!", "info");
    };
    ws.onerror = () => showToast("WebSocket error", "error");
    ws.onclose = () => (wsRef.current = null);
    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);
  const onFieldPlayers = () =>
    selTeam === team1Id ? team1Active : team2Active;
  const send = (payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      showToast("Not connected", "error");
      return;
    }
    setWaiting(true);
    wsRef.current.send(JSON.stringify({ matchId, ...payload }));
  };

  const closeModal = () => {
    setModal(null);
    setStep(1);
    setSubStep(1);
    setSelType(null);
    setSelTeam(null);
    setSelPlayer(null);
    setSelOut(null);
    setSelIn(null);
  };

  const submitPoint = (skipPlayer = false) => {
    if (!selType || !selTeam) return;
    const p = { eventType: selType, teamId: selTeam };
    if (selPlayer && !skipPlayer) p.playerId = selPlayer;
    send(p);
    closeModal();
  };

  const submitSub = () => {
    if (!selTeam || !selOut || !selIn) return;
    send({
      eventType: "SUBSTITUTION",
      teamId: selTeam,
      outPlayerId: selOut,
      inPlayerId: selIn,
    });
    closeModal();
  };

  const submitTimeout = (tid) => {
    send({ eventType: "TIMEOUT", teamId: tid });
    closeModal();
  };
  const submitEndSet = () => {
    send({ eventType: "END_SET" });
    closeModal();
  };

  const activePlayers = () => (selTeam === team1Id ? team1P : team2P);
  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isCompleted = score.status === "COMPLETED";
  const stw = Number(score.setsToWin) || 3;
  const maxSets = stw * 2 - 1;
  const totalPlayed =
    (Number(score.team1Sets) || 0) + (Number(score.team2Sets) || 0);
  const setLabel =
    totalPlayed === maxSets - 1 ? "Tiebreak" : `Set ${score.currentSet}`;

  // Futsal-style class strings

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-2xl text-sm font-bold shadow-2xl ${
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

      {/* Header */}
      <div className="flex items-center bg-red-600 h-16 px-4">
        <ArrowLeft
          className="w-6 h-6 text-white cursor-pointer"
          size={24}
          onClick={() => navigate(-1)}
        />
        <h1 className="text-white font-semibold text-2xl ml-2">Match Center</h1>
      </div>

      {/* Tab Bar */}
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

      {/* ══ SCORING TAB ══ */}
      {activeTab === "Scoring" && (
        <PanelWrapper>
          <PanelHeading title="Live Scoring" />

          {isCompleted ? (
            /* ── COMPLETED SCREEN ── */
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-2xl p-6 shadow-md mb-4 gap-3">
              <Trophy className="text-yellow-500 w-16 h-16 mb-1" />
              <h2 className="text-2xl font-black text-red-600 tracking-wide">
                Match Completed!
              </h2>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-600 mb-1">
                    {team1Name}
                  </p>
                  <ScoreCircles
                    won={Number(score.team1Sets) || 0}
                    toWin={stw}
                    color="blue"
                  />
                </div>
                <div className="text-3xl font-black text-gray-800 px-2">
                  {score.team1Sets} – {score.team2Sets}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-rose-600 mb-1">
                    {team2Name}
                  </p>
                  <ScoreCircles
                    won={Number(score.team2Sets) || 0}
                    toWin={stw}
                    color="rose"
                  />
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((score.team1Points / (score.pointsToWin || 25)) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                <div
                  className="bg-rose-500 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((score.team2Points / (score.pointsToWin || 25)) * 100, 100)}%`,
                  }}
                />
              </div>

              {(Number(score.team1Sets) || 0) >
              (Number(score.team2Sets) || 0) ? (
                <div className="mt-2 bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md text-center">
                  🏆 {team1Name} Wins!
                </div>
              ) : (Number(score.team2Sets) || 0) >
                (Number(score.team1Sets) || 0) ? (
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
                    Timeouts: <strong>{score.team1Timeouts}</strong>
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="font-bold text-rose-600 text-sm mb-1">
                    {team2Name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Timeouts: <strong>{score.team2Timeouts}</strong>
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
              {/* Timer + Set Label */}
              <div className="text-center mb-4">
                <span className="text-lg font-bold text-gray-500">
                  {setLabel} — {timer.mins}:{timer.secs}
                </span>
              </div>

              {/* Set circles + Scoreboard */}
              <div className="flex w-full items-center justify-between mb-2 border border-gray-200 rounded-xl px-3 pt-3 pb-1 bg-gray-50 shadow-sm">
                <div className="flex flex-col items-center flex-1 gap-1">
                  <p className="text-base sm:text-xl font-bold truncate text-blue-600">
                    {team1Name}
                  </p>
                  <ScoreCircles
                    won={Number(score.team1Sets) || 0}
                    toWin={stw}
                    color="blue"
                  />
                </div>
                <div className="text-4xl sm:text-5xl font-black bg-white px-4 py-2 rounded-xl border border-gray-300 shadow-inner flex items-center gap-3">
                  <span>{score.team1Points}</span>
                  <span className="text-red-500 text-3xl">-</span>
                  <span>{score.team2Points}</span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-1">
                  <p className="text-base sm:text-xl font-bold truncate text-rose-600">
                    {team2Name}
                  </p>
                  <ScoreCircles
                    won={Number(score.team2Sets) || 0}
                    toWin={stw}
                    color="rose"
                  />
                </div>
              </div>

              {/* Timeouts + Status */}
              <div className="flex justify-between items-center mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
                <span className="text-base font-semibold text-gray-600">
                  TOs: <strong>{score.team1Timeouts}</strong> –{" "}
                  <strong>{score.team2Timeouts}</strong>
                </span>
                <span className="text-base font-semibold text-gray-600">
                  Sets:{" "}
                  <strong className="text-red-600">
                    {score.team1Sets}–{score.team2Sets}
                  </strong>
                </span>
              </div>

              {/* Recent Events Strip */}
              <div className="flex flex-row overflow-x-auto w-full max-h-36 border border-gray-200 rounded-xl p-2 bg-gray-50 shadow-inner space-x-2 mb-4">
                {score.volleyballEvents
                  ?.slice(-10)
                  .reverse()
                  .map((ev, index) => {
                    const cfg = EV[ev.eventType?.toUpperCase()] ?? {
                      icon: "📌",
                      label: ev.eventType,
                    };
                    return (
                      <div
                        key={index}
                        className="flex flex-col flex-shrink-0 min-w-[100px] justify-center items-center text-sm border border-gray-200 rounded-lg p-2 bg-white cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          if (ev.id) setMediaId(ev.id);
                        }}
                      >
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-xl">{cfg.icon}</span>
                          <span className="font-semibold text-gray-500 text-xs">
                            {ev.eventTimeSeconds != null
                              ? `${Math.floor(ev.eventTimeSeconds / 60)}'`
                              : "—"}
                            {ev.setNumber ? ` (S${ev.setNumber})` : ""}
                          </span>
                          {ev.id && (
                            <Camera size={12} className="text-sky-500" />
                          )}
                        </div>
                        <span className="truncate text-center font-bold text-gray-700 w-full text-xs">
                          {ev.playerName || ev.teamName || cfg.label}
                        </span>
                      </div>
                    );
                  })}
                {(!score.volleyballEvents ||
                  score.volleyballEvents.length === 0) && (
                  <div className="text-center text-gray-400 py-4 font-semibold text-sm w-full">
                    No recent events
                  </div>
                )}
              </div>

              {/* ── ACTION PANEL ── */}
              {!modal && isAdmin.current && (
                <div
                  className={`bg-red-600 p-3 rounded-xl shadow-md flex flex-col gap-3 ${waiting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <button
                    className={UI_CLASSES.primaryBtn}
                    onClick={() => setModal("point")}
                  >
                    Record Point
                  </button>
                  <button
                    className={UI_CLASSES.primaryBtn}
                    onClick={() => setModal("sub")}
                  >
                    Substitution
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                      onClick={() => setModal("timeout")}
                    >
                      ⏸ Timeout
                    </button>
                    <button
                      className="bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                      onClick={() => setModal("endSet")}
                    >
                      🔔 End Set
                    </button>
                  </div>
                  <button
                    className="w-full bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 transition-colors border border-red-200"
                    onClick={() => send({ eventType: "UNDO" })}
                  >
                    UNDO LAST EVENT
                  </button>
                </div>
              )}
              {isAdmin.current && (
                <button
                  onClick={() => setShowLineupEditor(true)}
                  className="w-full mt-2 py-2 rounded-xl text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                >
                  ✏️ Edit Playing Lineup
                </button>
              )}
              {/* ── POINT WIZARD ── */}
              {modal === "point" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="Record Point" onClose={closeModal} />
                  <div className="flex flex-col gap-3">
                    {step === 1 && (
                      <select
                        className={UI_CLASSES.selectCls}
                        onChange={(e) => {
                          setSelType(e.target.value);
                          setStep(2);
                        }}
                      >
                        <option value="">Select Point Type</option>
                        {POINT_TYPES.map((pt) => (
                          <option key={pt.key} value={pt.key}>
                            {pt.emoji} {pt.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {step === 2 && (
                      <>
                        <select
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => {
                            setSelTeam(Number(e.target.value));
                            setStep(3);
                          }}
                        >
                          <option value="">
                            {["ATTACK_ERROR", "SERVICE_ERROR"].includes(selType)
                              ? "Team that made the error"
                              : "Team that scored"}
                          </option>
                          <option value={team1Id}>{team1Name}</option>
                          <option value={team2Id}>{team2Name}</option>
                        </select>
                        <button
                          className={UI_CLASSES.backBtn}
                          onClick={() => setStep(1)}
                        >
                          Back
                        </button>
                      </>
                    )}
                    {step === 3 && (
                      <>
                        <select
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => setSelPlayer(Number(e.target.value))}
                        >
                          <option value="">Select Player (Optional)</option>
                          {onFieldPlayers().map((p) => (
                            <option
                              key={p.id ?? p.playerId}
                              value={p.id ?? p.playerId}
                            >
                              {p.name ?? p.playerName}
                            </option>
                          ))}
                        </select>
                        <button
                          className={UI_CLASSES.confirmBtn}
                          onClick={() => submitPoint(false)}
                        >
                          CONFIRM POINT
                        </button>
                        <button
                          className="w-full bg-gray-100 text-gray-600 p-3 rounded-lg text-base font-bold shadow-sm active:bg-gray-200 border border-gray-300"
                          onClick={() => submitPoint(true)}
                        >
                          Skip Player & Confirm
                        </button>
                        <button
                          className={UI_CLASSES.backBtn}
                          onClick={() => setStep(2)}
                        >
                          Back
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── TIMEOUT WIZARD ── */}
              {modal === "timeout" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="Timeout" onClose={closeModal} />
                  <div className="flex flex-col gap-3">
                    <button
                      className={UI_CLASSES.confirmBtn}
                      disabled={score.team1Timeouts >= 2}
                      onClick={() => submitTimeout(team1Id)}
                    >
                      {team1Name} Timeout
                    </button>
                    <button
                      className={UI_CLASSES.confirmBtn}
                      disabled={score.team2Timeouts >= 2}
                      onClick={() => submitTimeout(team2Id)}
                    >
                      {team2Name} Timeout
                    </button>
                    <button className={UI_CLASSES.backBtn} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── SUB WIZARD ── */}
              {modal === "sub" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="Substitution" onClose={closeModal} />
                  <div className="flex flex-col gap-3">
                    {subStep === 1 && (
                      <select
                        className={UI_CLASSES.selectCls}
                        onChange={(e) => {
                          setSelTeam(Number(e.target.value));
                          setSubStep(2);
                        }}
                      >
                        <option value="">Select Team</option>
                        <option value={team1Id}>{team1Name}</option>
                        <option value={team2Id}>{team2Name}</option>
                      </select>
                    )}
                    {subStep === 2 && (
                      <>
                        <select
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => {
                            setSelOut(Number(e.target.value));
                            setSubStep(3);
                          }}
                        >
                          <option value="">Select Player OUT</option>
                          {onFieldPlayers().map((p) => (
                            <option
                              key={p.id ?? p.playerId}
                              value={p.id ?? p.playerId}
                            >
                              {p.name ?? p.playerName}
                            </option>
                          ))}
                        </select>
                        <button
                          className={UI_CLASSES.backBtn}
                          onClick={() => setSubStep(1)}
                        >
                          Back
                        </button>
                      </>
                    )}
                    {subStep === 3 && (
                      <>
                        <select
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => setSelIn(Number(e.target.value))}
                        >
                          <option value="">Select Player IN</option>
                          {benchPlayersVB().map((p) => (
                            <option
                              key={p.id ?? p.playerId}
                              value={p.id ?? p.playerId}
                            >
                              {p.name ?? p.playerName}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={!selIn}
                          className={UI_CLASSES.confirmBtn}
                          onClick={submitSub}
                        >
                          CONFIRM SUB
                        </button>
                        <button
                          className={UI_CLASSES.backBtn}
                          onClick={() => setSubStep(2)}
                        >
                          Back
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── END SET WIZARD ── */}
              {modal === "endSet" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader
                    title={`End ${setLabel}?`}
                    onClose={closeModal}
                  />
                  <p className="text-white text-sm text-center mb-3 font-semibold">
                    Current: {score.team1Points} – {score.team2Points}
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      className={UI_CLASSES.confirmBtn}
                      onClick={submitEndSet}
                    >
                      CONFIRM END SET
                    </button>
                    <button className={UI_CLASSES.backBtn} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </PanelWrapper>
      )}

      {/* ══ SUMMARY TAB ══ */}
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
                { label: "Sets Won", t1: score.team1Sets, t2: score.team2Sets },
                {
                  label: "Current Points",
                  t1: score.team1Points,
                  t2: score.team2Points,
                },
                {
                  label: "Timeouts Used",
                  t1: score.team1Timeouts,
                  t2: score.team2Timeouts,
                  cls: "text-amber-600",
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

      {/* ══ EVENTS TAB ══ */}
      {activeTab === "Events" && (
        <PanelWrapper>
          <PanelHeading title="Event Timeline" />
          <div className="space-y-2">
            {score.volleyballEvents
              ?.slice()
              .reverse()
              .map((ev, i) => {
                const cfg = EV[ev.eventType?.toUpperCase()] ?? {
                  icon: "📌",
                  label: ev.eventType,
                };
                const mins =
                  ev.eventTimeSeconds != null
                    ? Math.floor(ev.eventTimeSeconds / 60)
                    : "—";
                return (
                  <div
                    key={i}
                    className="flex justify-between items-center border border-gray-200 rounded-xl p-3 bg-gray-50 shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-red-600 text-base">
                        {cfg.icon} {cfg.label}
                      </p>
                      <p className="text-sm text-gray-600">
                        {ev.playerName ? `Player: ${ev.playerName} ` : ""}
                        {ev.teamName ? `(${ev.teamName})` : ""}
                        {ev.inPlayerName
                          ? `In: ${ev.inPlayerName} Out: ${ev.outPlayerName}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-700">
                        {mins}' {ev.setNumber ? `S${ev.setNumber}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            {(!score.volleyballEvents ||
              score.volleyballEvents.length === 0) && (
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
                  { label: "Current Set", value: setLabel, icon: "🏐" },
                  { label: "Sets to Win", value: stw, icon: "🏆" },
                  {
                    label: "Points Per Set",
                    value: score.pointsPerSet,
                    icon: "🔢",
                  },
                  {
                    label: "Final Set Points",
                    value: score.finalSetPoints,
                    icon: "🏁",
                  },
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

      {/* Media Modal */}
      {mediaId && (
        <Media
          ballId={mediaId}
          matchId={matchId}
          onClose={() => setMediaId(null)}
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
              {team1P.map((p) => {
                const onField = team1Active.some((a) => a.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      // Send substitution to toggle on/off — or just local state
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
              {team2P.map((p) => {
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
      {modal === "favPlayerModal" && (
        <FavouritePlayerModal
          matchId={matchId}
          team1Id={team1Id}
          team2Id={team2Id}
          team1Name={team1Name}
          team2Name={team2Name}
          team1Players={team1P}
          team2Players={team2P}
          onClose={() => {
            closeModal();
            setActiveTab("Summary");
          }}
        />
      )}
    </div>
  );
}
