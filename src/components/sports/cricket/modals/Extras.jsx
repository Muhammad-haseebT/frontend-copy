import { useState } from "react";

export default function Extras({
  mainModal,
  extraType,
  setData,
  setExtraModal,
  socket,
  setIsWaiting,
  strikerId,
  nonStrikerId,
  team1Players,
  team2Players,
  battingTeamId,
  team1Id,
  team2Id,
  availableBatters,
  isDoubleWicket,
  setOutModal,
}) {
  const [customRuns, setCustomRuns] = useState(0);

  const list = [
    { name: extraType, value: 1 },
    { name: extraType, value: 2 },
    { name: extraType, value: 3 },
    { name: extraType, value: 4 },
    { name: extraType, value: 5 },
    { name: extraType, value: 6 },
    { name: extraType, value: 7 },
  ];
  const sendData = (value, type) => {
    setData((prev) => {
      const data = {
        ...prev,
        event: value,
        eventType: type,
      };
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      } else {
        console.warn("Socket not ready, data not sent");
      }
      return data;
    });
  };

  return (
    <div className="bg-red-600 p-3 h-fit rounded-lg mt-3">
      <div className="flex justify-between mb-2">
        <button
          className="bg-white text-red-600 px-3 py-1 rounded font-semibold"
          onClick={() => {
            setExtraModal(false);
            mainModal(true);
          }}
        >
          Close
        </button>
      </div>

      {extraType === "noball" && (
        <div className="flex items-center justify-between text-white mb-3 p-2 bg-red-700 rounded-lg">
          <label className="text-xl font-semibold">Runs Scored off No Ball:</label>
          <input
            type="number"
            min="0"
            value={customRuns}
            onChange={(e) => setCustomRuns(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-24 text-red-600 text-center rounded p-1 text-xl font-bold"
          />
        </div>
      )}

      {extraType == "noball" || extraType == "wide" ? (
        <div className="grid grid-cols-3 gap-2">
          {list.map((item, index) => {
            const isNoBall = extraType === "noball";
            const valToSend = isNoBall ? customRuns : item.value - 1;
            return (
              <button
                key={index}
                className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20 font-medium"
                onClick={() => {
                  setIsWaiting?.(true);
                  sendData(valToSend, extraType);
                  setExtraModal(false);
                  mainModal(true);
                }}
              >
                {item.value - 1 == 0 ? "" : item.value - 1}{" "}
                {item.name == "wide" ? "WD" : "NB"}
              </button>
            );
          })}
          {extraType === "noball" && (
            <button
              className="bg-black text-white p-1 rounded-lg text-2xl h-20 font-bold hover:bg-gray-800 transition-colors"
              onClick={() => {
                setData((prev) => ({
                  ...prev,
                  event: String(customRuns),
                  eventType: "noball_runout",
                }));
                setExtraModal(false);
                setOutModal(true);
              }}
            >
              NB+RO
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {list.map((item, index) => (
            <button
              key={index}
              className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20 font-medium"
              onClick={() => {
                setIsWaiting?.(true);
                sendData(item.value, extraType);
                setExtraModal(false);
                mainModal(true);
              }}
            >
              {item.value} {item.name == "bye" ? "B" : "LB"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
