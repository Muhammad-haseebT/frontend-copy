import { useState, useEffect } from "react";

export default function Out({
  mainModal,
  outModal,
  setData,
  socket,
  strikerId,
  nonStrikerId,
  setIsWaiting,
  availableBatters,
  availableBowlers, // NEW prop
  data, // NEW prop
  isDoubleWicket, // NEW prop
  isNoballs, // NEW prop
}) {
  const [dismissalType, setDismissalType] = useState("");
  const [caughtModal, setCaughtModal] = useState(false);
  const [aModal, setAModal] = useState(true);

  useEffect(() => {
    if (isNoballs) {
      setDismissalType("Run Out");
      setRunOutModal(true);
      setAModal(false);
    }
  }, [isNoballs]);
  const [batsmanModal, setBatsmanModal] = useState(false);
  const [runOutModal, setRunOutModal] = useState(false);
  const [newBatsmanId, setNewBatsmanId] = useState(null);
  const [fielderId, setFielderId] = useState(null);
  const [outPlayerId, setOutPlayerId] = useState(null);
  const [runs, setRuns] = useState(0);

  const getPlayerName = (id) => {
    if (data?.batsman1Stats?.playerId == id)
      return data.batsman1Stats.playerName;
    if (data?.batsman2Stats?.playerId == id)
      return data.batsman2Stats.playerName;
    return id == strikerId ? "Striker" : "Non-Striker";
  };

  const types = [
    "Bowled",
    "Caught",
    "LBW",
    "Run Out",
    "Stumped",
    "Hit Wicket",
    "Retired",
    "Over The Fence",
    "One Hand One Bounce",
    "Mankad",
  ];

  // In double-wicket mode a replacement isn't required — the penalty handles it
  const needsNewBatsman = !isDoubleWicket;

  const handleSubmit = () => {
    const f = {};
    if (dismissalType === "Caught") {
      f.fielderId = fielderId;
      f.outPlayerId = strikerId;
      f.newPlayerId = newBatsmanId || null;
      f.dismissalType = dismissalType;
    } else if (dismissalType === "Run Out") {
      f.fielderId = fielderId;
      f.outPlayerId = outPlayerId;
      f.newPlayerId = newBatsmanId || null;
      f.dismissalType = dismissalType;
      f.runsOnThisBall = isNoballs ? 0 : runs; // runsOnThisBall is 0 for noball run out
    } else if (dismissalType !== "Mankad") {
      f.outPlayerId = strikerId;
      f.newPlayerId = newBatsmanId || null;
      f.dismissalType = dismissalType;
    } else {
      f.outPlayerId = nonStrikerId;
      f.newPlayerId = newBatsmanId || null;
      f.dismissalType = dismissalType;
    }

    if (typeof dismissalType === "string") {
      f.dismissalType = dismissalType.toLowerCase().replace(" ", "");
    }

    f.eventType = isNoballs ? "noball_runout" : "wicket";
    if (!isNoballs) {
      f.event = runs;
    }

    console.log(f);
    setData((prev) => {
      const updatedData = { ...prev, ...f };
      if (isNoballs) {
        updatedData.eventType = "noball_runout";
        // event is preserved from prev.event (from Extras.jsx) since it was not set in f
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log(updatedData);
        socket.send(JSON.stringify(updatedData));
      } else {
        console.warn("Socket not ready, data not sent");
      }
      return updatedData;
    });
  };

  return (
    <div className="bg-red-600 p-3 h-full mt-3">
      {aModal && (
        <div className="flex justify-between">
          <button
            onClick={() => {
              outModal(false);
              mainModal(true);
            }}
          >
            X
          </button>
        </div>
      )}
      {aModal && (
        <div className="grid grid-cols-3 gap-2">
          {types.map((item, index) => (
            <button
              key={index}
              className="bg-white text-red-600 p-1 rounded-lg text-2xl h-18"
              onClick={() => {
                setDismissalType(item);
                if (item === "Caught") {
                  setCaughtModal(true);
                  setAModal(false);
                }
                if (item === "Run Out") {
                  setRunOutModal(true);
                  setAModal(false);
                }
                if (
                  item === "Stumped" ||
                  item === "Hit Wicket" ||
                  item === "Bowled" ||
                  item === "LBW" ||
                  item === "Retired" ||
                  item === "Mankad" ||
                  item === "Over The Fence" ||
                  item === "One Hand One Bounce"
                ) {
                  setBatsmanModal(true);
                  setAModal(false);
                }
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {caughtModal && (
        <div className="bg-red-600 p-3 h-89.5 mt-5">
          <button
            onClick={() => {
              setCaughtModal(false);
              setAModal(true);
            }}
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-10 mb-3 absolute bottom-70 right-10"
          >
            Close
          </button>
          <br />
          <select
            name="fielder"
            id="fielder"
            className="bg-white text-red-600 p-1 rounded-lg text-2xl h-18 w-full mb-1 mt-3"
            onChange={(e) => setFielderId(e.target.value)}
          >
            <option value="">Select Fielder</option>
            {(availableBowlers || []).map((item, index) => (
              <option key={index} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <br />
          <select
            name="newBatsman"
            id="newBatsman"
            className="bg-white text-red-600 p-1 rounded-lg text-2xl h-18 w-full mb-3"
            onChange={(e) => setNewBatsmanId(e.target.value)}
          >
            <option value="">
              {needsNewBatsman
                ? "Select New Batsman"
                : "Select New Batsman (optional)"}
            </option>
            {(availableBatters?.length > 0 ? availableBatters : [])
              .filter(
                (p) =>
                  String(p.id) !== String(strikerId) &&
                  String(p.id) !== String(nonStrikerId),
              )
              .map((item, index) => (
                <option key={index} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          <br />
          {/* needsNewBatsman: require both fielder + newBatsman
              double-wicket:   require only fielder */}
          <button
            disabled={!fielderId || (needsNewBatsman && !newBatsmanId)}
            onClick={() => {
              setIsWaiting?.(true);
              setCaughtModal(false);
              outModal(false);
              mainModal(true);
              handleSubmit();
            }}
            className="bg-white text-red-600 p-1 rounded-lg text-2xl h-18 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      )}

      {runOutModal && (
        <div className="bg-red-600 p-3 h-89.5 mt-5">
          <button
            onClick={() => {
              if (isNoballs) {
                setData((prev) => ({ ...prev, eventType: "" }));
                outModal(false);
                mainModal(true);
              } else {
                setRunOutModal(false);
                setAModal(true);
              }
            }}
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-10 mb-5 absolute bottom-70 right-10"
          >
            Close
          </button>
          {!isNoballs && (
            <>
              <input
                type="number"
                placeholder="Enter Runs"
                className="bg-white text-red-600 p-1 rounded-lg text-xl h-12 w-full mb-1 mt-5"
                onChange={(e) => setRuns(e.target.value)}
              />
              <br />
            </>
          )}
          <select
            name="fielder"
            id="fielder"
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-12 w-full mb-1"
            onChange={(e) => setFielderId(e.target.value)}
          >
            <option value="">Select Fielder</option>
            {(availableBowlers || []).map((item, index) => (
              <option key={index} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <br />
          <select
            name="outPlayerId"
            id="outPlayerId"
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-12 w-full mb-1"
            onChange={(e) => setOutPlayerId(e.target.value)}
          >
            <option value="">Select Out Player</option>
            <option value={strikerId}>{getPlayerName(strikerId)}</option>
            <option value={nonStrikerId}>{getPlayerName(nonStrikerId)}</option>
          </select>
          <br />
          <select
            name="newBatsman"
            id="newBatsman"
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-12 w-full mb-1"
            onChange={(e) => setNewBatsmanId(e.target.value)}
          >
            <option value="">
              {needsNewBatsman
                ? "Select New Batsman"
                : "Select New Batsman (optional)"}
            </option>
            {(availableBatters?.length > 0 ? availableBatters : [])
              .filter(
                (p) =>
                  String(p.id) !== String(strikerId) &&
                  String(p.id) !== String(nonStrikerId),
              )
              .map((item, index) => (
                <option key={index} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          <br />
          <button
            disabled={
              !fielderId || !outPlayerId || (needsNewBatsman && !newBatsmanId)
            }
            onClick={() => {
              setIsWaiting?.(true);
              setRunOutModal(false);
              outModal(false);
              mainModal(true);
              handleSubmit();
            }}
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-12 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      )}

      {batsmanModal && (
        <div className="bg-red-600 p-3 h-89.5 mt-5">
          <button
            onClick={() => {
              setBatsmanModal(false);
              setAModal(true);
            }}
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-10 mb-5 absolute bottom-70 right-10"
          >
            Close
          </button>
          <br />
          <select
            name="newBatsman"
            id="newBatsman"
            className="bg-white text-red-600 p-1 rounded-lg text-2xl h-18 w-full mb-5 mt-10"
            onChange={(e) => setNewBatsmanId(e.target.value)}
          >
            <option value="">
              {needsNewBatsman
                ? "Select New Batsman"
                : "Select New Batsman (optional)"}
            </option>
            {(availableBatters?.length > 0 ? availableBatters : [])
              .filter(
                (p) =>
                  String(p.id) !== String(strikerId) &&
                  String(p.id) !== String(nonStrikerId),
              )
              .map((item, index) => (
                <option key={index} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          <br />
          {/* double-wicket: can submit without a new batsman */}
          <button
            disabled={needsNewBatsman && !newBatsmanId}
            onClick={() => {
              setIsWaiting?.(true);
              setBatsmanModal(false);
              mainModal(true);
              outModal(false);
              handleSubmit();
            }}
            className="bg-white text-red-600 p-1 rounded-lg text-2xl h-18 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
