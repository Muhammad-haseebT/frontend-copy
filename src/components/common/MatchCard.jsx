function MatchCard({
  title,
  team1,
  team2,
  extra,
  team1Id,
  team2Id,
  sportId,
  onClick,
}) {
  const sports = [
    "Cricket",
    "Futsal",
    "Volleyball",
    "Table Tennis",
    "Badminton",
    "Ludo",
    "Tug Of War",
    "Chess",
  ];

  return (
    <div
      className="relative border-2 border-red-400 rounded-lg p-4 pt-7 m-4 mt-6 shadow-sm bg-white active:scale-95 transition-transform"
      onClick={onClick}
    >
      {/* Sport Name - Top Left */}
      <div className="absolute top-0 left-0 bg-red-400 text-white text-[10px] font-bold px-2 py-1 rounded-br-md uppercase">
        {sports[sportId - 1]}
      </div>

      {/* Main Content */}
      <h3 className="text-lg font-semibold text-red-600 leading-tight">
        {title}
      </h3>

      <p className="text-gray-700 mt-2 text-base">
        {team1} <span className="font-bold text-red-400 mx-1">vs</span> {team2}
      </p>

      <div className="mt-2">
        <small className="text-gray-500 font-medium">{extra}</small>
      </div>
    </div>
  );
}

export default MatchCard;
