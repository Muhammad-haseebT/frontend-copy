import { useState } from "react";
import { data } from "react-router-dom";

export default function Out({
  mainModal,
  outModal,
  setData,
  socket,
  strikerId,
  nonStrikerId,
  team1Players,
  team2Players,
  battingTeamId,
  team1Id,
  team2Id,
  setIsWaiting,
  availableBatters,
}) {
  const [dismissalType, setDismissalType] = useState("");
  const [caughtModal, setCaughtModal] = useState(false);
  const [aModal, setAModal] = useState(true);
  const [batsmanModal, setBatsmanModal] = useState(false);
  const [runOutModal, setRunOutModal] = useState(false);
  const [newBatsmanId, setNewBatsmanId] = useState(null);
  const [fielderId, setFielderId] = useState(null);
  const [outPlayerId, setOutPlayerId] = useState(null);
  const [runs, setRuns] = useState(0);

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
  const handleSubmit = () => {
    const f = {};
    if (dismissalType == "Caught") {
      f.fielderId = fielderId;
      f.outPlayerId = strikerId;
      f.newPlayerId = newBatsmanId;
      f.dismissalType = dismissalType;
    } else if (dismissalType == "Run Out") {
      f.fielderId = fielderId;
      f.outPlayerId = outPlayerId;
      f.newPlayerId = newBatsmanId;
      f.dismissalType = dismissalType;
      f.runsOnThisBall = runs;
    } else if (dismissalType != "Mankad") {
      f.outPlayerId = strikerId;
      f.newPlayerId = newBatsmanId;
      f.dismissalType = dismissalType;
    } else {
      f.outPlayerId = nonStrikerId;
      f.newPlayerId = newBatsmanId;
      f.dismissalType = dismissalType;
    }

    if (typeof dismissalType === "string") {
      f.dismissalType = dismissalType.toLowerCase().replace(" ", "");
    }
    f.eventType = "wicket";
    f.event = runs;

    console.log(f);
    setData((prev) => {
      const updatedData = {
        ...prev,
        ...f,
      };
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
    <div className="bg-red-600 p-3 h-full mt-3 ">
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
                if (item == "Caught") {
                  setCaughtModal(true);
                  setAModal(false);
                }
                if (item == "Run Out") {
                  setRunOutModal(true);
                  setAModal(false);
                }
                if (
                  item == "Stumped" ||
                  item == "Hit Wicket" ||
                  item == "Bowled" ||
                  item == "LBW" ||
                  item == "Retired" ||
                  item == "Mankad" ||
                  item == "Over The Fence" ||
                  item == "One Hand One Bounce"
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
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-10  mb-3 absolute bottom-70 right-10"
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
            {battingTeamId == team1Id
              ? team1Players.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.name}
                  </option>
                ))
              : team2Players.map((item, index) => (
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
            <option value="">Select New Batsman</option>
            {(availableBatters?.length > 0 ? availableBatters : []).map(
              (item, index) => (
                <option key={index} value={item.id}>
                  {item.name}
                </option>
              ),
            )}
          </select>
          <br />
          <button
            onClick={() => {
              setIsWaiting?.(true);
              setCaughtModal(false);
              outModal(false);
              mainModal(true);
              handleSubmit();
            }}
            className="bg-white text-red-600 p-1 rounded-lg text-2xl h-18"
          >
            Submit
          </button>
        </div>
      )}

      {runOutModal && (
        <div className="bg-red-600 p-3 h-89.5 mt-5">
          <button
            onClick={() => {
              setRunOutModal(false);
              setAModal(true);
            }}
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-10  mb-5 absolute bottom-70 right-10"
          >
            Close
          </button>
          <input
            type="text"
            placeholder="Enter Runs"
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-12 w-full mb-1 mt-5 "
            onChange={(e) => setRuns(e.target.value)}
          />
          <br />
          <select
            name="fielder"
            id="fielder"
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-12 w-full mb-1 "
            onChange={(e) => setFielderId(e.target.value)}
          >
            <option value="">Select Fielder</option>
            {battingTeamId == team2Id
              ? team1Players.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.name}
                  </option>
                ))
              : team2Players.map((item, index) => (
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
            <option value={strikerId}>
              {battingTeamId == team1Id
                ? team1Players.find((item) => item.id == strikerId)?.name
                : team2Players.find((item) => item.id == strikerId)?.name}
            </option>
            <option value={nonStrikerId}>
              {battingTeamId == team1Id
                ? team1Players.find((item) => item.id == nonStrikerId)?.name
                : team2Players.find((item) => item.id == nonStrikerId)?.name}
            </option>
          </select>
          <br />
          <select
            name="newBatsman"
            id="newBatsman"
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-12 w-full mb-1"
            onChange={(e) => setNewBatsmanId(e.target.value)}
          >
            <option value="">Select New Batsman</option>
            {(availableBatters?.length > 0 ? availableBatters : []).map(
              (item, index) => (
                <option key={index} value={item.id}>
                  {item.name}
                </option>
              ),
            )}
          </select>
          <br />
          <button
            onClick={() => {
              setIsWaiting?.(true);
              setRunOutModal(false);
              outModal(false);
              mainModal(true);
              handleSubmit();
            }}
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-12"
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
            className="bg-white text-red-600 p-1 rounded-lg text-xl h-10  mb-5 absolute bottom-70 right-10"
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
            <option value="">Select New Batsman</option>
            {(availableBatters?.length > 0 ? availableBatters : []).map(
              (item, index) => (
                <option key={index} value={item.id}>
                  {item.name}
                </option>
              ),
            )}
          </select>
          <br />
          <button
            onClick={() => {
              setIsWaiting?.(true);
              setBatsmanModal(false);
              mainModal(true);
              outModal(false);
              handleSubmit();
            }}
            className="bg-white text-red-600 p-1 rounded-lg text-2xl h-18"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
