export default function Extras({
  mainModal,
  extraType,
  setData,
  setExtraModal,
  socket,
  setIsWaiting,
}) {
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
    <div className="bg-red-600 p-3 h-74.5 mt-3">
      <div className="flex justify-between">
        <button
          onClick={() => {
            setExtraModal(false);
            mainModal(true);
          }}
        >
          Close
        </button>
      </div>

      {extraType == "noball" || extraType == "wide" ? (
        <div className="grid grid-cols-3 gap-2">
          {list.map((item, index) => (
            <button
              key={index}
              className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20"
              onClick={() => {
                setIsWaiting?.(true);
                sendData(item.value - 1, extraType);
                setExtraModal(false);
                mainModal(true);
              }}
            >
              {item.value - 1 == 0 ? "" : item.value - 1}{" "}
              {item.name == "wide" ? "WD" : "NB"}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {list.map((item, index) => (
            <button
              key={index}
              className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20"
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
