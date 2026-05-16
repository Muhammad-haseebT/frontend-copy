/**
 * Detects cricket milestones from backend ball data.
 *
 * Design principle: NO local counters. Every detection is purely derived
 * from the cricketBalls array coming from the backend (source of truth).
 * Undo safety: guard on `balls.length > prevBalls.length` means no popup
 * fires when the array shrinks (undo) or stays the same (reconnect echo).
 *
 * @param {Array}  balls     - data.cricketBalls from WebSocket (oldest→newest, ORDER BY id ASC)
 * @param {Object} data      - current ScoreDTO payload
 * @param {Object} prevData  - previous ScoreDTO payload (null on first message)
 * @returns {Object|null}    - milestone object { title, subtitle, emoji, color } or null
 */
export function detectCricketMilestone(balls, data, prevData) {
  if (!balls || balls.length === 0) return null;

  const prevBalls = prevData?.cricketBalls || [];

  // ── GUARD: Only trigger on genuinely new ball ──────────────────────────────
  // Array grew   → new ball was added → proceed
  // Array shrunk → undo happened      → skip entirely
  // Array same   → reconnect echo     → skip
  const isNewBall = balls.length > prevBalls.length;
  if (!isNewBall) return null;

  const latest = balls[balls.length - 1];

  // ── HELPERS ────────────────────────────────────────────────────────────────
  const isSix   = (b) => b.isSix  === true || b.event === "6";
  const isFour  = (b) => b.isFour === true || b.event === "4";
  const isLegal = (b) => b.legalDelivery === true;

  /**
   * Walks the given array backwards counting consecutive balls that satisfy
   * the predicate, stopping at the first mismatch.
   */
  const countStreakIn = (arr, predicate) => {
    let count = 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (predicate(arr[i])) count++;
      else break;
    }
    return count;
  };

  // ── 1. CONSECUTIVE SIXES ──────────────────────────────────────────────────
  if (isSix(latest)) {
    const sixStreak     = countStreakIn(balls,     isSix);
    const prevSixStreak = countStreakIn(prevBalls, isSix);

    // Only announce when we cross a NEW threshold (prev streak was exactly one less)
    if (sixStreak === 3 && prevSixStreak === 2) return {
      title:    "3 Consecutive Sixes! 🔥",
      subtitle: `${latest.batsmanName || "Batsman"} on fire!`,
      emoji:    "💥",
      color:    "gold",
    };
    if (sixStreak === 4 && prevSixStreak === 3) return {
      title:    "4 Sixes in a Row!",
      subtitle: `${latest.batsmanName || "Batsman"} — Unstoppable!`,
      emoji:    "🚀",
      color:    "gold",
    };
    if (sixStreak >= 5 && prevSixStreak === sixStreak - 1) return {
      title:    `${sixStreak} Sixes Streak!`,
      subtitle: `${latest.batsmanName || "Batsman"} — LEGEND`,
      emoji:    "👑",
      color:    "gold",
    };
  }

  // ── 2. CONSECUTIVE FOURS ──────────────────────────────────────────────────
  if (isFour(latest)) {
    const fourStreak     = countStreakIn(balls,     isFour);
    const prevFourStreak = countStreakIn(prevBalls, isFour);

    if (fourStreak === 3 && prevFourStreak === 2) return {
      title:    "3 Fours in a Row!",
      subtitle: `${latest.batsmanName || "Batsman"} — Boundary Machine`,
      emoji:    "🏏",
      color:    "blue",
    };
    if (fourStreak >= 4 && prevFourStreak === fourStreak - 1) return {
      title:    `${fourStreak} Fours in a Row!`,
      subtitle: `${latest.batsmanName || "Batsman"}`,
      emoji:    "🏏",
      color:    "blue",
    };
  }

  // ── 3. HAT-TRICK ──────────────────────────────────────────────────────────
  if (latest.eventType === "wicket") {
    const last3 = balls.slice(-3);
    if (
      last3.length === 3 &&
      last3.every((b) => b.eventType === "wicket") &&
      last3.every((b) => b.bowlerName === latest.bowlerName)
    ) {
      return {
        title:    "HAT-TRICK! 🎳",
        subtitle: `${latest.bowlerName || "Bowler"} — 3 wickets in a row!`,
        emoji:    "🎳",
        color:    "red",
      };
    }
  }

  // ── 4. BATSMAN MILESTONE (50 / 100 / 150) ─────────────────────────────────
  // Looks up by playerId so the correct slot is found even after innings swap.
  const checkBatsmanMilestone = (currentStats) => {
    if (!currentStats?.playerId) return null;

    const prevStats = [prevData?.batsman1Stats, prevData?.batsman2Stats].find(
      (s) => s?.playerId === currentStats.playerId
    );
    const runs     = currentStats.runs ?? 0;
    const prevRuns = prevStats?.runs    ?? 0;

    if (prevRuns < 50  && runs >= 50  && runs < 100) return {
      title:    "FIFTY! ✨",
      subtitle: `${currentStats.playerName} — 50 runs`,
      emoji:    "🏅",
      color:    "gold",
    };
    if (prevRuns < 100 && runs >= 100 && runs < 150) return {
      title:    "CENTURY! 💯",
      subtitle: `${currentStats.playerName} — 100 runs!`,
      emoji:    "🏆",
      color:    "gold",
    };
    if (prevRuns < 150 && runs >= 150) return {
      title:    "150! MAGNIFICENT!",
      subtitle: `${currentStats.playerName}`,
      emoji:    "👑",
      color:    "gold",
    };
    return null;
  };

  const m1 = checkBatsmanMilestone(data.batsman1Stats);
  if (m1) return m1;
  const m2 = checkBatsmanMilestone(data.batsman2Stats);
  if (m2) return m2;

  // ── 5. BOWLER: 5-WICKET HAUL ──────────────────────────────────────────────
  const bowlerW     = data.bowlerStats?.wickets     ?? 0;
  const prevBowlerW = prevData?.bowlerStats?.wickets ?? 0;
  if (prevBowlerW < 5 && bowlerW >= 5) return {
    title:    "FIVE-FOR! 🔥",
    subtitle: `${data.bowlerStats?.playerName} — 5 wickets!`,
    emoji:    "🎳",
    color:    "red",
  };

  // ── 6. MATCH-WINNING SHOT ─────────────────────────────────────────────────
  // target <= 0 means team has won (backend convention)
  if (!data.firstInnings && data.target <= 0) {
    if (isSix(latest)) return {
      title:    "WON WITH A SIX! 🎆",
      subtitle: `${latest.batsmanName || "Batsman"} — Match winner!`,
      emoji:    "🎆",
      color:    "green",
    };
    if (isFour(latest)) return {
      title:    "WON WITH A FOUR! 🎇",
      subtitle: `${latest.batsmanName || "Batsman"} — Match winner!`,
      emoji:    "🎇",
      color:    "green",
    };
  }

  // ── 7. MAIDEN OVER ────────────────────────────────────────────────────────
  // Detected when: current balls===0 AND overs increased (new over just started).
  // The over that just finished is in prevBalls — check if all legal balls = 0 runs.
  if (
    data.balls === 0 &&
    data.overs > 0 &&
    prevData &&
    data.overs > (prevData.overs ?? 0)
  ) {
    const completedOverNo = data.overs - 1;
    const overBalls = prevBalls.filter(
      (b) => b.overNumber === completedOverNo && isLegal(b)
    );
    const overRuns = overBalls.reduce((sum, b) => sum + (b.runs ?? 0), 0);
    if (overBalls.length >= 6 && overRuns === 0) return {
      title:    "MAIDEN OVER! 🔒",
      subtitle: `${prevData.bowlerStats?.playerName || "Bowler"} — Over ${completedOverNo + 1}`,
      emoji:    "🔒",
      color:    "blue",
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detects volleyball milestones from WebSocket payload.
 * Same guard: only fires when event array grew (not on undo or echo).
 *
 * @param {Object} vbData     - current VolleyballScoreDTO
 * @param {Object} prevVbData - previous VolleyballScoreDTO
 * @returns {Object|null}
 */
export function detectVolleyballMilestone(vbData, prevVbData) {
  if (!vbData || !prevVbData) return null;

  const events     = vbData.volleyballEvents     || [];
  const prevEvents = prevVbData.volleyballEvents || [];

  // Guard: only on new event (undo shrinks array)
  if (events.length <= prevEvents.length) return null;

  const latest       = events[events.length - 1];
  const scoringTypes = ["POINT", "ACE", "BLOCK"];

  // ── ACE ───────────────────────────────────────────────────────────────────
  if (latest.eventType === "ACE") return {
    title:    "ACE! 🎯",
    subtitle: `${latest.playerName || latest.teamName || ""}`,
    emoji:    "🎯",
    color:    "gold",
  };

  // ── BLOCK ─────────────────────────────────────────────────────────────────
  if (latest.eventType === "BLOCK") return {
    title:    "MONSTER BLOCK! 🧱",
    subtitle: `${latest.playerName || latest.teamName || ""}`,
    emoji:    "🧱",
    color:    "red",
  };

  // ── 3 CONSECUTIVE POINTS — same team ──────────────────────────────────────
  if (scoringTypes.includes(latest.eventType)) {
    const last3 = events.slice(-3);
    if (
      last3.length === 3 &&
      last3.every((e) => e.teamId === latest.teamId) &&
      last3.every((e) => scoringTypes.includes(e.eventType))
    ) {
      // Cross threshold: prev 2 were already for this team — now it's 3
      const prev2 = prevEvents.slice(-2);
      const prevStreakWas2 =
        prev2.length === 2 &&
        prev2.every((e) => e.teamId === latest.teamId && scoringTypes.includes(e.eventType));

      if (prevStreakWas2) return {
        title:    `${latest.teamName || "Team"} — 3 Point Run! ⚡`,
        subtitle: "Momentum shift!",
        emoji:    "⚡",
        color:    "blue",
      };
    }
  }

  // ── SET WON ───────────────────────────────────────────────────────────────
  if (
    vbData.team1Sets !== prevVbData.team1Sets ||
    vbData.team2Sets !== prevVbData.team2Sets
  ) {
    const winnerName =
      vbData.team1Sets > prevVbData.team1Sets
        ? vbData.team1Name || "Team 1"
        : vbData.team2Name || "Team 2";
    const setNumber = (vbData.team1Sets ?? 0) + (vbData.team2Sets ?? 0);
    return {
      title:    "Set Won! 🏐",
      subtitle: `${winnerName} — Set ${setNumber}`,
      emoji:    "🏐",
      color:    "green",
    };
  }


  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUTSAL
// ─────────────────────────────────────────────────────────────────────────────

export function detectFutsalMilestone(data, prevData) {
  if (!data || !prevData) return null;

  const events     = data.futsalEvents     || [];
  const prevEvents = prevData.futsalEvents || [];

  // Guard: only on new event (undo shrinks array)
  if (events.length <= prevEvents.length) return null;

  const latest = events[events.length - 1];

  // ── 1. GOAL ───────────────────────────────────────────────────────────────
  if (latest.eventType === "GOAL" || latest.eventType === "OWN_GOAL") {
    if (latest.eventType === "OWN_GOAL") return {
      title:    "Own Goal! 😬",
      subtitle: `${latest.playerName || latest.scorerName || "Player"} — into their own net`,
      emoji:    "😬",
      color:    "red",
    };

    if (latest.goalType === "PENALTY") return {
      title:    "Penalty Goal! 🎯",
      subtitle: `${latest.playerName || latest.scorerName || latest.teamName || ""}`,
      emoji:    "🎯",
      color:    "gold",
    };

    // Count goals by same player in this match
    const playerGoals = events.filter(
      (e) => e.eventType === "GOAL" &&
             (e.playerId === latest.playerId || e.scorerName === latest.scorerName)
    ).length;
    const prevPlayerGoals = prevEvents.filter(
      (e) => e.eventType === "GOAL" &&
             (e.playerId === latest.playerId || e.scorerName === latest.scorerName)
    ).length;

    if (playerGoals === 3 && prevPlayerGoals === 2) return {
      title:    "HAT-TRICK! 🎩",
      subtitle: `${latest.playerName || latest.scorerName || "Player"} — 3 goals!`,
      emoji:    "🎩",
      color:    "gold",
    };
    if (playerGoals === 2 && prevPlayerGoals === 1) return {
      title:    "BRACE! ⚽⚽",
      subtitle: `${latest.playerName || latest.scorerName || "Player"} — 2 goals`,
      emoji:    "⚽",
      color:    "green",
    };
    if (playerGoals >= 4 && prevPlayerGoals === playerGoals - 1) return {
      title:    `${playerGoals} Goals! INSANE! 🔥`,
      subtitle: `${latest.playerName || latest.scorerName || "Player"}`,
      emoji:    "🔥",
      color:    "gold",
    };

    // Equalizer
    const prevT1 = prevData.team1Score || 0;
    const prevT2 = prevData.team2Score || 0;
    const currT1 = data.team1Score     || 0;
    const currT2 = data.team2Score     || 0;
    if (currT1 === currT2 && prevT1 !== prevT2) return {
      title:    "EQUALIZER! ⚡",
      subtitle: `${latest.teamName || "Team"} — ${currT1}–${currT2}`,
      emoji:    "⚡",
      color:    "blue",
    };

    // First goal
    if (currT1 + currT2 === 1) return {
      title:    "FIRST BLOOD! 🥅",
      subtitle: `${latest.playerName || latest.scorerName || latest.teamName || ""}`,
      emoji:    "🥅",
      color:    "green",
    };
  }

  // ── 2. RED CARD ───────────────────────────────────────────────────────────
  if (latest.eventType === "RED_CARD") return {
    title:    "RED CARD! 🟥",
    subtitle: `${latest.playerName || "Player"} — ${latest.teamName || "Team"} is down!`,
    emoji:    "🟥",
    color:    "red",
  };

  // ── 3. 5th TEAM FOUL (penalty kick situation) ─────────────────────────────
  const t1Fouls = data.team1Fouls    || 0;
  const t2Fouls = data.team2Fouls    || 0;
  const pt1F    = prevData.team1Fouls || 0;
  const pt2F    = prevData.team2Fouls || 0;
  if (pt1F < 5 && t1Fouls >= 5) return {
    title:    "5 Fouls! Penalty Zone ⚠️",
    subtitle: `${data.team1Name || team1Name || "Team 1"} — opponents get penalty kicks`,
    emoji:    "⚠️",
    color:    "red",
  };
  if (pt2F < 5 && t2Fouls >= 5) return {
    title:    "5 Fouls! Penalty Zone ⚠️",
    subtitle: `${data.team2Name || team2Name || "Team 2"} — opponents get penalty kicks`,
    emoji:    "⚠️",
    color:    "red",
  };

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE TENNIS
// ─────────────────────────────────────────────────────────────────────────────

export function detectTableTennisMilestone(data, prevData) {
  if (!data || !prevData) return null;

  const events     = data.tableTennisEvents     || [];
  const prevEvents = prevData.tableTennisEvents || [];

  if (events.length <= prevEvents.length) return null;

  const t1  = data.team1Points     || 0;
  const t2  = data.team2Points     || 0;
  const pt1 = prevData.team1Points || 0;
  const pt2 = prevData.team2Points || 0;
  const g1  = data.team1Games      || 0;
  const g2  = data.team2Games      || 0;
  const pg1 = prevData.team1Games  || 0;
  const pg2 = prevData.team2Games  || 0;

  // ── 1. GAME WON — check first so it takes priority over deuce/game-point ──
  if (g1 > pg1) return {
    title:    `Game ${g1 + g2} Won! 🏆`,
    subtitle: `${data.team1Name || "Team 1"} — ${g1}–${g2} in games`,
    emoji:    "🏆",
    color:    "green",
  };
  if (g2 > pg2) return {
    title:    `Game ${g1 + g2} Won! 🏆`,
    subtitle: `${data.team2Name || "Team 2"} — ${g2}–${g1} in games`,
    emoji:    "🏆",
    color:    "green",
  };

  // ── 2. DEUCE (10-10) ─────────────────────────────────────────────────────
  const deucePts = (data.pointsPerGame || 11) - 1;
  if (t1 === deucePts && t2 === deucePts && !(pt1 === deucePts && pt2 === deucePts)) return {
    title:    "DEUCE! 🏓",
    subtitle: `${data.team1Name || "Team 1"} vs ${data.team2Name || "Team 2"} — ${deucePts}–${deucePts}`,
    emoji:    "🏓",
    color:    "blue",
  };

  // ── 3. GAME POINT ─────────────────────────────────────────────────────────
  const gameTarget = data.pointsPerGame || 11;
  const deuceMode  = t1 >= deucePts && t2 >= deucePts;
  if (!deuceMode) {
    if (t1 === gameTarget - 1 && t1 > t2 && !(pt1 === gameTarget - 1 && pt1 > pt2)) return {
      title:    "Game Point! 🎯",
      subtitle: `${data.team1Name || "Team 1"} — one away!`,
      emoji:    "🎯",
      color:    "gold",
    };
    if (t2 === gameTarget - 1 && t2 > t1 && !(pt2 === gameTarget - 1 && pt2 > pt1)) return {
      title:    "Game Point! 🎯",
      subtitle: `${data.team2Name || "Team 2"} — one away!`,
      emoji:    "🎯",
      color:    "gold",
    };
  }

  // ── 4. MATCH POINT ────────────────────────────────────────────────────────
  const gamesNeeded = data.gamesToWin || 4;
  // Only announce on the game that just brought us to gamesNeeded-1
  if (g1 === gamesNeeded - 1 && g1 > pg1) return {
    title:    "MATCH POINT! ⚡",
    subtitle: `${data.team1Name || "Team 1"} — one game away!`,
    emoji:    "⚡",
    color:    "red",
  };
  if (g2 === gamesNeeded - 1 && g2 > pg2) return {
    title:    "MATCH POINT! ⚡",
    subtitle: `${data.team2Name || "Team 2"} — one game away!`,
    emoji:    "⚡",
    color:    "red",
  };

  // ── 5. POINT STREAK (5 consecutive by same team) ─────────────────────────
  const latest = events[events.length - 1];
  const scoringTypes = ["POINT", "SMASH", "SERVICE_ACE", "EDGE_BALL"];
  const scoringEvts  = events.filter((e) => scoringTypes.includes(e.eventType));
  if (scoringEvts.length >= 5) {
    const last5 = scoringEvts.slice(-5);
    const allSame = last5.every((e) => e.teamId === latest.teamId);
    const prevLast5 = scoringEvts.slice(-6, -1);
    const prevAllSame = prevLast5.length >= 5 &&
      prevLast5.slice(-5).every((e) => e.teamId === latest.teamId);
    if (allSame && !prevAllSame) return {
      title:    "5 in a Row! 🔥",
      subtitle: `${latest.teamName || "Team"} on a run!`,
      emoji:    "🔥",
      color:    "red",
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// BADMINTON
// ─────────────────────────────────────────────────────────────────────────────

export function detectBadmintonMilestone(data, prevData) {
  if (!data || !prevData) return null;

  const events     = data.badmintonEvents     || [];
  const prevEvents = prevData.badmintonEvents || [];

  if (events.length <= prevEvents.length) return null;

  const t1  = data.team1Points     || 0;
  const t2  = data.team2Points     || 0;
  const pt1 = prevData.team1Points || 0;
  const pt2 = prevData.team2Points || 0;
  const g1  = data.team1Games      || 0;
  const g2  = data.team2Games      || 0;
  const pg1 = prevData.team1Games  || 0;
  const pg2 = prevData.team2Games  || 0;

  // ── 1. GAME WON — first ───────────────────────────────────────────────────
  if (g1 > pg1) {
    const gamesNeeded = data.gamesToWin || 2;
    if (g1 === gamesNeeded - 1 && g2 === gamesNeeded - 1) return {
      title:    "Deciding Game! ⚡",
      subtitle: `${data.team1Name || "Team 1"} vs ${data.team2Name || "Team 2"} — Winner takes all!`,
      emoji:    "⚡",
      color:    "red",
    };
    return {
      title:    `Game ${g1 + g2} Won! 🏅`,
      subtitle: `${data.team1Name || "Team 1"} — ${g1}–${g2} games`,
      emoji:    "🏅",
      color:    "green",
    };
  }
  if (g2 > pg2) {
    const gamesNeeded = data.gamesToWin || 2;
    if (g1 === gamesNeeded - 1 && g2 === gamesNeeded - 1) return {
      title:    "Deciding Game! ⚡",
      subtitle: `${data.team1Name || "Team 1"} vs ${data.team2Name || "Team 2"} — Winner takes all!`,
      emoji:    "⚡",
      color:    "red",
    };
    return {
      title:    `Game ${g1 + g2} Won! 🏅`,
      subtitle: `${data.team2Name || "Team 2"} — ${g2}–${g1} games`,
      emoji:    "🏅",
      color:    "green",
    };
  }

  // ── 2. DEUCE (20-20) ─────────────────────────────────────────────────────
  const deucePts = (data.pointsPerGame || 21) - 1;
  if (t1 === deucePts && t2 === deucePts && !(pt1 === deucePts && pt2 === deucePts)) return {
    title:    "DEUCE! 🏸",
    subtitle: `${deucePts}–${deucePts} — First to 2 ahead wins!`,
    emoji:    "🏸",
    color:    "blue",
  };

  // ── 3. GAME POINT ─────────────────────────────────────────────────────────
  const gameTarget = data.pointsPerGame || 21;
  const deuceMode  = t1 >= deucePts && t2 >= deucePts;
  if (!deuceMode) {
    if (t1 === gameTarget - 1 && t1 > t2 && !(pt1 === gameTarget - 1 && pt1 > pt2)) return {
      title:    "Game Point! 🎯",
      subtitle: `${data.team1Name || "Team 1"} — one away!`,
      emoji:    "🎯",
      color:    "gold",
    };
    if (t2 === gameTarget - 1 && t2 > t1 && !(pt2 === gameTarget - 1 && pt2 > pt1)) return {
      title:    "Game Point! 🎯",
      subtitle: `${data.team2Name || "Team 2"} — one away!`,
      emoji:    "🎯",
      color:    "gold",
    };
  }

  // ── 4. POINT STREAK (5 consecutive) ──────────────────────────────────────
  const latest = events[events.length - 1];
  const scoringTypes = ["POINT", "SMASH", "SERVICE_ACE"];
  const scoringEvts  = events.filter((e) => scoringTypes.includes(e.eventType));
  if (scoringEvts.length >= 5) {
    const last5 = scoringEvts.slice(-5);
    const allSame = last5.every((e) => e.teamId === latest.teamId);
    const prevLast5 = scoringEvts.slice(-6, -1);
    const prevAllSame = prevLast5.length >= 5 &&
      prevLast5.slice(-5).every((e) => e.teamId === latest.teamId);
    if (allSame && !prevAllSame) return {
      title:    "5 in a Row! 🔥",
      subtitle: `${latest.teamName || "Team"} — momentum!`,
      emoji:    "🔥",
      color:    "red",
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TUG OF WAR
// ─────────────────────────────────────────────────────────────────────────────

export function detectTugOfWarMilestone(data, prevData) {
  if (!data || !prevData) return null;

  const events     = data.tugOfWarEvents     || [];
  const prevEvents = prevData.tugOfWarEvents || [];

  if (events.length <= prevEvents.length) return null;

  const r1  = data.team1Rounds     || 0;
  const r2  = data.team2Rounds     || 0;
  const pr1 = prevData.team1Rounds || 0;
  const pr2 = prevData.team2Rounds || 0;

  // ── ROUND WON ─────────────────────────────────────────────────────────────
  if (r1 > pr1) {
    if (pr1 < pr2) return {
      title:    "COMEBACK! Round Won! 💪",
      subtitle: `${data.team1Name || "Team 1"} — back in it!`,
      emoji:    "💪",
      color:    "blue",
    };
    const rNeeded = data.roundsToWin || 3;
    if (r1 === rNeeded - 1 && r2 === rNeeded - 1) return {
      title:    "Deciding Round! ⚡",
      subtitle: "Winner takes the match!",
      emoji:    "⚡",
      color:    "red",
    };
    return {
      title:    `Round ${r1 + r2} Won! 🏆`,
      subtitle: `${data.team1Name || "Team 1"} — ${r1}–${r2} rounds`,
      emoji:    "🏆",
      color:    "green",
    };
  }
  if (r2 > pr2) {
    if (pr2 < pr1) return {
      title:    "COMEBACK! Round Won! 💪",
      subtitle: `${data.team2Name || "Team 2"} — back in it!`,
      emoji:    "💪",
      color:    "blue",
    };
    const rNeeded = data.roundsToWin || 3;
    if (r1 === rNeeded - 1 && r2 === rNeeded - 1) return {
      title:    "Deciding Round! ⚡",
      subtitle: "Winner takes the match!",
      emoji:    "⚡",
      color:    "red",
    };
    return {
      title:    `Round ${r1 + r2} Won! 🏆`,
      subtitle: `${data.team2Name || "Team 2"} — ${r2}–${r1} rounds`,
      emoji:    "🏆",
      color:    "green",
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LUDO — simplified to HOME_RUN events (matches actual backend)
// ─────────────────────────────────────────────────────────────────────────────

export function detectLudoMilestone(data, prevData) {
  if (!data || !prevData) return null;

  const events     = data.ludoEvents     || [];
  const prevEvents = prevData.ludoEvents || [];

  if (events.length <= prevEvents.length) return null;

  const latest = events[events.length - 1];

  if (latest.eventType === "HOME_RUN") {
    const h1 = data.team1HomeRuns || 0;
    const h2 = data.team2HomeRuns || 0;
    const max = data.maxHomeRuns  || 4;

    // All tokens home = WIN
    if (h1 >= max || h2 >= max) return {
      title:    "ALL HOME! 👑",
      subtitle: `${latest.teamId === data.team1Id
        ? (data.team1Name || "Team 1")
        : (data.team2Name || "Team 2")} WINS!`,
      emoji:    "👑",
      color:    "gold",
    };

    // Milestone at 50% and 75%
    const teamRuns = latest.teamId === data.team1Id ? h1 : h2;
    const half     = Math.ceil(max / 2);
    const threeFour = Math.ceil(max * 3 / 4);

    if (teamRuns === threeFour) return {
      title:    "Almost There! 🏠",
      subtitle: `${latest.teamId === data.team1Id
        ? (data.team1Name || "Team 1")
        : (data.team2Name || "Team 2")} — ${teamRuns}/${max} home`,
      emoji:    "🏠",
      color:    "green",
    };

    return {
      title:    "Home Run! 🏠",
      subtitle: `${latest.teamId === data.team1Id
        ? (data.team1Name || "Team 1")
        : (data.team2Name || "Team 2")} — ${teamRuns}/${max}`,
      emoji:    "🏠",
      color:    "green",
    };
  }

  if (latest.eventType === "WIN") return {
    title:    "MATCH WON! 🎲",
    subtitle: `${latest.teamName || "Team"}`,
    emoji:    "🎲",
    color:    "gold",
  };

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHESS — maps actual event types sent by backend
// ─────────────────────────────────────────────────────────────────────────────

export function detectChessMilestone(data, prevData) {
  if (!data || !prevData) return null;

  const events     = data.chessEvents     || [];
  const prevEvents = prevData.chessEvents || [];

  if (events.length <= prevEvents.length) return null;

  const latest = events[events.length - 1];

  switch (latest.eventType) {
    case "CHECKMATE": return {
      title:    "CHECKMATE! ♟️",
      subtitle: `${latest.teamName || "Player"} WINS!`,
      emoji:    "♟️",
      color:    "gold",
    };
    case "DRAW_AGREED": return {
      title:    "Draw by Agreement 🤝",
      subtitle: `${data.team1Name || ""} vs ${data.team2Name || ""}`,
      emoji:    "🤝",
      color:    "blue",
    };
    case "STALEMATE": return {
      title:    "Stalemate — Draw! 🤝",
      subtitle: "No legal moves — game drawn",
      emoji:    "🤝",
      color:    "blue",
    };
    case "RESIGN": return {
      title:    "Resigned! 🏳️",
      subtitle: `${latest.teamName || "Player"} — surrenders`,
      emoji:    "🏳️",
      color:    "red",
    };
    case "TIMEOUT": return {
      title:    "Time Out! ⏱️",
      subtitle: `${latest.teamName || "Player"} — ran out of time`,
      emoji:    "⏱️",
      color:    "red",
    };
    default: return null;
  }
}
