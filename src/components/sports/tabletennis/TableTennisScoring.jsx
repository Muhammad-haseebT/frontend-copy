import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPlayersByTeamId } from "../../../api/teamApi";
import Media from "../cricket/modals/Media";
import FavouritePlayerModal from "../cricket/modals/FavouritePlayerModal";
import { ArrowLeft, Camera, Trophy } from "lucide-react";
import {
  PanelWrapper,
  PanelHeading,
  WizardHeader,
  ScoreCircles,
  UI_CLASSES,
} from "../common/ScoringUI";
import { getMatchAccess } from "../../../utils/accessControl";

const EV = {
  POINT: { icon: "🏓", label: "Point" },
  SMASH: { icon: "💥", label: "Smash" },
  SERVICE_ACE: { icon: "🎯", label: "Service Ace" },
  EDGE_BALL: { icon: "🎱", label: "Edge Ball" },
  NET_FAULT: { icon: "🔴", label: "Net Fault" },
  OUT: { icon: "⚡", label: "Out" },
  SERVICE_FAULT: { icon: "🟠", label: "Service Fault" },
  END_GAME: { icon: "🔔", label: "Game End" },
};

const SCORE_TYPES = [
  { key: "POINT", emoji: "🏓", label: "Rally Point", desc: "Team wins rally" },
  { key: "SMASH", emoji: "💥", label: "Smash", desc: "Winner via smash" },
  { key: "SERVICE_ACE", emoji: "🎯", label: "Service Ace", desc: "Direct ace" },
  { key: "EDGE_BALL", emoji: "🎱", label: "Edge Ball", desc: "Legal edge" },
];

const FAULT_TYPES = [
  {
    key: "NET_FAULT",
    emoji: "🔴",
    label: "Net Fault",
    desc: "Opponent gets point",
  },
  { key: "OUT", emoji: "⚡", label: "Ball Out", desc: "Opponent gets point" },
  {
    key: "SERVICE_FAULT",
    emoji: "🟠",
    label: "Service Fault",
    desc: "Opponent gets point",
  },
];

function useGameTimer(gameStartTime, status) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!gameStartTime || status !== "LIVE") {
      setElapsed(0);
      return;
    }
    const tick = () =>
      setElapsed(Math.floor((Date.now() - gameStartTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gameStartTime, status]);
  return {
    mins: String(Math.floor(elapsed / 60)).padStart(2, "0"),
    secs: String(elapsed % 60).padStart(2, "0"),
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────

export default function TableTennisScoring({
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
    team1Games: 0,
    team2Games: 0,
    currentGame: 1,
    status: "LIVE",
    gamesToWin: 4,
    pointsPerGame: 11,
    maxPoints: 0,
    pointsToWin: 11,
    gameStartTime: null,
    tableTennisEvents: [],
    comment: "",
  });

  const [team1P, setTeam1P] = useState([]);
  const [team2P, setTeam2P] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [wizStep, setWizStep] = useState(1);
  const [selEvent, setSelEvent] = useState(null);
  const [selTeam, setSelTeam] = useState(null);
  const [selPlayer, setSelPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [mediaId, setMediaId] = useState(null);
  const [showFav, setShowFav] = useState(false);

  const timer = useGameTimer(score.gameStartTime, score.status);

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
      if (d.team1Players?.length) setTeam1P(d.team1Players);
      if (d.team2Players?.length) setTeam2P(d.team2Players);
      setScore((p) => ({
        ...p,
        ...d,
        team1Games: Number(d.team1Games ?? p.team1Games),
        team2Games: Number(d.team2Games ?? p.team2Games),
      }));
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

  const closeModal = () => {
    setActiveModal(null);
    setWizStep(1);
    setSelEvent(null);
    setSelTeam(null);
    setSelPlayer(null);
  };

  const submitEvent = (skipPlayer = false) => {
    if (!selEvent || !selTeam) return;
    const p = { eventType: selEvent, teamId: selTeam };
    if (selPlayer && !skipPlayer) p.playerId = selPlayer;
    send(p);
    closeModal();
  };

  const activePlayers = () => (selTeam === team1Id ? team1P : team2P);
  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isCompleted = score.status === "COMPLETED";
  const gtw = Number(score.gamesToWin) || 4;
  const maxGames = gtw * 2 - 1;
  const totalPlayed =
    (Number(score.team1Games) || 0) + (Number(score.team2Games) || 0);
  const isDecider = totalPlayed === maxGames - 1;
  const gameLabel = isDecider ? "Decider" : `Game ${score.currentGame}`;
  const ptw = score.pointsToWin || 11;

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
        {["Scoring", "Summary", "Events", "Info"].map((item) => (
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
          <PanelHeading title="Live Scoring" />
          {isCompleted ? (
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-2xl p-6 shadow-md mb-4 gap-3">
              <Trophy className="text-yellow-500 w-16 h-16 mb-1" />
              <h2 className="text-2xl font-black text-red-600">
                Match Completed!
              </h2>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-600 mb-1">
                    {team1Name}
                  </p>
                  <ScoreCircles
                    size="sm"
                    won={Number(score.team1Games) || 0}
                    toWin={gtw}
                    color="blue"
                  />
                </div>
                <div className="text-3xl font-black text-gray-800 px-2">
                  {score.team1Games} – {score.team2Games}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-rose-600 mb-1">
                    {team2Name}
                  </p>
                  <ScoreCircles
                    size="sm"
                    won={Number(score.team2Games) || 0}
                    toWin={gtw}
                    color="rose"
                  />
                </div>
              </div>
              {(Number(score.team1Games) || 0) >
              (Number(score.team2Games) || 0) ? (
                <div className="mt-2 bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md">
                  🏆 {team1Name} Wins!
                </div>
              ) : (
                <div className="mt-2 bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md">
                  🏆 {team2Name} Wins!
                </div>
              )}
              <button
                className="mt-2 w-full bg-red-600 text-white font-bold py-3 rounded-xl"
                onClick={() => setActiveTab("Events")}
              >
                View Timeline →
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-3">
                <span className="text-lg font-bold text-gray-500">
                  {gameLabel} — {timer.mins}:{timer.secs}
                </span>
              </div>
              <div className="flex w-full items-center justify-between mb-2 border border-gray-200 rounded-xl px-3 pt-3 pb-2 bg-gray-50 shadow-sm">
                <div className="flex flex-col items-center flex-1 gap-1">
                  <p className="text-base sm:text-xl font-bold truncate text-blue-600">
                    {team1Name}
                  </p>
                  <ScoreCircles
                    size="sm"
                    won={Number(score.team1Games) || 0}
                    toWin={gtw}
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
                    size="sm"
                    won={Number(score.team2Games) || 0}
                    toWin={gtw}
                    color="rose"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
                <span className="text-sm font-semibold text-gray-600">
                  Games:{" "}
                  <strong className="text-red-600">
                    {score.team1Games}–{score.team2Games}
                  </strong>
                </span>
                <span className="text-sm font-semibold text-gray-600">
                  Target: <strong className="text-blue-600">{ptw}</strong>
                </span>
              </div>

              {/* Deuce indicator */}
              {score.team1Points >= score.pointsPerGame - 1 &&
                score.team2Points >= score.pointsPerGame - 1 && (
                  <div className="bg-blue-100 border border-blue-300 rounded-xl p-3 mb-3 text-center">
                    <span className="text-blue-700 font-black text-sm">
                      ⚔️ DEUCE — Lead by 2 to win
                    </span>
                  </div>
                )}

              <div className="flex flex-row overflow-x-auto w-full max-h-36 border border-gray-200 rounded-xl p-2 bg-gray-50 shadow-inner space-x-2 mb-4">
                {score.tableTennisEvents
                  ?.slice(-10)
                  .reverse()
                  .map((ev, i) => {
                    const cfg = EV[ev.eventType?.toUpperCase()] ?? {
                      icon: "📌",
                      label: ev.eventType,
                    };
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (ev.id) setMediaId(ev.id);
                        }}
                        className="flex flex-col flex-shrink-0 min-w-[100px] justify-center items-center text-sm border border-gray-200 rounded-lg p-2 bg-white cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-xl">{cfg.icon}</span>
                          <span className="text-gray-500 text-xs">
                            {ev.eventTimeSeconds != null
                              ? `${Math.floor(ev.eventTimeSeconds / 60)}'`
                              : "—"}{" "}
                            G{ev.gameNumber}
                          </span>
                          {ev.scoreSnapshot && (
                            <span className="text-[9px] text-gray-400">
                              ({ev.scoreSnapshot})
                            </span>
                          )}
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
                {(!score.tableTennisEvents ||
                  score.tableTennisEvents.length === 0) && (
                  <div className="text-center text-gray-400 py-4 font-semibold text-sm w-full">
                    No events yet
                  </div>
                )}
              </div>

              {!activeModal && isAdmin.current && (
                <div
                  className={`bg-red-600 p-3 rounded-xl shadow-md flex flex-col gap-3 ${waiting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <button
                    className={UI_CLASSES.primaryBtn}
                    onClick={() => {
                      setActiveModal("score");
                      setWizStep(1);
                    }}
                  >
                    🏓 Record Point
                  </button>
                  <button
                    className={UI_CLASSES.primaryBtn}
                    onClick={() => {
                      setActiveModal("fault");
                      setWizStep(1);
                    }}
                  >
                    ⚠️ Record Fault
                  </button>
                  <button
                    className="bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                    onClick={() => setActiveModal("endGame")}
                  >
                    🔔 End Game
                  </button>
                  <button
                    className="w-full bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                    onClick={() => send({ undo: true })}
                  >
                    UNDO LAST EVENT
                  </button>
                </div>
              )}

              {/* SCORE WIZARD */}
              {activeModal === "score" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="Record Point" onClose={closeModal} />
                  <div className="flex flex-col gap-3">
                    {wizStep === 1 && (
                      <select
                        className={UI_CLASSES.selectCls}
                        onChange={(e) => {
                          setSelEvent(e.target.value);
                          setWizStep(2);
                        }}
                      >
                        <option value="">Select Shot Type</option>
                        {SCORE_TYPES.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.emoji} {t.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {wizStep === 2 && (
                      <>
                        <select
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => {
                            setSelTeam(Number(e.target.value));
                            setWizStep(3);
                          }}
                        >
                          <option value="">Team that scored</option>
                          <option value={team1Id}>{team1Name}</option>
                          <option value={team2Id}>{team2Name}</option>
                        </select>
                        <button
                          className={UI_CLASSES.backBtn}
                          onClick={() => setWizStep(1)}
                        >
                          Back
                        </button>
                      </>
                    )}
                    {wizStep === 3 && (
                      <>
                        <select
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => setSelPlayer(Number(e.target.value))}
                        >
                          <option value="">Select Player (Optional)</option>
                          {activePlayers().map((p) => (
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
                          onClick={() => submitEvent(false)}
                        >
                          CONFIRM POINT
                        </button>
                        <button
                          className="w-full bg-gray-100 text-gray-600 p-3 rounded-lg text-base font-bold shadow-sm active:bg-gray-200 border border-gray-300"
                          onClick={() => submitEvent(true)}
                        >
                          Skip Player
                        </button>
                        <button
                          className={UI_CLASSES.backBtn}
                          onClick={() => setWizStep(2)}
                        >
                          Back
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* FAULT WIZARD */}
              {activeModal === "fault" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader
                    title="Record Fault (Opponent gets point)"
                    onClose={closeModal}
                  />
                  <div className="flex flex-col gap-3">
                    {wizStep === 1 && (
                      <select
                        className={UI_CLASSES.selectCls}
                        onChange={(e) => {
                          setSelEvent(e.target.value);
                          setWizStep(2);
                        }}
                      >
                        <option value="">Select Fault Type</option>
                        {FAULT_TYPES.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.emoji} {t.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {wizStep === 2 && (
                      <>
                        <select
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => {
                            setSelTeam(Number(e.target.value));
                            setWizStep(3);
                          }}
                        >
                          <option value="">Team that faulted</option>
                          <option value={team1Id}>{team1Name}</option>
                          <option value={team2Id}>{team2Name}</option>
                        </select>
                        <button
                          className={UI_CLASSES.backBtn}
                          onClick={() => setWizStep(1)}
                        >
                          Back
                        </button>
                      </>
                    )}
                    {wizStep === 3 && (
                      <>
                        <select
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => setSelPlayer(Number(e.target.value))}
                        >
                          <option value="">Select Player (Optional)</option>
                          {activePlayers().map((p) => (
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
                          onClick={() => submitEvent(false)}
                        >
                          CONFIRM FAULT
                        </button>
                        <button
                          className="w-full bg-gray-100 text-gray-600 p-3 rounded-lg text-base font-bold shadow-sm active:bg-gray-200 border border-gray-300"
                          onClick={() => submitEvent(true)}
                        >
                          Skip Player
                        </button>
                        <button
                          className={UI_CLASSES.backBtn}
                          onClick={() => setWizStep(2)}
                        >
                          Back
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* END GAME */}
              {activeModal === "endGame" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader
                    title={`End ${gameLabel}?`}
                    onClose={closeModal}
                  />
                  <p className="text-white text-sm text-center mb-3 font-semibold">
                    Current: {score.team1Points} – {score.team2Points}
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      className={UI_CLASSES.confirmBtn}
                      onClick={() => {
                        send({ eventType: "END_GAME" });
                        closeModal();
                      }}
                    >
                      CONFIRM END GAME
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
                {
                  label: "Games Won",
                  t1: score.team1Games,
                  t2: score.team2Games,
                },
                {
                  label: "Current Points",
                  t1: score.team1Points,
                  t2: score.team2Points,
                },
              ].map(({ label, t1, t2 }) => (
                <tr key={label}>
                  <td className="border border-gray-300 p-2 text-xl font-bold">
                    {t1}
                  </td>
                  <td className="border border-gray-300 p-2 text-base font-semibold text-gray-500 bg-gray-50">
                    {label}
                  </td>
                  <td className="border border-gray-300 p-2 text-xl font-bold">
                    {t2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelWrapper>
      )}

      {activeTab === "Events" && (
        <PanelWrapper>
          <PanelHeading title="Event Timeline" />
          <div className="space-y-2">
            {score.tableTennisEvents
              ?.slice()
              .reverse()
              .map((ev, i) => {
                const cfg = EV[ev.eventType?.toUpperCase()] ?? {
                  icon: "📌",
                  label: ev.eventType,
                };
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
                        {ev.scoreSnapshot ? `  ${ev.scoreSnapshot}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-700">
                        {ev.eventTimeSeconds != null
                          ? Math.floor(ev.eventTimeSeconds / 60)
                          : "—"}
                        ' G{ev.gameNumber}
                      </p>
                    </div>
                  </div>
                );
              })}
            {(!score.tableTennisEvents ||
              score.tableTennisEvents.length === 0) && (
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
                  { label: "Current Game", value: gameLabel, icon: "🏓" },
                  { label: "Games to Win", value: gtw, icon: "🏆" },
                  {
                    label: "Points Per Game",
                    value: score.pointsPerGame,
                    icon: "🔢",
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

      {mediaId && (
        <Media
          ballId={mediaId}
          matchId={matchId}
          onClose={() => setMediaId(null)}
        />
      )}
      {/* {showFav && (
        <FavouritePlayerModal
          matchId={matchId}
          team1Id={team1Id}
          team2Id={team2Id}
          team1Name={team1Name}
          team2Name={team2Name}
          team1Players={team1P}
          team2Players={team2P}
          onClose={() => setShowFav(false)}
        />
      )} */}
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
