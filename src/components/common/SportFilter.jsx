export default function SportFilter({ onFilter, selectedSport }) {
  const sports = [
    { name: "All", value: "All" },
    { name: "Cricket", value: "Cricket" },
    { name: "Futsal", value: "Futsal" },
    { name: "VolleyBall", value: "VolleyBall" },
    { name: "Table Tennis", value: "Table Tennis" },
    { name: "Badminton", value: "Badminton" },
    { name: "Tug Of War", value: "Tug Of War" },
    { name: "Ludo", value: "Ludo" },
    { name: "Chess", value: "Chess" },
  ];

  return (
    <div className="overflow-x-auto py-2 mb-6 no-scrollbar">
      <div className="flex space-x-3 min-w-max px-2">
        {sports.map((sport) => (
          <button
            type="button"
            onClick={() => onFilter(sport.value)}
            key={sport.value}
            className={`shrink-0 min-w-[5rem] px-4 py-2 rounded-full transition whitespace-nowrap flex justify-center items-center text-sm font-medium ${
              selectedSport === sport.value
                ? "bg-red-800 text-white ring-2 ring-red-300"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            aria-pressed={selectedSport === sport.value}
          >
            {sport.name}
          </button>
        ))}
      </div>
    </div>
  );
}
