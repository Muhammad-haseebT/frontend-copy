import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { startmatch, abondonMatch } from "../../api/matchApi";
import { getPlayersByTeamId } from "../../api/teamApi";
import {
  Trophy,
  MapPin,
  Calendar,
  Clock,
  Hash,
  User,
  AlertTriangle,
  ChevronRight,
  Zap,
} from "lucide-react";
import CricketScoring from "../../components/sports/cricket/CricketScoring";
import FutsalScoring from "../../components/sports/football/FutsalScoring.jsx";
import VolleyballScoring from "../../components/sports/volleyBall/VolleyballScoring.jsx";
import BadmintonScoring from "../../components/sports/badminton/BadmintonScoring.jsx";
import TableTennisScoring from "../../components/sports/tabletennis/TableTennisScoring.jsx";
import TugOfWarScoring from "../../components/sports/TugOfWar/TugOfWarScoring.jsx";
import LudoScoring from "../../components/sports/ludo/LudoScoring.jsx";
import ChessScoring from "../../components/sports/chess/ChessScoring.jsx";
import { getMatchAccess } from "../../utils/accessControl";
// Sport index matches DB sportId
const SPORTS = [
  "Cricket", // 1
  "Futsal", // 2
  "Volleyball", // 3
  "TableTennis", // 4
  "Badminton", // 5
  "Ludo", // 6
  "Tug Of War", // 7
  "Chess", // 8
];

export default function MatchScoreRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    matchId,
    status,
    team1Id,
    team2Id,
    battingTeamId,
    team1Name,
    team2Name,
    battingTeamName,
    sportId,
    inningsId,
    venue,
    match,
  } = location.state || {};

  // Toss / scorer
  const [futsalHalfMins, setFutsalHalfMins] = useState(20);
  const [tossWinner, setTossWinner] = useState(null);
  const [tossWinnerId, setTossWinnerId] = useState(null);
  const [decision, setDecision] = useState(null);
  const [starting, setStarting] = useState(false);
  const [scorerUsername, setScorerUsername] = useState("");
  const [t1Id, setT1Id] = useState(team1Id);
  const [t2Id, setT2Id] = useState(team2Id);
  const [squadTeam1, setSquadTeam1] = useState([]);
  const [squadTeam2, setSquadTeam2] = useState([]);
  const [team1Playing, setTeam1Playing] = useState(new Set());
  const [team2Playing, setTeam2Playing] = useState(new Set());
  const [bdFormat, setBdFormat] = useState("singles"); // "singles" | "doubles"
  const [ttFormat, setTtFormat] = useState("singles");
  const [ludoFormat, setLudoFormat] = useState(match?.matchFormat || "1v1");
  const [chessFormat, setChessFormat] = useState(match?.matchFormat || "1v1");
  const [squadLoaded, setSquadLoaded] = useState(false);
  // Volleyball config
  const [vbSets, setVbSets] = useState(3);
  const [vbPointsPerSet, setVbPointsPerSet] = useState(25);
  const [vbFinalSetPoints, setVbFinalSetPoints] = useState(15);

  // ✅ Badminton config (scorable — user picks values)
  const [bdGames, setBdGames] = useState(2);
  const [bdPointsPerGame, setBdPointsPerGame] = useState(21);
  const [bdMaxPoints, setBdMaxPoints] = useState(30);

  // Table Tennis config
  const [ttGames, setTtGames] = useState(4);
  const [ttPointsPerGame, setTtPointsPerGame] = useState(11);

  // Tug of War config
  const [towRounds, setTowRounds] = useState(3);

  const currentSport = SPORTS[sportId - 1];

  console.log("Sport", currentSport);
  const isCricket = currentSport === "Cricket";
  const isFutsal = currentSport === "Futsal";
  const isVB = currentSport === "Volleyball";
  const isBD = currentSport === "Badminton";
  const isTT = currentSport === "TableTennis";
  const isTOW = currentSport === "Tug Of War";
  const isLudo = currentSport === "Ludo";
  const isChess = currentSport === "Chess";
  const needsLineup = isFutsal || isVB || isBD || isTT || isLudo || isChess;
  const { canEditMatch } = getMatchAccess(
    match?.scorerId,
    match?.mediaScorerUsername,
  );
  useEffect(() => {
    if (!needsLineup || status !== "UPCOMING") return;
    Promise.all([
      getPlayersByTeamId(team1Id),
      getPlayersByTeamId(team2Id),
    ]).then(([a, b]) => {
      setSquadTeam1(a || []);
      setSquadTeam2(b || []);
      setSquadLoaded(true);
    });
  }, [needsLineup, status, team1Id, team2Id]);

  const togglePlayer = (teamSetter, id) =>
    teamSetter((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const maxSelect = (sport) => {
    if (sport === "bd") return bdFormat === "singles" ? 1 : 2;
    if (sport === "tt") return ttFormat === "singles" ? 1 : 2;
    if (sport === "ludo") return ludoFormat === "1v1" ? 1 : 2;
    if (sport === "chess") return chessFormat === "1v1" ? 1 : 2;
    return Infinity;
  };
  if (!location.state) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        No match data found.
      </div>
    );
  }

  if (status === "UPCOMING" && !canEditMatch) {
    return (
      <div className="h-screen w-full bg-[#f8f9fa] dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 text-center shadow-xl">
          <AlertTriangle className="mx-auto text-amber-500 mb-3" size={36} />
          <h2 className="text-xl font-black mb-2">Viewer Access</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            This match is not live yet. Only admin, assigned scorer, or assigned
            media person can set up and start it.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-5 bg-red-600 text-white px-5 py-2 rounded-xl font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleAbandon = () =>
    Swal.fire({
      title: "Are you sure?",
      text: "Match will be abandoned",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, abandon it!",
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await abondonMatch(matchId);
        Swal.fire("Abandoned!", "Match has been abandoned", "success").then(
          () => navigate(-1),
        );
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: err?.response?.data?.message || "Failed to abandon match.",
          icon: "error",
        });
      }
    });

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  );

  // ── Reusable components ───────────────────────────────────────
  const DetailCard = ({ icon: Icon, label, value, accent }) => (
    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-3 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
        <Icon size={16} className={accent} />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase font-bold">
          {label}
        </p>
        <p className="text-xs font-semibold">{value}</p>
      </div>
    </div>
  );

  const NumStepper = ({ label, value, onChange, min = 1, accent }) => (
    <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-700">
      <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 font-black text-lg flex items-center justify-center active:scale-90"
        >
          −
        </button>
        <span className={`flex-1 text-center text-xl font-black ${accent}`}>
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 font-black text-lg flex items-center justify-center active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );

  const TeamHeader = ({ shadow, vs, subtitle, c1, c2 }) => (
    <div
      className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl ${shadow} border border-slate-100 dark:border-slate-700 relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Trophy size={64} />
      </div>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col items-center flex-1">
          <div
            className={`w-16 h-16 rounded-2xl ${c1} flex items-center justify-center font-bold text-2xl mb-2 border`}
          >
            {team1Name?.substring(0, 2).toUpperCase()}
          </div>
          <h3 className="text-sm font-bold text-center line-clamp-1">
            {team1Name}
          </h3>
        </div>
        <div className="px-4 flex flex-col items-center">
          <div
            className={`${vs} text-white text-xs font-black px-3 py-1 rounded-full mb-1`}
          >
            VS
          </div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            {subtitle}
          </div>
        </div>
        <div className="flex flex-col items-center flex-1">
          <div
            className={`w-16 h-16 rounded-2xl ${c2} flex items-center justify-center font-bold text-2xl mb-2 border`}
          >
            {team2Name?.substring(0, 2).toUpperCase()}
          </div>
          <h3 className="text-sm font-bold text-center line-clamp-1">
            {team2Name}
          </h3>
        </div>
      </div>
    </div>
  );

  const TossButtons = ({ accentActive, hoverBorder }) => (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Zap size={14} className={accentActive} />
        <span className={accentActive}>Who Serves / Starts?</span>
      </label>
      <div className="flex gap-2">
        {[team1Name, team2Name].map((team, idx) => (
          <button
            key={idx}
            onClick={() => {
              setTossWinnerId(team === team1Name ? team1Id : team2Id);
              setTossWinner(team);
            }}
            className={`flex-1 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${
              tossWinner === team
                ? `${accentActive.replace("text-", "bg-").replace("-600", "-600")} border-current text-white shadow-lg`
                : `bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 ${hoverBorder}`
            }`}
          >
            {team}
          </button>
        ))}
      </div>
    </div>
  );

  const StartBtn = ({ label, bg, shadow, disabled: dis, onClick }) => (
    <div className="pt-2 flex flex-col gap-2">
      <button
        disabled={dis || starting}
        onClick={onClick}
        className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
          !dis && !starting
            ? `${bg} text-white shadow-xl ${shadow} hover:-translate-y-1 active:scale-95`
            : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
        }`}
      >
        {starting ? (
          <Spinner />
        ) : (
          <>
            {label} <ChevronRight size={18} />
          </>
        )}
      </button>
      <button
        className="w-full py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2"
        onClick={handleAbandon}
      >
        <AlertTriangle size={14} /> Abandon Match
      </button>
    </div>
  );
  const PlayerLinePicker = ({ sport, accentColor }) => {
    const max = maxSelect(sport);
    const renderTeam = (teamName, squad, playing, setPlaying) => (
      <div className="flex-1">
        <p
          className={`text-xs font-black uppercase tracking-widest mb-2 ${accentColor}`}
        >
          {teamName}{" "}
          <span className="text-slate-400 font-medium">
            ({playing.size}/{max === Infinity ? squad.length : max})
          </span>
        </p>
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {squad.map((p) => {
            const sel = playing.has(p.id);
            const disabled = !sel && playing.size >= max;
            return (
              <button
                key={p.id}
                disabled={disabled}
                onClick={() => togglePlayer(setPlaying, p.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  sel
                    ? `${accentColor.replace("text-", "bg-").replace("-600", "-600")} text-white border-current`
                    : disabled
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-300 border-transparent cursor-not-allowed"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-current"
                }`}
              >
                {p.name ?? p.playerName ?? "Player"}
              </button>
            );
          })}
          {squad.length === 0 && (
            <p className="text-xs text-slate-400 italic p-2">
              No players found in squad
            </p>
          )}
        </div>
      </div>
    );

    if (!squadLoaded)
      return (
        <div className="text-xs text-slate-400 text-center py-3">
          Loading squad...
        </div>
      );

    return (
      <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 space-y-3">
        <p
          className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${accentColor}`}
        >
          <User size={14} /> Select Playing Squad
        </p>
        {/* Format picker for badminton/TT */}
        {(sport === "bd" || sport === "tt") && (
          <div className="flex gap-2">
            {["singles", "doubles"].map((f) => {
              const current = sport === "bd" ? bdFormat : ttFormat;
              const setter = sport === "bd" ? setBdFormat : setTtFormat;
              return (
                <button
                  key={f}
                  onClick={() => {
                    setter(f);
                    setTeam1Playing(new Set());
                    setTeam2Playing(new Set());
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    current === f
                      ? `${accentColor.replace("text-", "bg-")} text-white border-current`
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {f === "singles" ? "Singles (1v1)" : "Doubles (2v2)"}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex gap-3">
          {renderTeam(team1Name, squadTeam1, team1Playing, setTeam1Playing)}
          {renderTeam(team2Name, squadTeam2, team2Playing, setTeam2Playing)}
        </div>
      </div>
    );
  };
  return (
    <div className="h-screen w-full bg-[#f8f9fa] dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] overflow-hidden flex flex-col">
      {/* ══ CRICKET ══════════════════════════════════════════════ */}
      {isCricket && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <CricketScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            bTeamId={battingTeamId}
            team1Name={team1Name}
            team2Name={team2Name}
            battingTeamName={battingTeamName}
            inningsId={inningsId}
            scorerId={match?.scorerId}
            mediaScorerUsername={match?.mediaScorerUsername}
          />
        </div>
      )}
      {isCricket && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-red-500/10"
            vs="bg-red-600"
            subtitle="Match Setup"
            c1="bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-900/30"
            c2="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30"
          />
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-red-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-red-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-red-500"
            />
            <DetailCard
              icon={Hash}
              label="Overs"
              value={`${match?.overs} Overs`}
              accent="text-red-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-red-600" />
              <span className="text-red-600">Who Won The Toss?</span>
            </label>
            <div className="flex gap-2">
              {[team1Name, team2Name].map((team, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTossWinnerId(team === team1Name ? team1Id : team2Id);
                    setTossWinner(team);
                    setT1Id(team1Id);
                    setT2Id(team2Id);
                  }}
                  className={`flex-1 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${tossWinner === team ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/30" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-200"}`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>
          <div
            className={`space-y-2 transition-all duration-500 ${tossWinner ? "opacity-100" : "opacity-30 pointer-events-none"}`}
          >
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Trophy size={14} className="text-green-500" /> {tossWinner}{" "}
              Decided To?
            </label>
            <div className="flex gap-2">
              {["Bat", "Bowl"].map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => setDecision(choice)}
                  className={`flex-1 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${decision === choice ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/30" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-green-200"}`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className={`w-full py-3 px-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 `}
              placeholder="Enter scorer username"
            />
          </div>
          <StartBtn
            label="Start Match"
            bg="bg-red-600"
            shadow="shadow-red-500/40"
            disabled={!tossWinner || !decision}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision,
                  scorerId: scorerUsername,
                  sportId,
                  inningsId,
                  overs: match?.overs,
                  team1Id: t1Id,
                  team2Id: t2Id,
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ FUTSAL ════════════════════════════════════════════════ */}
      {isFutsal && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <FutsalScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
            scorerId={match?.scorerId}
            mediaScorerUsername={match?.mediaScorerUsername}
          />
        </div>
      )}
      {isFutsal && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-emerald-500/10"
            vs="bg-emerald-600"
            subtitle="Futsal Setup"
            c1="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30"
            c2="bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-900/30"
          />
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-emerald-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-emerald-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-emerald-500"
            />
            <DetailCard
              icon={Hash}
              label="Half Duration"
              value={futsalHalfMins}
              accent="text-emerald-500"
            />
          </div>
          <PlayerLinePicker sport="futsal" accentColor="text-emerald-600" />
          <NumStepper
            label="Half Duration (minutes)"
            value={futsalHalfMins}
            onChange={setFutsalHalfMins}
            min={5}
            accent="text-green-600"
          />
          <TossButtons
            accentActive="text-emerald-600"
            hoverBorder="hover:border-emerald-200"
          />
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className={`w-full py-3 px-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 `}
              placeholder="Enter scorer username"
            />
          </div>
          <StartBtn
            label="⚽ Start Futsal Match"
            bg="bg-emerald-600"
            shadow="shadow-emerald-500/40"
            disabled={!tossWinner}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "KICK",
                  scorerId: scorerUsername,
                  sportId,
                  halfDurationMins: futsalHalfMins, // ← add this
                  team1PlayingIds: [...team1Playing],
                  team2PlayingIds: [...team2Playing],
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ VOLLEYBALL ════════════════════════════════════════════ */}
      {isVB && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <VolleyballScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
            scorerId={match?.scorerId}
            mediaScorerUsername={match?.mediaScorerUsername}
          />
        </div>
      )}
      {isVB && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-violet-500/10"
            vs="bg-violet-600"
            subtitle="Volleyball Setup"
            c1="bg-violet-50 dark:bg-violet-900/20 text-violet-600 border-violet-100 dark:border-violet-900/30"
            c2="bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-900/30"
          />
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-violet-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-violet-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-violet-500"
            />
            <DetailCard
              icon={Hash}
              label="Format"
              value={`Best of ${vbSets * 2 - 1}`}
              accent="text-violet-500"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Match Configuration
            </p>
            <div className="grid grid-cols-3 gap-2">
              <NumStepper
                label="Sets to Win"
                value={vbSets}
                onChange={setVbSets}
                min={1}
                accent="text-violet-600"
              />
              <NumStepper
                label="Points/Set"
                value={vbPointsPerSet}
                onChange={setVbPointsPerSet}
                min={5}
                accent="text-violet-600"
              />
              <NumStepper
                label="Final Set Pts"
                value={vbFinalSetPoints}
                onChange={setVbFinalSetPoints}
                min={5}
                accent="text-violet-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-1">
              Best of {vbSets * 2 - 1} · {vbPointsPerSet} pts ·{" "}
              {vbFinalSetPoints} pts tiebreak
            </p>
          </div>
          <PlayerLinePicker sport="futsal" accentColor="text-emerald-600" />
          <TossButtons
            accentActive="text-violet-600"
            hoverBorder="hover:border-violet-200"
          />
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className={`w-full py-3 px-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 `}
              placeholder="Enter scorer username"
            />
          </div>
          <StartBtn
            label="🏐 Start Volleyball Match"
            bg="bg-violet-600"
            shadow="shadow-violet-500/40"
            disabled={!tossWinner}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "SERVE",
                  scorerId: scorerUsername,
                  sportId,
                  sets: vbSets,
                  pointsPerSet: vbPointsPerSet,
                  finalSetPoints: vbFinalSetPoints,
                  team1PlayingIds: [...team1Playing],
                  team2PlayingIds: [...team2Playing],
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ BADMINTON ═════════════════════════════════════════════ */}
      {isBD && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <BadmintonScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
            scorerId={match?.scorerId}
            mediaScorerUsername={match?.mediaScorerUsername}
          />
        </div>
      )}
      {isBD && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-violet-500/10"
            vs="bg-violet-600"
            subtitle="Badminton Setup"
            c1="bg-violet-50 dark:bg-violet-900/20 text-violet-600 border-violet-100 dark:border-violet-900/30"
            c2="bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-900/30"
          />
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-violet-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-violet-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-violet-500"
            />
            <DetailCard
              icon={Hash}
              label="Format"
              value={`Best of ${bdGames * 2 - 1}`}
              accent="text-violet-500"
            />
          </div>
          {/* ✅ Badminton config — user picks values (same pattern as volleyball) */}
          <div className="space-y-1">
            <p className="text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Match Configuration
            </p>
            <div className="grid grid-cols-3 gap-2">
              <NumStepper
                label="Games to Win"
                value={bdGames}
                onChange={setBdGames}
                min={1}
                accent="text-violet-600"
              />
              <NumStepper
                label="Points/Game"
                value={bdPointsPerGame}
                onChange={setBdPointsPerGame}
                min={5}
                accent="text-violet-600"
              />
              <NumStepper
                label="Max Pts (Deuce)"
                value={bdMaxPoints}
                onChange={setBdMaxPoints}
                min={bdPointsPerGame + 1}
                accent="text-violet-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-1">
              Best of {bdGames * 2 - 1} · {bdPointsPerGame} pts · Deuce cap:{" "}
              {bdMaxPoints}
            </p>
          </div>
          <PlayerLinePicker sport="bd" accentColor="text-violet-600" />
          <TossButtons
            accentActive="text-violet-600"
            hoverBorder="hover:border-violet-200"
          />
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className={`w-full py-3 px-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 `}
              placeholder="Enter scorer username"
            />
          </div>
          <StartBtn
            label="🏸 Start Badminton Match"
            bg="bg-violet-600"
            shadow="shadow-violet-500/40"
            disabled={!tossWinner}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "SERVE",
                  scorerId: scorerUsername,
                  sportId,
                  sets: bdGames,
                  pointsPerSet: bdPointsPerGame,
                  finalSetPoints: bdMaxPoints,
                  team1PlayingIds: [...team1Playing],
                  team2PlayingIds: [...team2Playing],
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ TABLE TENNIS ══════════════════════════════════════════ */}
      {isTT && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <TableTennisScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
            scorerId={match?.scorerId}
            mediaScorerUsername={match?.mediaScorerUsername}
          />
        </div>
      )}
      {isTT && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-blue-500/10"
            vs="bg-blue-600"
            subtitle="Table Tennis Setup"
            c1="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30"
            c2="bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-900/30"
          />
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-blue-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-blue-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-blue-500"
            />
            <DetailCard
              icon={Hash}
              label="Format"
              value={`Best of ${ttGames * 2 - 1}`}
              accent="text-blue-500"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Match Configuration
            </p>
            <div className="grid grid-cols-2 gap-2">
              <NumStepper
                label="Games to Win"
                value={ttGames}
                onChange={setTtGames}
                min={1}
                accent="text-blue-600"
              />
              <NumStepper
                label="Points/Game"
                value={ttPointsPerGame}
                onChange={setTtPointsPerGame}
                min={5}
                accent="text-blue-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-1">
              Best of {ttGames * 2 - 1} · {ttPointsPerGame} pts · True deuce (no
              cap)
            </p>
          </div>
          <PlayerLinePicker sport="tt" accentColor="text-blue-600" />
          <TossButtons
            accentActive="text-blue-600"
            hoverBorder="hover:border-blue-200"
          />
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className={`w-full py-3 px-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 `}
              placeholder="Enter scorer username"
            />
          </div>
          <StartBtn
            label="🏓 Start Table Tennis Match"
            bg="bg-blue-600"
            shadow="shadow-blue-500/40"
            disabled={!tossWinner}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "SERVE",
                  scorerId: scorerUsername,
                  sportId,
                  sets: ttGames,
                  pointsPerSet: ttPointsPerGame,
                  finalSetPoints: 0,
                  team1PlayingIds: [...team1Playing],
                  team2PlayingIds: [...team2Playing],
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ TUG OF WAR ════════════════════════════════════════════ */}
      {isTOW && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <TugOfWarScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
            scorerId={match?.scorerId}
            mediaScorerUsername={match?.mediaScorerUsername}
          />
        </div>
      )}
      {isTOW && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-amber-500/10"
            vs="bg-amber-600"
            subtitle="Tug of War Setup"
            c1="bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-900/30"
            c2="bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-900/30"
          />
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-amber-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-amber-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-amber-500"
            />
            <DetailCard
              icon={Hash}
              label="Format"
              value={`Best of ${towRounds * 2 - 1}`}
              accent="text-amber-500"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Rounds Configuration
            </p>
            <NumStepper
              label="Rounds to Win"
              value={towRounds}
              onChange={setTowRounds}
              min={1}
              accent="text-amber-600"
            />
            <p className="text-[10px] text-slate-400 text-center pt-1">
              Best of {towRounds * 2 - 1} rounds
            </p>
          </div>
          <TossButtons
            accentActive="text-amber-600"
            hoverBorder="hover:border-amber-200"
          />
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className={`w-full py-3 px-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300`}
              placeholder="Enter scorer username"
            />
          </div>
          <StartBtn
            label="💪 Start Tug of War"
            bg="bg-amber-600"
            shadow="shadow-amber-500/40"
            disabled={!tossWinner}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "PULL",
                  scorerId: scorerUsername,
                  sportId,
                  sets: towRounds,
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ LUDO ══════════════════════════════════════════════════ */}
      {isLudo && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <LudoScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
            format={ludoFormat}
            players1={squadTeam1.filter((p) => team1Playing.has(p.id))}
            players2={squadTeam2.filter((p) => team2Playing.has(p.id))}
            scorerId={match?.scorerId}
            mediaScorerUsername={match?.mediaScorerUsername}
          />
        </div>
      )}
      {isLudo && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-orange-500/10"
            vs="bg-orange-600"
            subtitle="Ludo Setup"
            c1="bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100"
            c2="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100"
          />
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-orange-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-orange-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-orange-500"
            />
            <DetailCard
              icon={Hash}
              label="Sport"
              value="🎲 Ludo"
              accent="text-orange-500"
            />
          </div>
          {/* FORMAT PICKER */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Match Format
            </p>
            <div className="flex gap-3">
              {["1v1", "2v2"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => {
                    setLudoFormat(fmt);
                    setTeam1Playing(new Set());
                    setTeam2Playing(new Set());
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
                    ludoFormat === fmt
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white dark:bg-slate-700 text-slate-500 border-slate-200"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              {ludoFormat === "1v1"
                ? "1 player per team — first to 4 home runs wins"
                : "2 players per team — first to 8 home runs wins"}
            </p>
          </div>

          {/* PLAYER SELECTION */}
          {squadLoaded && (
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Select Players (
                {ludoFormat === "1v1" ? "1 per team" : "2 per team"})
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Team 1 */}
                <div>
                  <p className="text-xs font-bold text-orange-600 mb-2">
                    {team1Name}
                  </p>
                  <div className="space-y-1">
                    {squadTeam1.map((p) => {
                      const selected = team1Playing.has(p.id);
                      const maxed =
                        !selected && team1Playing.size >= maxSelect("ludo");
                      return (
                        <button
                          key={p.id}
                          disabled={maxed}
                          onClick={() => togglePlayer(setTeam1Playing, p.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            selected
                              ? "bg-orange-600 text-white border-orange-600"
                              : maxed
                                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                : "bg-white dark:bg-slate-800 text-slate-700 border-slate-200 dark:border-slate-600"
                          }`}
                        >
                          {selected ? "✓ " : ""}
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Team 2 */}
                <div>
                  <p className="text-xs font-bold text-blue-600 mb-2">
                    {team2Name}
                  </p>
                  <div className="space-y-1">
                    {squadTeam2.map((p) => {
                      const selected = team2Playing.has(p.id);
                      const maxed =
                        !selected && team2Playing.size >= maxSelect("ludo");
                      return (
                        <button
                          key={p.id}
                          disabled={maxed}
                          onClick={() => togglePlayer(setTeam2Playing, p.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            selected
                              ? "bg-blue-600 text-white border-blue-600"
                              : maxed
                                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                : "bg-white dark:bg-slate-800 text-slate-700 border-slate-200 dark:border-slate-600"
                          }`}
                        >
                          {selected ? "✓ " : ""}
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <TossButtons
            accentActive="text-orange-600"
            hoverBorder="hover:border-orange-200"
          />

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              placeholder="Enter scorer username"
            />
          </div>

          <StartBtn
            label="🎲 Start Ludo Match"
            bg="bg-orange-600"
            shadow="shadow-orange-500/40"
            disabled={
              !tossWinner ||
              team1Playing.size < maxSelect("ludo") ||
              team2Playing.size < maxSelect("ludo")
            }
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "START",
                  scorerId: scorerUsername,
                  sportId,
                  matchFormat: ludoFormat, // ← FIX: send format to backend
                  team1PlayingIds: [...team1Playing],
                  team2PlayingIds: [...team2Playing],
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}

      {isChess && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <ChessScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
            scorerId={match?.scorerId}
            mediaScorerUsername={match?.mediaScorerUsername}
          />
        </div>
      )}
      {isChess && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-slate-500/10"
            vs="bg-slate-700"
            subtitle="Chess Setup"
            c1="bg-slate-50 dark:bg-slate-900/20 text-slate-700 border-slate-100"
            c2="bg-gray-50 dark:bg-gray-900/20 text-gray-700 border-gray-100"
          />
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-slate-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-slate-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-slate-500"
            />
            <DetailCard
              icon={Hash}
              label="Sport"
              value="♟️ Chess"
              accent="text-slate-500"
            />
          </div>
          {/* FORMAT PICKER */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Match Format
            </p>
            <div className="flex gap-3">
              {["1v1", "2v2"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => {
                    setChessFormat(fmt);
                    setTeam1Playing(new Set());
                    setTeam2Playing(new Set());
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
                    chessFormat === fmt
                      ? "bg-slate-700 text-white border-slate-700"
                      : "bg-white dark:bg-slate-700 text-slate-500 border-slate-200"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* PLAYER SELECTION */}
          {squadLoaded && (
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Select Players (
                {chessFormat === "1v1" ? "1 per team" : "2 per team"})
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Team 1 */}
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-2">
                    {team1Name}
                  </p>
                  <div className="space-y-1">
                    {squadTeam1.map((p) => {
                      const selected = team1Playing.has(p.id);
                      const maxed =
                        !selected && team1Playing.size >= maxSelect("chess");
                      return (
                        <button
                          key={p.id}
                          disabled={maxed}
                          onClick={() => togglePlayer(setTeam1Playing, p.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            selected
                              ? "bg-slate-700 text-white border-slate-700"
                              : maxed
                                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                : "bg-white dark:bg-slate-800 text-slate-700 border-slate-200 dark:border-slate-600"
                          }`}
                        >
                          {selected ? "✓ " : ""}
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Team 2 */}
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-2">
                    {team2Name}
                  </p>
                  <div className="space-y-1">
                    {squadTeam2.map((p) => {
                      const selected = team2Playing.has(p.id);
                      const maxed =
                        !selected && team2Playing.size >= maxSelect("chess");
                      return (
                        <button
                          key={p.id}
                          disabled={maxed}
                          onClick={() => togglePlayer(setTeam2Playing, p.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            selected
                              ? "bg-gray-700 text-white border-gray-700"
                              : maxed
                                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                : "bg-white dark:bg-slate-800 text-slate-700 border-slate-200 dark:border-slate-600"
                          }`}
                        >
                          {selected ? "✓ " : ""}
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <TossButtons
            accentActive="text-slate-700"
            hoverBorder="hover:border-slate-300"
          />

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              placeholder="Enter scorer username"
            />
          </div>

          <StartBtn
            label="♟️ Start Chess Match"
            bg="bg-slate-700"
            shadow="shadow-slate-500/40"
            disabled={
              !tossWinner ||
              team1Playing.size < maxSelect("chess") ||
              team2Playing.size < maxSelect("chess")
            }
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "WHITE",
                  scorerId: scorerUsername,
                  sportId,
                  matchFormat: chessFormat, // ← FIX: send format to backend
                  team1PlayingIds: [...team1Playing],
                  team2PlayingIds: [...team2Playing],
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
