import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Dot,
  Camera,
  Star,
  Heart,
  Download,
  Share2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BiCricketBall } from "react-icons/bi";
import axios from "axios";

import {
  handleRuns,
  handleUndo,
  handleEndInnings,
  handleSuperOver,
} from "./scoring";
import { getPlayersByTeamId } from "../../../api/teamApi";
import Extras from "./modals/Extras";
import Out from "./modals/Out";
import { getScoreCard } from "../../../api/matchApi";
import MatchSummary from "./modals/Summary";
import MatchBalls from "./modals/MatchBalls";
import Media from "./modals/Media";
import FavouritePlayerModal from "./modals/FavouritePlayerModal";
import MoreModal from "./modals/MoreModal";
import SubstituteModal from "./modals/SubstituteModal";
import {
  getMediaByMatchId,
  getMatchFavouriteMediaIds,
  getAccountFavouriteMedia,
  toggleFavouriteMedia,
} from "../../../api/mediaApi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import LoadingSpinner from "../../common/LoadingSpinner";
import MilestonePopup from "../../common/MilestonePopup";
import { detectCricketMilestone } from "../../../utils/milestoneDetector";

// ─── Helper: close all modals ────────────────────────────────────
const ALL_MODALS_OFF = {
  mainModal: false,
  playerSelectModal: false,
  bowlerModal: false,
  batsmanModal: false,
  extraModal: false,
  outModal: false,
  end_InningsModal: false,
  end_InningsAndSuperOverModal: false, // ← YEH ADD KARO
  moreModal: false,
  favPlayerModal: false,
};

export default function CricketScoring({
  matchId,
  status,
  team1Id,
  team2Id,
  bTeamId,
  team1Name,
  team2Name,
  battingTeamName,
  inningsId,
  scorerId,
  mediaScorerUsername,
  isDoubleWicket = false,
  isCommentator = false,
  commentatorUsername = "",
}) {
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nav = [
    "Scoring",
    "Summary",
    "Scorecard",
    "Balls",
    "Media",
    "Favourites",
    "Info",
  ];
  const [activeTab, setActiveTab] = useState("Scoring");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatSocketRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === "Scoring") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);
  const firstInningsRef = useRef(true);
  const [user, setUser] = useState("");
  const [strikerId, setStrikerId] = useState(null);
  const [nonStrikerId, setNonStrikerId] = useState(null);
  const [bowlerId, setBowlerId] = useState(null);
  const [fielderId, setFielderId] = useState(null);
  const [outPlayerId, setOutPlayerId] = useState(null);
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);

  const player1IdRef = useRef(null);
  const player2IdRef = useRef(null);
  const socketRef = useRef(null);
  const isEndingMatch = useRef(false);
  const sentEndInningsRef = useRef(false);

  // ── Milestone popup ───────────────────────────────────────────────────────
  const [milestone, setMilestone] = useState(null);
  /** Stable ref so the popup's useEffect always has the latest dismiss fn */
  const onDismissRef = useRef(() => setMilestone(null));
  const prevDataRef = useRef(null); // tracks previous WebSocket payload
  const rolesRef = useRef({
    isAdmin: false,
    isScorer: false,
    isMediaPerson: false,
  });

  // ── Single modal state object — enforces mutual exclusivity ──
  const [modals, setModals] = useState({
    mainModal: false,
    playerSelectModal: false,
    bowlerModal: false,
    batsmanModal: false,
    extraModal: false,
    outModal: false,
    end_InningsModal: false,
    moreModal: false,
    favPlayerModal: false,
    end_InningsAndSuperOverModal: false,
  });
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [availableBatters, setAvailableBatters] = useState([]); // not dismissed, not on crease
  const [availableBowlers, setAvailableBowlers] = useState([]); // excl. last-over bowler

  const openModal = (name) => setModals({ ...ALL_MODALS_OFF, [name]: true });
  const closeAllModals = () => setModals(ALL_MODALS_OFF);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isScorer, setIsScorer] = useState(false);
  const [isMediaPerson, setIsMediaPerson] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isSuperOverPending, setIsSuperOverPending] = useState(false);
  const [isSuperOver, setIsSuperOver] = useState(false);
  const [isSuperOverInnings, setIsSuperOverInnings] = useState(1); // ← ADD KARO
  // battingTeamId already hai, bowlingTeamId bhi chahiye:
  const [bowlingTeamId, setBowlingTeamId] = useState(
    bTeamId === team1Id ? team2Id : team1Id,
  );
  const [data, setData] = useState({
    runs: 0,
    overs: 0,
    wickets: 0,
    balls: 0,
    status: "LIVE",
    target: 0,
    extras: 0,
    teamId: 1,
    matchId: 1,
    inningsId: inningsId,
    batsmanId: null,
    nonStrikerId: null,
    bowlerId: null,
    fielderId: null,
    outPlayerId: null,
    runsOnThisBall: 0,
    extrasThisBall: 0,
    extra: 0,
    extraType: null,
    event: null,
    eventType: null,
    dismissalType: null,
    isLegal: null,
    undo: false,
    four: false,
    six: false,
    firstInnings: true,
    crr: 0.0,
    rrr: 0.0,
    comment: null,
    mediaId: null,
    batsman1Stats: null,
    batsman2Stats: null,
    bowlerStats: null,
    cricketBalls: null,
  });

  const [team1Scorecard, setTeam1Scorecard] = useState([]);
  const [cardFor, setCardFor] = useState(1);
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [battingTeamId, setBattingTeamId] = useState(bTeamId);
  const [selectedBallId, setSelectedBallId] = useState(null);

  // Media Tab States
  const [matchMedia, setMatchMedia] = useState([]);
  const [favMediaIds, setFavMediaIds] = useState(new Set());
  const [mediaLoading, setMediaLoading] = useState(false);

  // Favourites Tab States
  const [accountFavMedia, setAccountFavMedia] = useState([]);
  const [favLoading, setFavLoading] = useState(false);

  const accountId = JSON.parse(Cookies.get("account") || "{}")?.id;

  useEffect(() => {
    try {
      const account = Cookies.get("account");
      if (account) {
        const parsedUser = JSON.parse(account);
        setUser(parsedUser);

        const role = parsedUser.role?.toUpperCase();
        const username = parsedUser.username;

        const a = role === "ADMIN";
        const s = a || username == scorerId;
        const m = a || username == mediaScorerUsername;

        rolesRef.current = { isAdmin: a, isScorer: s, isMediaPerson: m };
        setIsAdmin(a);
        setIsScorer(s);
        setIsMediaPerson(m);
      }
      if (status == "COMPLETED") {
        fetchPlayers();
        openModal("favPlayerModal");
      }
    } catch (error) {
      console.error("Error parsing user cookie:", error);
    }
    // Run once on mount to mirror the original web scorer lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlayers = async () => {
    let t1, t2;
    t1 = await getPlayersByTeamId(team1Id);
    t2 = await getPlayersByTeamId(team2Id);
    setTeam1Players(t1);
    setTeam2Players(t2);
  };
  const fetchTeamPlayers = async () => {
    let t1, t2;
    if (data.firstInnings) {
      t1 = await getPlayersByTeamId(bTeamId);
      t2 = await getPlayersByTeamId(bTeamId == team1Id ? team2Id : team1Id);
    } else {
      t1 = await getPlayersByTeamId(bTeamId == team1Id ? team2Id : team1Id);
      t2 = await getPlayersByTeamId(bTeamId);
    }
    setTeam1Players(t1);
    setTeam2Players(t2);
  };

  const normalizeStats = (receivedData) => {
    const stats1 = receivedData.batsman1Stats;
    const stats2 = receivedData.batsman2Stats;

    if (!player1IdRef.current && stats1?.playerId) {
      player1IdRef.current = stats1.playerId;
      player2IdRef.current = stats2?.playerId;
      return receivedData;
    }

    if (
      stats1?.playerId != null &&
      stats2?.playerId != null &&
      stats1.playerId == player2IdRef.current &&
      stats2.playerId == player1IdRef.current
    ) {
      return {
        ...receivedData,
        batsman1Stats: stats2,
        batsman2Stats: stats1,
      };
    }

    return receivedData;
  };

  const hydrateSuperOverState = (receivedData) => {
    if (!receivedData?.superOver) return false;

    setIsSuperOver(true);
    setIsSuperOverPending(false);

    const restoredSuperOverInnings =
      receivedData.firstInnings === false ? 2 : 1;
    setIsSuperOverInnings(restoredSuperOverInnings);

    const originalBowlingTeamId = bTeamId === team1Id ? team2Id : team1Id;

    if (restoredSuperOverInnings === 2) {
      setBattingTeamId(bTeamId);
      setBowlingTeamId(originalBowlingTeamId);
    } else {
      setBattingTeamId(originalBowlingTeamId);
      setBowlingTeamId(bTeamId);
    }

    return true;
  };

  useEffect(() => {
    setBattingTeamId(bTeamId);

    if (status === "LIVE") {
      const socketUrl = import.meta.env.VITE_SOCKET_URL + "?matchId=" + matchId;
      const ws = new WebSocket(socketUrl);

      ws.onopen = () => {
        console.log("Connected to WebSocket server");
        socketRef.current = ws;
      };

      // ── ws.onmessage ke andar, yahan change karo ──

      ws.onmessage = async (event) => {
        const receivedData = JSON.parse(event.data);
        console.log(receivedData);
        const inningsChanged =
          firstInningsRef.current !== receivedData.firstInnings;
        firstInningsRef.current = receivedData.firstInnings; // keep ref in sync
        if (inningsChanged) {
          setAvailableBatters([]);
          setAvailableBowlers([]);
          player1IdRef.current = null;
          player2IdRef.current = null;
        }

        const normalized = normalizeStats(receivedData);

        // ── Milestone detection ───────────────────────────────────────────
        // Must run BEFORE setData so prevDataRef still has previous payload.
        const detected = detectCricketMilestone(
          normalized.cricketBalls,
          normalized,
          prevDataRef.current,
        );
        if (detected) {
          setMilestone(detected); // replaces any active popup immediately
        }
        prevDataRef.current = normalized;
        // ─────────────────────────────────────────────────────────────────

        const superOverRestored = hydrateSuperOverState(normalized);

        if (!superOverRestored) {
          if (normalized.firstInnings !== false) {
            setBattingTeamId(bTeamId);
            setBowlingTeamId(bTeamId === team1Id ? team2Id : team1Id);
          } else {
            setBattingTeamId(bTeamId === team1Id ? team2Id : team1Id);
            setBowlingTeamId(bTeamId);
          }
        }

        setData(normalized);
        setIsWaiting(false);

        if (Array.isArray(normalized.availableBatters)) {
          setAvailableBatters(normalized.availableBatters);
        }
        if (Array.isArray(normalized.availableBowlers)) {
          setAvailableBowlers(normalized.availableBowlers);
        }

        // ✅ PEHLE matchEnd check karo — handleModalLogic se pehle
        if (normalized.matchEnd === true || normalized.status === "COMPLETED") {
          isEndingMatch.current = false;
          await fetchPlayers(); // ✅ correct team mapping restore karo pehle
          openModal("favPlayerModal");
          return;
        }

        handleModalLogic(normalized, superOverRestored);
      };

      ws.onclose = () => {
        console.log("Disconnected from WebSocket server");
        socketRef.current = null;
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
    // Socket should be created once for this mounted match screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const shouldConnect = activeTab === "Scoring" || isCommentator;

    if (shouldConnect) {
      if (!chatSocketRef.current) {
        const rawSocketUrl =
          import.meta.env.VITE_CHAT_SOCKET_URL ||
          import.meta.env.VITE_SOCKET_URL?.replace("/ws", "/ws/chat");
        const finalUrl =
          rawSocketUrl +
          "?matchId=" +
          matchId +
          "&username=" +
          (commentatorUsername || "");

        const ws = new WebSocket(finalUrl);
        chatSocketRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            setChatMessages((prev) => {
              const updated = [...prev, msg];
              if (updated.length > 100) {
                return updated.slice(updated.length - 100);
              }
              return updated;
            });
          } catch (e) {
            console.error("Error parsing chat message JSON:", e);
          }
        };

        ws.onclose = () => {
          chatSocketRef.current = null;
        };

        ws.onerror = (error) => {
          console.error("Chat WebSocket error:", error);
        };
      }
    } else {
      if (chatSocketRef.current) {
        chatSocketRef.current.close();
        chatSocketRef.current = null;
      }
    }

    return () => {
      if (chatSocketRef.current) {
        chatSocketRef.current.close();
        chatSocketRef.current = null;
      }
    };
  }, [activeTab, isCommentator, matchId, commentatorUsername]);

  // ─────────────────────────────────────────────────────────────
  // MODAL LOGIC — all modal state goes through openModal()
  // ─────────────────────────────────────────────────────────────
  const handleModalLogic = (receivedData, superOverRestored = false) => {
    const { isAdmin, isScorer, isMediaPerson } = rolesRef.current;
    if (!isAdmin && !isScorer && !isMediaPerson) return;

    // If match is completed, don't show any scoring modals
    if (receivedData.status === "COMPLETED") {
      openModal("favPlayerModal");
      return;
    }

    // Handle error comments from backend
    if (
      receivedData.comment === "Error no current State" ||
      receivedData.comment?.startsWith("Error")
    ) {
      if (
        receivedData.balls === 0 &&
        receivedData.overs === 0 &&
        receivedData.wickets === 0 &&
        receivedData.runs === 0
      ) {
        fetchTeamPlayers();
        openModal("playerSelectModal");
      }
      return;
    }

    if (superOverRestored) {
      if (
        receivedData.balls === 0 &&
        receivedData.overs === 0 &&
        receivedData.wickets === 0 &&
        receivedData.runs === 0 &&
        (!receivedData.batsmanId ||
          !receivedData.nonStrikerId ||
          !receivedData.bowlerId)
      ) {
        openModal("playerSelectModal");
        return;
      }

      if (receivedData.comment === "End_Innings") {
        openModal("end_InningsAndSuperOverModal");
        return;
      }

      if (receivedData.balls === 0 && receivedData.overs !== 0) {
        if (!receivedData.superOver) openModal("bowlerModal");
        else openModal("end_InningsAndSuperOverModal");
        return;
      }

      openModal("mainModal");
      return;
    }

    // Tie detected — backend says Super Over is possible
    if (receivedData.comment === "Super_Over") {
      setIsSuperOverPending(true);
      openModal("end_InningsAndSuperOverModal");
      return;
    }

    if (receivedData.comment === "DLS_UPDATED") {
      openModal("mainModal");
      return;
    }

    // End_Innings — swallow echo if we just sent it
    if (receivedData.comment === "End_Innings") {
      // Second innings End_Innings — modal dikhao, sentEndInningsRef ignore karo
      if (receivedData.firstInnings === false) {
        openModal("end_InningsModal");
        return;
      }

      // First innings — echo swallow karo
      if (sentEndInningsRef.current) {
        sentEndInningsRef.current = false;
        return;
      }
      openModal("end_InningsModal");
      return;
    }

    if (
      receivedData.balls === 0 &&
      receivedData.overs === 0 &&
      receivedData.wickets === 0 &&
      receivedData.runs === 0
    ) {
      openModal("playerSelectModal");
      return;
    }

    // New over — bowler selection (early return, no flicker)
    if (receivedData.balls === 0 && receivedData.overs !== 0) {
      openModal("bowlerModal");
      return;
    }

    openModal("mainModal");

    // Sync player IDs from server data
    if (receivedData.batsmanId) setStrikerId(receivedData.batsmanId);
    if (receivedData.nonStrikerId) setNonStrikerId(receivedData.nonStrikerId);
    if (receivedData.bowlerId) setBowlerId(receivedData.bowlerId);
  };

  const handleStartMatch = () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      alert("Please select all players!");
      return;
    }

    const player1 =
      availableBatters.find((p) => p.id == strikerId) ||
      team1Players.find((p) => p.id == strikerId);
    const player2 =
      availableBatters.find((p) => p.id == nonStrikerId) ||
      team1Players.find((p) => p.id == nonStrikerId);
    const bowlerPlayer =
      availableBowlers.find((p) => p.id == bowlerId) ||
      team2Players.find((p) => p.id == bowlerId) ||
      team1Players.find((p) => p.id == bowlerId);

    player1IdRef.current = Number(strikerId);
    player2IdRef.current = Number(nonStrikerId);

    setData((prev) => ({
      ...prev,
      batsmanId: Number(strikerId),
      nonStrikerId: Number(nonStrikerId),
      bowlerId: Number(bowlerId),
      batsman1Stats: {
        playerId: Number(strikerId),
        playerName: player1?.name || "Batsman 1",
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
      },
      batsman2Stats: {
        playerId: Number(nonStrikerId),
        playerName: player2?.name || "Batsman 2",
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
      },
      bowlerStats: {
        playerId: Number(bowlerId),
        playerName: bowlerPlayer?.name || "Bowler",
        wickets: 0,
        runs: 0,
        ballsBowled: 0,
      },
    }));

    openModal("mainModal");
  };

  // Dedicated bowler confirmation — preserves existing batsman stats
  const confirmBowler = () => {
    if (!bowlerId) {
      alert("Please select a bowler!");
      return;
    }

    const bowlerPlayer =
      availableBowlers.find((p) => p.id == bowlerId) ||
      team2Players.find((p) => p.id == bowlerId) ||
      team1Players.find((p) => p.id == bowlerId);

    player1IdRef.current = null;
    player2IdRef.current = null;

    setData((prev) => ({
      ...prev,
      bowlerId: Number(bowlerId),
      batsmanId: Number(strikerId),
      nonStrikerId: Number(nonStrikerId),
      bowlerStats: {
        playerId: Number(bowlerId),
        playerName: bowlerPlayer?.name || "Bowler",
        wickets: 0,
        runsConceded: 0,
        ballsBowled: 0,
        economy: 0,
      },
      // batsman1Stats and batsman2Stats are preserved from ...prev
    }));

    openModal("mainModal");
  };

  useEffect(() => {
    if (data.batsmanId) setStrikerId(data.batsmanId);
    if (data.nonStrikerId) setNonStrikerId(data.nonStrikerId);
    if (data.bowlerId) setBowlerId(data.bowlerId);
  }, [data.batsmanId, data.nonStrikerId, data.bowlerId]);

  const handleExtraModal = (extraType) => {
    setData((prev) => ({ ...prev, extraType }));
    openModal("extraModal");
  };

  const handleOutModal = () => {
    openModal("outModal");
  };

  // ── Penalty ────────────────────────────────────────────────────
  const handlePenalty = (runs) => {
    if (!socketRef.current) return;
    setIsWaiting(true);
    socketRef.current.send(
      JSON.stringify({
        ...data,
        eventType: "penalty",
        event: String(runs),
        runsOnThisBall: runs,
      }),
    );
  };

  // ── DLS ────────────────────────────────────────────────────────
  const handleDLS = (newTarget) => {
    if (!socketRef.current) return;
    setIsWaiting(true);
    socketRef.current.send(
      JSON.stringify({
        ...data,
        eventType: "dls",
        dlsTarget: newTarget,
        event: "0",
      }),
    );
  };

  // Ball label map
  const eventLabel = {
    wicket: "W",
    bye: "B",
    legbye: "LB",
    noball: "NB",
    wide: "WD",
    penalty: "P",
  };
  const fetchTeamPlayersForSuperOver = async (newBattingTeamId) => {
    const newBowlingTeamId = newBattingTeamId === team1Id ? team2Id : team1Id;
    const t1 = await getPlayersByTeamId(newBattingTeamId);
    const t2 = await getPlayersByTeamId(newBowlingTeamId);
    setTeam1Players(t1);
    setTeam2Players(t2);
  };
  const fetchScorecard = async (team) => {
    setScorecardLoading(true);
    setCardFor(team);
    try {
      const sc =
        team === 1
          ? await getScoreCard(matchId, team1Id)
          : await getScoreCard(matchId, team2Id);
      setTeam1Scorecard(sc);
    } catch (err) {
      console.error("Scorecard fetch error:", err);
    } finally {
      setScorecardLoading(false);
    }
  };

  const fetchMatchMedia = async () => {
    setMediaLoading(true);
    try {
      const [media, favIds] = await Promise.all([
        getMediaByMatchId(matchId),
        accountId
          ? getMatchFavouriteMediaIds(matchId, accountId)
          : Promise.resolve([]),
      ]);
      console.log("Fetched Match Media:", media);
      console.log("Fetched Fav IDs:", favIds);
      setMatchMedia(media || []);
      setFavMediaIds(new Set(favIds || []));
    } catch (err) {
      console.error("Error fetching match media:", err);
    } finally {
      setMediaLoading(false);
    }
  };

  const fetchAccountFavourites = async () => {
    if (!accountId) return;
    setFavLoading(true);
    try {
      const data = await getAccountFavouriteMedia(accountId);
      setAccountFavMedia(data || []);
    } catch (err) {
      console.error("Error fetching account favourites:", err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleMediaFavouriteToggle = async (mediaId) => {
    if (!accountId) {
      alert("Please login to favourite media");
      return;
    }

    // Optimistic UI update for Media tab
    setFavMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) next.delete(mediaId);
      else next.add(mediaId);
      return next;
    });

    try {
      await toggleFavouriteMedia(accountId, mediaId, matchId);
    } catch (err) {
      // Revert on error
      setFavMediaIds((prev) => {
        const next = new Set(prev);
        if (next.has(mediaId)) next.delete(mediaId);
        else next.add(mediaId);
        return next;
      });
      console.error("Toggle error:", err);
    }
  };

  const handleFavTabToggle = async (mediaId) => {
    if (!accountId) return;

    // Optimistic UI update for Favourites tab
    setAccountFavMedia((prev) => prev.filter((m) => m.id !== mediaId));

    const mId = data?.matchId || matchId || -1;
    try {
      await toggleFavouriteMedia(accountId, mediaId, mId);
    } catch (err) {
      console.error("Toggle error:", err);
      fetchAccountFavourites(); // Refresh on error
    }
  };

  // Destructure for convenience
  const {
    mainModal,
    playerSelectModal,
    bowlerModal,
    extraModal,
    outModal,
    end_InningsModal,
    moreModal,
    favPlayerModal,
    end_InningsAndSuperOverModal,
  } = modals;

  const canEdit = isAdmin || isScorer || isMediaPerson;
  const regularBattingTeamName = data.firstInnings
    ? battingTeamName
    : battingTeamName === team1Name
      ? team2Name
      : team1Name;
  const activeBattingTeamName =
    String(battingTeamId) === String(team1Id)
      ? team1Name
      : String(battingTeamId) === String(team2Id)
        ? team2Name
        : regularBattingTeamName;
  const inningsLabel = data.firstInnings ? "First Innings" : "Second Innings";

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      const BASE_URL = import.meta.env.VITE_BASE_URL;
      const res = await axios.get(
        `${BASE_URL}/match/${matchId}/scorecard/pdf`,
        {
          responseType: "blob",
        },
      );
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `scorecard-${matchId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      setIsExporting(true);
      const BASE_URL = import.meta.env.VITE_BASE_URL;
      const res = await axios.get(
        `${BASE_URL}/match/${matchId}/scorecard/pdf`,
        { responseType: "blob" },
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const file = new File([blob], `scorecard-${matchId}.pdf`, {
        type: "application/pdf",
      });

      // Check if Web Share API supports files
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Match Scorecard - ${team1Name} vs ${team2Name}`,
          text: `Cricket Scorecard - Match #${matchId}`,
          files: [file],
        });
      } else {
        // Fallback: share the URL or just download
        // Try sharing just text/url if files not supported
        if (navigator.share) {
          await navigator.share({
            title: `Match Scorecard - ${team1Name} vs ${team2Name}`,
            text: `Cricket Scorecard for Match #${matchId} - BIIT Sports`,
            url: window.location.href,
          });
        } else {
          // No share API — fallback to download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `scorecard-${matchId}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          alert(
            "Sharing not supported on this device. File downloaded instead.",
          );
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share error:", err);
        alert("Failed to share scorecard.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* ── Milestone Popup ── */}
      {milestone && (
        <MilestonePopup
          milestone={milestone}
          onDismiss={onDismissRef.current}
        />
      )}
      {/* ── Header ── */}
      <div className="flex items-center bg-red-600 h-16">
        <ArrowLeft
          className="w-6 h-6 text-white"
          size={24}
          onClick={() => navigate(-1)}
        />
        <h1 className="text-white font-semibold text-2xl ml-2">Match Center</h1>
      </div>

      <div className="bg-white min-h-screen text-gray-900">
        {/* ── Nav tabs ── */}
        <div className="flex justify-between mt-4">
          {status != "LIVE"
            ? nav
                .filter((item) => item !== "Scoring")
                .map((item) => (
                  <button
                    key={item}
                    className="mx-2 bg-red-600 p-1 rounded-lg text-white w-32 font-semibold text-xl"
                    onClick={() => {
                      setActiveTab(item);
                      if (item === "Scorecard") fetchScorecard(1);
                      if (item === "Media") fetchMatchMedia();
                      if (item === "Favourites") fetchAccountFavourites();
                    }}
                  >
                    {item}
                  </button>
                ))
            : nav
                .filter((item) => item !== "Summary")
                .map((item) => (
                  <button
                    key={item}
                    className="mx-2 bg-red-600 p-1 rounded-lg text-white w-32 font-semibold text-xl"
                    onClick={() => {
                      setActiveTab(item);
                      if (item === "Scorecard") fetchScorecard(1);
                      if (item === "Media") fetchMatchMedia();
                      if (item === "Favourites") fetchAccountFavourites();
                    }}
                  >
                    {item}
                  </button>
                ))}
        </div>

        <hr className="my-4" />

        <div>
          {activeTab === "Scoring" && (
            <div>
              <h1 className="text-3xl font-semibold text-red-600">
                {isSuperOver
                  ? `${activeBattingTeamName || "Batting Team"} - Super Over`
                  : regularBattingTeamName}
              </h1>
              <h2 className="text-xl font-semibold mt-2">
                {isSuperOver ? `Super Over - ${inningsLabel}` : inningsLabel}
              </h2>
              <h3 className="text-3xl font-semibold mt-2">
                {data.runs}/{data.wickets}
              </h3>

              {/* DLS / target badge — shown in 2nd innings when target is set */}
              {!data.firstInnings && data.target > 0 && (
                <p className="text-sm text-blue-600 font-semibold mt-1">
                  Remaining: {data.target}
                  {data.rrr > 0 && ` · RRR: ${Number(data.rrr).toFixed(2)}`}
                </p>
              )}

              <hr />
              <span className="flex justify-around mt-2 mb-2">
                <h3 className="text-xl font-semibold">
                  Extras {data.extra || 0}
                </h3>
                <h3 className="text-xl font-semibold">
                  Overs {data.overs}.{data.balls}
                </h3>
                <h3 className="text-xl font-semibold">
                  CRR {data.crr != "NaN" ? Number(data.crr).toFixed(2) : "0"}
                </h3>
              </span>
              <hr />

              <div className="mt-2 mb-2">
                <h1 className="text-2xl font-semibold text-red-600 mt-2 mb-2">
                  Batting
                </h1>
                <table className="w-full border border-gray-500">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>R</th>
                      <th>B</th>
                      <th>4s</th>
                      <th>6s</th>
                      <th>SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[data.batsman1Stats, data.batsman2Stats].map((stat, i) => (
                      <tr key={i}>
                        <td>
                          {stat?.playerId === data.batsmanId && (
                            <Star
                              size={16}
                              className="inline text-yellow-500 mr-1"
                            />
                          )}
                          {stat?.playerName || `Batsman ${i + 1}`}
                        </td>
                        <td>{stat?.runs || 0}</td>
                        <td>{stat?.ballsFaced || 0}</td>
                        <td>{stat?.fours || 0}</td>
                        <td>{stat?.sixes || 0}</td>
                        <td>
                          {stat?.ballsFaced > 0
                            ? ((stat.runs / stat.ballsFaced) * 100).toFixed(2)
                            : "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h1 className="text-2xl font-semibold text-red-600 mt-2 mb-2">
                  Bowling
                </h1>
                <table className="w-full border border-gray-500">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>O</th>
                      <th>W</th>
                      <th>EC</th>
                      <th>RC</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {data.bowlerStats?.playerName ||
                          (battingTeamId === team1Id
                            ? team2Players.find((p) => p.id === data.bowlerId)
                                ?.name
                            : team1Players.find((p) => p.id === data.bowlerId)
                                ?.name)}
                      </td>
                      <td>
                        {data.bowlerStats?.ballsBowled != null
                          ? `${Math.floor(data.bowlerStats.ballsBowled / 6)}.${data.bowlerStats.ballsBowled % 6}`
                          : "-"}
                      </td>
                      <td>{data.bowlerStats?.wickets || 0}</td>
                      <td>
                        {data.bowlerStats?.economy
                          ? Number(data.bowlerStats.economy).toFixed(2)
                          : "0"}
                      </td>
                      <td>{data.bowlerStats?.runsConceded || "0"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Scoring" && (
            <div className="overflow-x-auto whitespace-nowrap py-2 no-scrollbar">
              <span className="flex flex-nowrap gap-2 min-w-max">
                {data.cricketBalls?.map((ball, index) => (
                  <span key={index} className="relative inline-flex">
                    {/* Media dot indicator */}
                    {ball.mediaCount > 0 && (
                      <Camera
                        size={20}
                        className="absolute -top-1 -right-1 z-10 bg-white text-red-600"
                      />
                    )}
                    <span
                      className={`${
                        ball.eventType === "wicket" ||
                        ball.eventType === "noball_runout"
                          ? "bg-red-600"
                          : ball.eventType === "penalty"
                            ? "bg-orange-500"
                            : ["bye", "legbye", "noball", "wide"].includes(
                                  ball.eventType,
                                )
                              ? "bg-blue-600"
                              : ball.eventType === "run"
                                ? "bg-green-600"
                                : "bg-yellow-600"
                      } p-2 rounded-full text-white w-12 h-12 flex items-center justify-center transition-transform ${canEdit ? "cursor-pointer hover:scale-105" : ""}`}
                      onClick={() => canEdit && setSelectedBallId(ball.id)}
                    >
                      {ball.eventType === "noball_runout"
                        ? `${ball.event}NR`
                        : ball.eventType !== "run" &&
                            ball.eventType !== "boundary"
                          ? `${ball.event}${eventLabel[ball.eventType] || ""}`
                          : ball.event}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          )}

          {/* ── Commentary Box for Commentator & Spectators ── */}
          {activeTab === "Scoring" && (!canEdit || isCommentator) && (
            <div className="max-w-2xl mx-auto p-4 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col h-[400px] mt-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-red-600 pb-2 flex items-center justify-between">
                <span>Live Match Commentary</span>
                <span
                  className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"
                  title="Connected"
                />
              </h2>

              {/* Scrollable message list */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {chatMessages.filter((msg) => msg.type !== "system").length ===
                0 ? (
                  <div className="text-center text-gray-400 py-12 italic text-sm">
                    No commentary messages yet. Be the first to start!
                  </div>
                ) : (
                  chatMessages
                    .filter((msg) => msg.type !== "system")
                    .map((msg, idx) => {
                      const isMsgCommentator =
                        msg.username === commentatorUsername;
                      return (
                        <div key={idx} className="flex flex-col items-start">
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                              isMsgCommentator
                                ? "bg-red-600 text-white rounded-tl-none border-l-4 border-red-800"
                                : "bg-gray-100 text-gray-800 rounded-tl-none"
                            }`}
                          >
                            <div className="flex justify-between items-baseline gap-4 mb-0.5">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider ${isMsgCommentator ? "text-red-200" : "text-gray-500"}`}
                              >
                                {msg.username}
                              </span>
                              <span
                                className={`text-[8px] ${isMsgCommentator ? "text-red-300" : "text-gray-400"}`}
                              >
                                {msg.timestamp ||
                                  new Date().toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {msg.message || msg.text}
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input / Reactions panel */}
              <div className="border-t border-gray-100 pt-3">
                {isCommentator ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!chatInput.trim()) return;
                      if (
                        chatSocketRef.current &&
                        chatSocketRef.current.readyState === WebSocket.OPEN
                      ) {
                        chatSocketRef.current.send(
                          JSON.stringify({
                            message: chatInput,
                            username: commentatorUsername,
                          }),
                        );
                        setChatInput("");
                      } else {
                        alert("Chat connection is lost. Reconnecting...");
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your official match commentary..."
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 hover:bg-gray-100/50 transition"
                    />
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition active:scale-95 shadow-md shadow-red-500/25"
                    >
                      Send
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-400 font-medium">
                      React to the live actions:
                    </p>
                    <div className="flex justify-center gap-4 py-1">
                      {["🔥", "❤️", "👏", "😮"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            const currentUsername =
                              user?.username ||
                              JSON.parse(Cookies.get("account") || "{}")
                                ?.username;
                            if (
                              chatSocketRef.current &&
                              chatSocketRef.current.readyState ===
                                WebSocket.OPEN
                            ) {
                              chatSocketRef.current.send(
                                JSON.stringify({
                                  message: emoji,
                                  username: currentUsername || "Guest",
                                }),
                              );
                            } else {
                              alert("Chat connection is lost. Reconnecting...");
                            }
                          }}
                          className="w-12 h-12 bg-gray-50 hover:bg-gray-100 active:scale-90 border border-gray-100 rounded-full text-2xl flex items-center justify-center transition shadow-sm hover:shadow"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Scoring" && selectedBallId && (
            <Media
              ballId={selectedBallId}
              matchId={matchId}
              onClose={() => setSelectedBallId(null)}
              onSuccess={() => {
                if (
                  socketRef.current &&
                  socketRef.current.readyState === WebSocket.OPEN
                ) {
                  setIsWaiting(true);
                  socketRef.current.send(
                    JSON.stringify({
                      ...data,
                      eventType: "refresh",
                      event: "0",
                    }),
                  );
                } else {
                  // Fallback if socket is not connected
                  window.location.reload();
                }
              }}
            />
          )}

          {/* ── Main scoring panel ── */}
          {activeTab === "Scoring" &&
            !isCommentator &&
            mainModal &&
            canEdit && (
              <div className="mt-3">
                <div className="bg-red-600 p-3 h-74.5">
                  <div
                    className={`grid grid-cols-5 space-y-2 space-x-2 mt-4 ${
                      isWaiting ||
                      end_InningsModal ||
                      end_InningsAndSuperOverModal ||
                      playerSelectModal
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                  >
                    {["1", "2", "3", "4", "6"].map((run) => (
                      <button
                        key={run}
                        disabled={isWaiting}
                        className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20 disabled:cursor-not-allowed"
                        onClick={() => {
                          setIsWaiting(true);
                          socketRef.current.send(
                            JSON.stringify(
                              handleRuns(
                                data,
                                run,
                                "run",
                                data.batsmanId,
                                data.bowlerId,
                              ),
                            ),
                          );
                        }}
                      >
                        {run}
                      </button>
                    ))}

                    <button
                      disabled={isWaiting}
                      className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20 disabled:cursor-not-allowed"
                      onClick={() => {
                        handleExtraModal("legbye");
                      }}
                    >
                      LB
                    </button>
                    <button
                      disabled={isWaiting}
                      className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20 disabled:cursor-not-allowed"
                      onClick={() => {
                        handleExtraModal("bye");
                      }}
                    >
                      BYE
                    </button>
                    <button
                      disabled={isWaiting}
                      className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20 disabled:cursor-not-allowed"
                      onClick={() => {
                        handleExtraModal("wide");
                      }}
                    >
                      Wide
                    </button>
                    <button
                      disabled={isWaiting}
                      className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20 disabled:cursor-not-allowed"
                      onClick={() => {
                        handleExtraModal("noball");
                      }}
                    >
                      NB
                    </button>

                    {/* Dot ball */}
                    <button
                      disabled={isWaiting}
                      className="bg-white flex items-center justify-center text-red-600 p-1 rounded-lg h-20 disabled:cursor-not-allowed"
                      onClick={() => {
                        setIsWaiting(true);
                        socketRef.current.send(
                          JSON.stringify(
                            handleRuns(
                              data,
                              "0",
                              "run",
                              data.batsmanId,
                              data.bowlerId,
                            ),
                          ),
                        );
                      }}
                    >
                      <Dot size={50} />
                    </button>

                    {/* MORE */}
                    <button
                      className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20 relative"
                      onClick={() => openModal("moreModal")}
                    >
                      MORE
                      {isSuperOverPending && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                      )}
                    </button>

                    <button className="bg-white text-red-600 p-1 rounded-lg text-2xl flex items-center justify-center h-20">
                      <BiCricketBall size={50} />
                    </button>
                    <button className="bg-white text-red-600 p-1 rounded-lg text-2xl flex items-center justify-center">
                      <Camera size={50} />
                    </button>

                    {/* UNDO */}
                    <button
                      disabled={isWaiting}
                      className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20 disabled:cursor-not-allowed"
                      onClick={() => {
                        setIsWaiting(true);
                        socketRef.current.send(
                          JSON.stringify(handleUndo(data)),
                        );
                      }}
                    >
                      UNDO
                    </button>

                    {/* OUT */}
                    <button
                      disabled={isWaiting}
                      className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20 disabled:cursor-not-allowed"
                      onClick={() => {
                        handleOutModal();
                      }}
                    >
                      Out
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* ── Player select modal ── */}
          {/* ── Player select modal ── */}
          {activeTab === "Scoring" && !isCommentator && playerSelectModal && (
            <div className="mt-5">
              <div className="bg-red-600 p-3 h-89.5">
                <div className="flex flex-col space-y-2 space-x-2 mt-5">
                  {/* 
          Super Over: use availableBatters/availableBowlers from backend.
          Normal: use team1Players/team2Players based on innings.
        */}
                  {(() => {
                    const batters =
                      availableBatters.length > 0
                        ? availableBatters
                        : data.firstInnings
                          ? team1Players
                          : team2Players;

                    const bowlers =
                      availableBowlers.length > 0
                        ? availableBowlers
                        : data.firstInnings
                          ? team2Players
                          : team1Players;

                    return (
                      <>
                        {/* Batsman 1 */}
                        <select
                          value={strikerId || ""}
                          onChange={(e) => setStrikerId(e.target.value)}
                          className="p-2 rounded-lg h-20 text-2xl bg-white text-red-600"
                        >
                          <option value="">
                            {isSuperOver
                              ? "Select Batsman 1 (Super Over)"
                              : "Select Batsman 1"}
                          </option>
                          {batters.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        {/* Batsman 2 — filter out already-selected striker */}
                        <select
                          value={nonStrikerId || ""}
                          onChange={(e) => setNonStrikerId(e.target.value)}
                          className="p-2 rounded-lg h-20 text-2xl bg-white text-red-600"
                        >
                          <option value="">Select Batsman 2</option>
                          {batters
                            .filter((p) => String(p.id) !== String(strikerId))
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>

                        {/* Bowler */}
                        <select
                          value={bowlerId || ""}
                          onChange={(e) => setBowlerId(e.target.value)}
                          className="p-2 rounded-lg h-20 text-2xl bg-white text-red-600"
                        >
                          <option value="">Select Bowler</option>
                          {bowlers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        <button
                          disabled={
                            isWaiting ||
                            !strikerId ||
                            !nonStrikerId ||
                            !bowlerId
                          }
                          className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleStartMatch}
                        >
                          {isSuperOver ? "Start Super Over" : "Start Match"}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ── Bowler modal (new over) ── */}
          {activeTab === "Scoring" && !isCommentator && bowlerModal && (
            <div className="mt-5">
              <div className="bg-red-600 p-3 h-89.5">
                <div className="flex flex-col space-y-2 space-x-2 mt-5">
                  <select
                    value={bowlerId || ""}
                    onChange={(e) => setBowlerId(e.target.value)}
                    className="p-2 rounded-lg h-20 text-2xl bg-white text-red-600"
                  >
                    <option value="">Select Bowler</option>
                    {availableBowlers.length > 0
                      ? availableBowlers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))
                      : // fallback: first load before WS data arrives
                        (data.firstInnings ? team2Players : team1Players).map(
                          (p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ),
                        )}
                  </select>
                  <button
                    disabled={!bowlerId}
                    className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10 disabled:opacity-50"
                    onClick={confirmBowler}
                  >
                    Confirm Bowler
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Scoring" && !isCommentator && extraModal && (
            <Extras
              mainModal={(val) => (val ? openModal("mainModal") : null)}
              extraType={data.extraType}
              setExtraModal={(val) => !val && openModal("mainModal")}
              setData={setData}
              socket={socketRef.current}
              setIsWaiting={setIsWaiting}
              strikerId={strikerId}
              nonStrikerId={nonStrikerId}
              team1Players={team1Players}
              team2Players={team2Players}
              battingTeamId={battingTeamId}
              team1Id={team1Id}
              team2Id={team2Id}
              availableBatters={availableBatters}
              isDoubleWicket={isDoubleWicket}
              setOutModal={() => openModal("outModal")}
            />
          )}

          {activeTab === "Scoring" && !isCommentator && outModal && (
            <Out
              mainModal={(val) => (val ? openModal("mainModal") : null)}
              outModal={(val) => !val && openModal("mainModal")}
              setData={setData}
              socket={socketRef.current}
              strikerId={strikerId}
              nonStrikerId={nonStrikerId}
              setIsWaiting={setIsWaiting}
              availableBatters={availableBatters}
              availableBowlers={availableBowlers}
              data={data}
              isDoubleWicket={isDoubleWicket}
              isNoballs={data.eventType === "noball_runout"}
            />
          )}

          {/* ── End innings confirmation modal ── */}
          {activeTab === "Scoring" && !isCommentator && end_InningsModal && (
            <div className="mt-5">
              <div className="bg-red-600 p-3 h-89.5">
                <div className="flex flex-col space-y-2 space-x-2 mt-5">
                  <p className="text-white text-lg font-semibold text-center">
                    {data.firstInnings ? "End of First Innings?" : "End Match?"}
                  </p>
                  <button
                    className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10"
                    onClick={() => {
                      if (data.firstInnings === false) {
                        isEndingMatch.current = true;
                        setIsWaiting(true);
                        // ✅ sentEndInningsRef set mat karo second innings mein
                        socketRef.current.send(
                          JSON.stringify(handleEndInnings(data)),
                        );
                        // ✅ koi modal mat kholo — ws.onmessage pe matchEnd:true aayega
                      } else {
                        sentEndInningsRef.current = true;
                        socketRef.current.send(
                          JSON.stringify(handleEndInnings(data)),
                        );
                        openModal("mainModal");
                      }
                    }}
                  >
                    {data.firstInnings ? "End Innings" : "End Match"}
                  </button>
                  <button
                    className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10"
                    onClick={() => {
                      setIsWaiting(true);
                      socketRef.current.send(JSON.stringify(handleUndo(data)));
                      setData((prev) => ({ ...prev, eventType: "" }));
                      openModal("mainModal");
                    }}
                  >
                    Undo Last Ball
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── MORE Modal (Penalty / DLS / Super Over) ── */}
          {moreModal && (
            <MoreModal
              onClose={() => openModal("mainModal")}
              onPenalty={handlePenalty}
              onDLS={handleDLS}
              onSuperOver={handleSuperOver}
              onSubstitute={() => setSubModalOpen(true)}
              isSuperOverPending={isSuperOverPending}
              isSecondInnings={!data.firstInnings}
            />
          )}

          {subModalOpen && (
            <SubstituteModal
              matchId={matchId}
              inningsId={data.inningsId}
              team1Id={team1Id}
              team2Id={team2Id}
              team1Name={team1Name}
              team2Name={team2Name}
              battingTeamId={battingTeamId}
              availableBatters={availableBatters}
              availableBowlers={availableBowlers}
              strikerId={strikerId}
              nonStrikerId={nonStrikerId}
              bowlerId={bowlerId}
              onClose={() => setSubModalOpen(false)}
              onSuccess={(updatedScoreDTO) => {
                setSubModalOpen(false);
                if (updatedScoreDTO) {
                  setData(updatedScoreDTO);
                  if (updatedScoreDTO.batsmanId)
                    setStrikerId(updatedScoreDTO.batsmanId);
                  if (updatedScoreDTO.nonStrikerId)
                    setNonStrikerId(updatedScoreDTO.nonStrikerId);
                  if (updatedScoreDTO.bowlerId)
                    setBowlerId(updatedScoreDTO.bowlerId);
                  if (Array.isArray(updatedScoreDTO.availableBatters)) {
                    setAvailableBatters(updatedScoreDTO.availableBatters);
                  }
                  if (Array.isArray(updatedScoreDTO.availableBowlers)) {
                    setAvailableBowlers(updatedScoreDTO.availableBowlers);
                  }
                }
              }}
            />
          )}

          {/* ── Favourite Player Modal ── */}
          {favPlayerModal && (
            <FavouritePlayerModal
              matchId={matchId}
              team1Id={team1Id}
              team2Id={team2Id}
              team1Name={team1Name}
              team2Name={team2Name}
              team1Players={team1Players}
              team2Players={team2Players}
              onClose={() => {
                closeAllModals();
                setActiveTab("Summary");
              }}
            />
          )}

          {/* ── Scorecard tab ── */}
          {activeTab === "Scorecard" && (
            <div className="max-w-4xl mx-auto p-4 bg-gray-50 rounded-xl shadow-sm">
              <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-red-600 pb-2">
                Match Scorecard
              </h1>
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2 bg-gray-200 p-1 rounded-xl w-fit">
                  <button
                    disabled={scorecardLoading}
                    onClick={() => fetchScorecard(1)}
                    className={`px-6 py-2 rounded-lg font-semibold shadow-sm transition-all active:scale-95 border ${
                      cardFor === 1
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-red-600 border-red-100 hover:bg-red-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {team1Name}
                  </button>
                  <button
                    disabled={scorecardLoading}
                    onClick={() => fetchScorecard(2)}
                    className={`px-6 py-2 rounded-lg font-semibold shadow-sm transition-all active:scale-95 border ${
                      cardFor === 2
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-red-600 border-red-100 hover:bg-red-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {team2Name}
                  </button>
                </div>

                <div className="flex gap-2">
                  {/* Download Button */}
                  <button
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-red-600 text-white 
                               px-4 py-2 rounded-lg font-semibold shadow-sm 
                               hover:bg-red-700 transition-colors 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={18} />
                    {isExporting ? "..." : "Download"}
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={handleSharePdf}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-white border-2 
                               border-red-600 text-red-600 px-4 py-2 rounded-lg 
                               font-semibold shadow-sm hover:bg-red-50 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Share2 size={18} />
                    Share
                  </button>
                </div>
              </div>

              {scorecardLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
                  <p className="mt-4 text-gray-500">Fetching Scorecard...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white mb-8 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-800 text-white text-sm uppercase tracking-wider">
                          <th className="px-4 py-3">Batter</th>
                          <th className="px-4 py-3 text-center">R</th>
                          <th className="px-4 py-3 text-center">B</th>
                          <th className="px-4 py-3 text-center">4s</th>
                          <th className="px-4 py-3 text-center">6s</th>
                          <th className="px-4 py-3 text-center">SR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {team1Scorecard.batsmanScores?.map((player) => (
                          <tr key={player.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-700">
                              {player.name}
                            </td>
                            <td className="px-4 py-3 text-center font-bold">
                              {player.runs}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {player.balls}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {player.fours}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {player.sixes}
                            </td>
                            <td className="px-4 py-3 text-center text-blue-600">
                              {player.strikeRate.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-yellow-500 shadow-sm">
                      <p className="text-sm text-gray-500 uppercase font-bold">
                        Extras
                      </p>
                      <h2 className="text-xl font-semibold">
                        {team1Scorecard.extras}
                      </h2>
                    </div>
                    <div className="bg-red-600 p-4 rounded-lg shadow-md text-white">
                      <p className="text-sm opacity-80 uppercase font-bold">
                        Total Runs
                      </p>
                      <h2 className="text-3xl font-black">
                        {team1Scorecard.totalRuns}
                      </h2>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                      <p className="text-sm text-gray-500 uppercase font-bold">
                        Overs
                      </p>
                      <h2 className="text-xl font-semibold">
                        {team1Scorecard.overs}.{team1Scorecard.balls}
                      </h2>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider">
                          <th className="px-4 py-3">Bowler</th>
                          <th className="px-4 py-3 text-center">O</th>
                          <th className="px-4 py-3 text-center">W</th>
                          <th className="px-4 py-3 text-center">EC</th>
                          <th className="px-4 py-3 text-center">RC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {team1Scorecard.bowlerScores?.map((player) => (
                          <tr key={player.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-700">
                              {player.name}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {player.overs}.{player.ballsBowled}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-red-600">
                              {player.wickets}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {player.economy.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {player.runsConceded}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* FALL OF WICKETS section */}
                  <div className="mt-6">
                    <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">
                      Fall of Wickets
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {team1Scorecard.fallOfWickets?.map((fow, i) => (
                        <div
                          key={i}
                          className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs"
                        >
                          <span className="font-bold text-red-600">
                            {fow.score}-{fow.wicketNumber}
                          </span>
                          <span className="text-gray-500 ml-1">
                            ({fow.playerName}, {fow.over} ov)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PARTNERSHIPS section */}
                  <div className="mt-6">
                    <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">
                      Partnerships
                    </h3>
                    <div className="space-y-2">
                      {team1Scorecard.partnerships?.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <span className="text-xs text-gray-500 w-4">
                            {i + 1}
                          </span>
                          <span className="text-xs font-medium text-gray-700 flex-1">
                            {p.batter1} & {p.batter2}
                          </span>
                          <span className="text-xs font-bold text-gray-800">
                            {p.runs} runs
                          </span>
                          <span className="text-xs text-gray-400">
                            ({p.balls} balls)
                          </span>
                          {p.isNotOut && (
                            <span className="text-xs text-green-600 font-semibold">
                              *
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "Summary" && <MatchSummary matchId={matchId} />}
          {activeTab === "Balls" && (
            <MatchBalls
              matchId={matchId}
              team1Name={team1Name}
              team2Name={team2Name}
              team1Id={team1Id}
              team2Id={team2Id}
            />
          )}

          {/* ══ MEDIA TAB ══ */}
          {activeTab === "Media" && (
            <div className="max-w-4xl mx-auto p-4">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 border-b-2 border-red-600 pb-1">
                  Match Media
                </h1>
                <span className="text-gray-500 text-sm">
                  {matchMedia.length} items
                </span>
              </div>

              {mediaLoading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="large" />
                </div>
              ) : matchMedia.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No media uploaded for this match yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {matchMedia.map((m) => {
                    const isFav = favMediaIds.has(m.id);
                    const isVideo = m.fileType?.includes("video");
                    return (
                      <div
                        key={m.id}
                        className="relative group bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 transition-all hover:shadow-lg"
                      >
                        <div className="aspect-square relative">
                          {isVideo ? (
                            <video
                              src={m.url}
                              controls
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={m.url}
                              className="w-full h-full object-cover"
                              alt="match"
                            />
                          )}
                          <button
                            onClick={() => handleMediaFavouriteToggle(m.id)}
                            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-sm z-10 hover:scale-110 transition-transform"
                          >
                            {isFav ? (
                              <FaHeart className="text-red-500 text-lg" />
                            ) : (
                              <FaRegHeart className="text-gray-400 text-lg" />
                            )}
                          </button>
                        </div>
                        {m.comment && (
                          <div className="p-2">
                            <p className="text-xs text-gray-600 line-clamp-2 italic">
                              "{m.comment}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ FAVOURITES TAB ══ */}
          {activeTab === "Favourites" && (
            <div className="max-w-4xl mx-auto p-4">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 border-b-2 border-red-600 pb-1 flex items-center gap-2">
                  <Star className="text-yellow-500 fill-yellow-500" /> My
                  Favourites
                </h1>
                <span className="text-gray-500 text-sm">
                  {accountFavMedia.length} items
                </span>
              </div>

              {!accountId ? (
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
                  <p className="text-red-600 font-medium">
                    Please login to see your favourites.
                  </p>
                </div>
              ) : favLoading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="large" />
                </div>
              ) : accountFavMedia.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaRegHeart className="text-gray-300 text-4xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">
                    No favourites yet
                  </h3>
                  <p className="text-gray-500 max-w-xs mx-auto">
                    Tap ❤️ on media in the Media tab to save them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {accountFavMedia.map((m) => {
                    const isVideo = m.fileType?.includes("video");
                    return (
                      <div
                        key={m.id}
                        className="relative group bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 transition-all hover:shadow-lg"
                      >
                        <div className="aspect-square relative">
                          {isVideo ? (
                            <video
                              src={m.url}
                              controls
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={m.url}
                              className="w-full h-full object-cover"
                              alt="fav"
                            />
                          )}
                          <button
                            onClick={() => handleFavTabToggle(m.id)}
                            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-sm z-10"
                          >
                            <FaHeart className="text-red-500 text-lg" />
                          </button>
                        </div>
                        {m.comment && (
                          <div className="p-2">
                            <p className="text-xs text-gray-600 line-clamp-2 italic">
                              "{m.comment}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ INFO TAB ══ */}
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
                              status === "LIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {status}
                          </span>
                        ),
                        icon: "📊",
                      },
                      {
                        label: "Teams",
                        value: `${team1Name} vs ${team2Name}`,
                        icon: "⚔️",
                      },
                      {
                        label: "Current Innings",
                        value: data.firstInnings
                          ? "First Innings"
                          : "Second Innings",
                        icon: "🏏",
                      },
                      {
                        label: "Innings Scorer",
                        value: scorerId || "N/A",
                        icon: "📝",
                      },
                      {
                        label: "Media Scorer",
                        value: mediaScorerUsername || "N/A",
                        icon: "📸",
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
        </div>
        {activeTab === "Scoring" &&
          !isCommentator &&
          end_InningsAndSuperOverModal && (
            <div className="mt-5">
              <div className="bg-red-600 p-3 h-89.5">
                <div className="flex flex-col space-y-2 space-x-2 mt-5">
                  {/* ── PHASE A: Tie detected — choose End Match OR Super Over ── */}
                  {isSuperOverPending && !isSuperOver && (
                    <>
                      <p className="text-white text-lg font-semibold text-center">
                        ⚡ Match Tied! Play Super Over?
                      </p>

                      {/* End Match (no super over) */}
                      <button
                        disabled={isWaiting}
                        className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          isEndingMatch.current = true;
                          setIsWaiting(true);
                          socketRef.current.send(
                            JSON.stringify(handleEndInnings(data)),
                          );
                          openModal("mainModal");
                        }}
                      >
                        End Match
                      </button>

                      {/* Super Over */}
                      <button
                        disabled={isWaiting}
                        className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          setIsWaiting(true);
                          socketRef.current.send(
                            JSON.stringify({
                              ...data,
                              eventType: "Super_Over",
                              event: "0",
                              comment: "",
                              undo: false,
                            }),
                          );
                          // Teams stay the same — last batting team bats in SO
                          setIsSuperOver(true);
                          setIsSuperOverPending(false);
                          setIsSuperOverInnings(1);
                          setStrikerId(null);
                          setNonStrikerId(null);
                          setBowlerId(null);
                          player1IdRef.current = null;
                          player2IdRef.current = null;
                          openModal("playerSelectModal");
                        }}
                      >
                        ⚡ Super Over
                      </button>

                      {/* Undo */}
                      <button
                        disabled={isWaiting}
                        className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          setIsWaiting(true);
                          socketRef.current.send(
                            JSON.stringify(handleUndo(data)),
                          );
                          setData((prev) => ({ ...prev, eventType: "" }));
                          openModal("mainModal");
                        }}
                      >
                        Undo Last Ball
                      </button>
                    </>
                  )}

                  {/* ── PHASE B: Super Over in progress — end SO innings ── */}
                  {isSuperOver && (
                    <>
                      <p className="text-white text-lg font-semibold text-center">
                        {isSuperOverInnings === 1
                          ? "⚡ End Super Over Innings 1?"
                          : "⚡ End Super Over — End Match?"}
                      </p>

                      {/* End SO Innings 1 → switch teams → pick new players */}
                      {isSuperOverInnings === 1 && (
                        <button
                          disabled={isWaiting}
                          className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => {
                            const newBattingId = bowlingTeamId;
                            const newBowlingId = battingTeamId;
                            setBattingTeamId(newBattingId);
                            setBowlingTeamId(newBowlingId);
                            setIsSuperOverInnings(2);
                            setStrikerId(null);
                            setNonStrikerId(null);
                            setBowlerId(null);
                            player1IdRef.current = null;
                            player2IdRef.current = null;
                            fetchTeamPlayersForSuperOver(newBattingId);
                            setIsWaiting(true);
                            socketRef.current.send(
                              JSON.stringify({
                                ...data,
                                eventType: "End_Innings",
                                event: "0",
                                comment: "",
                                undo: false,
                                superOver: true,
                                firstInnings: true,
                              }),
                            );
                            openModal("playerSelectModal");
                          }}
                        >
                          End Super Over Innings
                        </button>
                      )}

                      {/* End SO Innings 2 → match over */}
                      {isSuperOverInnings === 2 && (
                        <button
                          disabled={isWaiting}
                          className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => {
                            isEndingMatch.current = true;
                            setIsWaiting(true);
                            socketRef.current.send(
                              JSON.stringify({
                                ...data,
                                eventType: "End_Innings",
                                event: "0",
                                comment: "",
                                undo: false,
                                superOver: true,
                                firstInnings: false,
                              }),
                            );
                            openModal("mainModal");
                          }}
                        >
                          End Match
                        </button>
                      )}

                      {/* Undo */}
                      <button
                        disabled={isWaiting}
                        className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          setIsWaiting(true);
                          socketRef.current.send(
                            JSON.stringify(handleUndo(data)),
                          );
                          setData((prev) => ({ ...prev, eventType: "" }));
                          openModal("mainModal");
                        }}
                      >
                        Undo Last Ball
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </>
  );
}
