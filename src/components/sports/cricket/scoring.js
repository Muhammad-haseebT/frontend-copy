export const handleRuns = (data, event, type) => {
  data.event = event;
  data.eventType = event == 4 || event == 6 ? "boundary" : "run";
  data.isLegal = true;
  data.comment = "";

  return data;
};
export const handleUndo = (data) => {
  data.undo = true;
  return data;
};
// scoring.js — yeh function is tarah hona chahiye
export const handleSuperOver = (data) => ({
  ...data,
  eventType: "Super_Over",
  event: "0",
  comment: "",
  undo: false,
});

export const handleEndInnings = (data) => ({
  ...data,
  eventType: "End_Innings",
  event: "0",
  comment: "",
  undo: false,
});
