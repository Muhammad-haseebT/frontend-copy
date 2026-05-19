// ─── Hockey Scoring Event Helpers ───────────────────────────────────────────

export const handleGoal = (data, scorerId, assistId = null) => {
  return {
    ...data,
    eventType: "goal",
    event: "GOAL",
    scorerId,
    assistId,
    undo: false,
    comment: "",
  };
};

export const handleOwnGoal = (data, scorerId) => {
  return {
    ...data,
    eventType: "own_goal",
    event: "OWN_GOAL",
    scorerId,
    undo: false,
    comment: "",
  };
};

export const handleFoul = (data, playerId, foulType = "foul") => {
  return {
    ...data,
    eventType: "foul",
    event: foulType.toUpperCase(),
    playerId,
    undo: false,
    comment: "",
  };
};

export const handleGreenCard = (data, playerId) => {
  return {
    ...data,
    eventType: "green_card",
    event: "GREEN_CARD",
    playerId,
    undo: false,
    comment: "",
  };
};

export const handleYellowCard = (data, playerId) => {
  return {
    ...data,
    eventType: "yellow_card",
    event: "YELLOW_CARD",
    playerId,
    undo: false,
    comment: "",
  };
};

export const handleRedCard = (data, playerId) => {
  return {
    ...data,
    eventType: "red_card",
    event: "RED_CARD",
    playerId,
    undo: false,
    comment: "",
  };
};

export const handleSubstitution = (data, outPlayerId, inPlayerId, teamId) => {
  return {
    ...data,
    eventType: "substitution",
    event: "SUB",
    outPlayerId,
    inPlayerId,
    teamId,
    undo: false,
    comment: "",
  };
};

export const handleUndo = (data) => {
  return {
    ...data,
    undo: true,
    comment: "",
  };
};

export const handleEndPeriod = (data) => {
  return {
    ...data,
    eventType: "end_period",
    event: "END_PERIOD",
    undo: false,
    comment: null,
  };
};

export const handlePenaltyCorner = (data, teamId) => {
  return {
    ...data,
    eventType: "penalty_corner",
    event: "PENALTY_CORNER",
    teamId,
    undo: false,
    comment: "",
  };
};

export const handleTimeout = (data, teamId) => {
  return {
    ...data,
    eventType: "timeout",
    event: "TIMEOUT",
    teamId,
    undo: false,
    comment: "",
  };
};
