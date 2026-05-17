import { useState, useEffect } from "react";
import { Users, ArrowLeftRight } from "lucide-react";
import { getPlayers } from "../../api/playerApi";
import { getPlayerStatsByIdAndSport } from "../../api/statsApi";

const SPORTS = [
  { key: "cricket", label: "Cricket", emoji: "🏏" },
  { key: "futsal", label: "Futsal", emoji: "⚽" },
  { key: "volleyball", label: "Volleyball", emoji: "🏐" },
  { key: "badminton", label: "Badminton", emoji: "🏸" },
  { key: "table tennis", label: "Table Tennis", emoji: "🏓" },
  { key: "ludo", label: "Ludo", emoji: "🎲" },
  { key: "chess", label: "Chess", emoji: "♟️" },
];

const SPORT_STATS = {
  cricket: [
    { key: "matchesPlayed", label: "Matches" },
    { key: "runsScored", label: "Runs" },
    { key: "average", label: "Batting Average", decimal: 2 },
    { key: "strikeRate", label: "Strike Rate", decimal: 2 },
    { key: "highestScore", label: "Highest Score" },
    { key: "hundreds", label: "100s" },
    { key: "fifties", label: "50s" },
    { key: "fours", label: "Fours (4s)" },
    { key: "sixes", label: "Sixes (6s)" },
    { key: "wicketsTaken", label: "Wickets" },
    { key: "economy", label: "Economy", decimal: 2, lowerIsBetter: true },
    { key: "bowlingAverage", label: "Bowling Average", decimal: 2, lowerIsBetter: true },
    { key: "bestBowling", label: "Best Bowling", isString: true },
    { key: "catches", label: "Catches" },
  ],
  futsal: [
    { key: "matchesPlayed", label: "Matches" },
    { key: "goals", label: "Goals" },
    { key: "assists", label: "Assists" },
    { key: "futsalFouls", label: "Fouls", lowerIsBetter: true },
    { key: "yellowCards", label: "Yellow Cards", lowerIsBetter: true },
    { key: "redCards", label: "Red Cards", lowerIsBetter: true },
  ],
  volleyball: [
    { key: "matchesPlayed", label: "Matches" },
    { key: "goals", label: "Points" },
    { key: "assists", label: "Aces" },
    { key: "futsalFouls", label: "Blocks" },
    { key: "yellowCards", label: "Attack Errors", lowerIsBetter: true },
    { key: "redCards", label: "Service Errors", lowerIsBetter: true },
  ],
  badminton: [
    { key: "matchesPlayed", label: "Matches" },
    { key: "goals", label: "Points" },
    { key: "assists", label: "Smashes" },
    { key: "futsalFouls", label: "Faults", lowerIsBetter: true },
  ],
  "table tennis": [
    { key: "matchesPlayed", label: "Matches" },
    { key: "goals", label: "Points" },
    { key: "assists", label: "Games Won" },
    { key: "futsalFouls", label: "Errors", lowerIsBetter: true },
  ],
  ludo: [
    { key: "matchesPlayed", label: "Matches" },
    { key: "goals", label: "Games Won" },
  ],
  chess: [
    { key: "matchesPlayed", label: "Matches" },
    { key: "goals", label: "Wins" },
  ],
};

const PlayerCard = ({ player, side }) => {
  if (!player) return null;
  const name = player.name || player.account?.name || "Unknown Player";
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();
  const photoUrl = player.profilePhotoUrl;

  return (
    <div className={`flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 w-full ${side === 'left' ? 'border-l-4 border-l-red-500' : 'border-r-4 border-r-blue-500'}`}>
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 mb-3 relative">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-gray-400">{initials}</span>
        )}
        {player.jerseyNumber && (
          <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-white">
            #{player.jerseyNumber}
          </div>
        )}
      </div>
      <h3 className="font-bold text-gray-800 text-center line-clamp-1">{name}</h3>
      <p className="text-xs text-gray-400">@{player.id}</p>
    </div>
  );
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-4 border-b border-gray-50"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
    <td className="px-4 py-4 border-b border-gray-50"><div className="h-4 bg-gray-50 rounded w-16 mx-auto"></div></td>
    <td className="px-4 py-4 border-b border-gray-50 border-l border-gray-50"><div className="h-4 bg-gray-50 rounded w-16 mx-auto"></div></td>
  </tr>
);

export default function PlayerComparisonPage() {
  const [players, setPlayers] = useState([]);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [activeSport, setActiveSport] = useState("cricket");
  const [stats1, setStats1] = useState(null);
  const [stats2, setStats2] = useState(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPlayers()
      .then((res) => setPlayers(res.data))
      .catch((err) => console.error("Error fetching players:", err));
  }, []);

  // Auto-fetch player 1 stats when player1Id or sport changes
  useEffect(() => {
    if (!player1Id) { setStats1(null); return; }
    let cancelled = false;
    const fetchStats = async () => {
      setLoading1(true);
      setStats1(null);
      try {
        const res = await getPlayerStatsByIdAndSport(player1Id, activeSport);
        if (!cancelled) setStats1(res);
      } catch (err) {
        if (!cancelled) console.error("P1 stats error:", err);
      } finally {
        if (!cancelled) setLoading1(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, [player1Id, activeSport]);

  // Auto-fetch player 2 stats when player2Id or sport changes
  useEffect(() => {
    if (!player2Id) { setStats2(null); return; }
    let cancelled = false;
    const fetchStats = async () => {
      setLoading2(true);
      setStats2(null);
      try {
        const res = await getPlayerStatsByIdAndSport(player2Id, activeSport);
        if (!cancelled) setStats2(res);
      } catch (err) {
        if (!cancelled) console.error("P2 stats error:", err);
      } finally {
        if (!cancelled) setLoading2(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, [player2Id, activeSport]);

  const loading = loading1 || loading2;

  const p1 = players.find((p) => String(p.id) === String(player1Id));
  const p2 = players.find((p) => String(p.id) === String(player2Id));

  const formatValue = (val, config) => {
    if (val === undefined || val === null) return "—";
    if (config.isString) return val || "—";
    if (config.decimal !== undefined && typeof val === "number") return val.toFixed(config.decimal);
    return val;
  };

  const getCellColor = (val1, val2, config) => {
    if (config.isString) return "";
    const v1 = Number(val1) || 0;
    const v2 = Number(val2) || 0;
    
    if (v1 === 0 && v2 === 0) return "";
    if (v1 === v2) return "bg-gray-50";

    const v1Better = config.lowerIsBetter ? v1 < v2 : v1 > v2;
    
    return v1Better ? "bg-green-50 text-green-700 font-bold" : "bg-red-50 text-red-600";
  };

  const statConfig = SPORT_STATS[activeSport] || SPORT_STATS["cricket"];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3 tracking-tight">
          <div className="bg-red-100 p-2 rounded-lg"><ArrowLeftRight className="text-red-600" /></div>
          Player Comparison
        </h1>
      </div>

      {/* Sport Selector Pills */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {SPORTS.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setActiveSport(key)}
              className={`px-5 py-2.5 rounded-full font-bold transition-all whitespace-nowrap border-2 flex items-center gap-2 flex-shrink-0 text-sm ${
                activeSport === key
                  ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-200 -translate-y-0.5"
                  : "bg-white text-gray-600 border-gray-100 hover:border-red-200 hover:bg-red-50"
              }`}
            >
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Player Selectors & Comparison Header */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
        <div className="md:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Player 1</label>
             <input
               type="text"
               placeholder="Filter Player 1..."
               value={search1}
               onChange={(e) => setSearch1(e.target.value)}
               className="w-full mb-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
             />
             <select
               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none appearance-none font-medium cursor-pointer"
               value={player1Id}
               onChange={(e) => setPlayer1Id(e.target.value)}
             >
               <option value="">Select Player</option>
               {players
                 .filter((p) => String(p.id) !== String(player2Id) && (p.name || p.account?.name || "").toLowerCase().includes(search1.toLowerCase()))
                 .map((p) => (
                 <option key={p.id} value={p.id}>{p.name || p.account?.name}</option>
               ))}
             </select>
          </div>
          <PlayerCard player={p1} side="left" />
        </div>

        <div className="md:col-span-1 flex justify-center">
          <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center text-gray-400 font-bold border-2 border-white shadow-sm">VS</div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Player 2</label>
             <input
               type="text"
               placeholder="Filter Player 2..."
               value={search2}
               onChange={(e) => setSearch2(e.target.value)}
               className="w-full mb-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
             />
             <select
               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none appearance-none font-medium cursor-pointer"
               value={player2Id}
               onChange={(e) => setPlayer2Id(e.target.value)}
             >
               <option value="">Select Player</option>
               {players
                 .filter((p) => String(p.id) !== String(player1Id) && (p.name || p.account?.name || "").toLowerCase().includes(search2.toLowerCase()))
                 .map((p) => (
                 <option key={p.id} value={p.id}>{p.name || p.account?.name}</option>
               ))}
             </select>
          </div>
          <PlayerCard player={p2} side="right" />
        </div>
      </div>

      {!player1Id || !player2Id ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm mt-10">
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
             <Users className="w-12 h-12 text-gray-200" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Two Players</h2>
          <p className="text-gray-500 max-w-sm mx-auto">Choose two athletes and a sport to compare their career performance side-by-side.</p>
          <div className="mt-8 flex justify-center gap-4">
            <div className="h-2 w-2 rounded-full bg-red-200"></div>
            <div className="h-2 w-2 rounded-full bg-red-400"></div>
            <div className="h-2 w-2 rounded-full bg-red-200"></div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mt-8">
           <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold flex items-center gap-2 uppercase tracking-widest text-sm">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                Statistical Comparison
              </h2>
              <span className="text-gray-400 text-xs font-bold uppercase">{activeSport}</span>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full border-collapse">
               <thead>
                 <tr className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-tighter border-b border-gray-100">
                   <th className="px-6 py-3 text-left w-[40%]">Statistic</th>
                   <th className="px-6 py-3 text-center w-[30%] border-l border-gray-100">{p1?.name?.split(" ")[0] || "Player 1"}</th>
                   <th className="px-6 py-3 text-center w-[30%] border-l border-gray-100">{p2?.name?.split(" ")[0] || "Player 2"}</th>
                 </tr>
               </thead>
               <tbody>
                 {statConfig.map((config) => {
                   const val1 = stats1?.[config.key];
                   const val2 = stats2?.[config.key];

                   const SkeletonCell = () => (
                     <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                   );

                   return (
                     <tr key={config.key} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                       <td className="px-6 py-4 font-bold text-gray-600 text-sm">{config.label}</td>
                       <td className={`px-6 py-4 text-center text-sm border-l border-gray-50 transition-colors ${!loading1 && !loading2 ? getCellColor(val1, val2, config) : ''}`}>
                         {loading1 ? <SkeletonCell /> : formatValue(val1, config)}
                       </td>
                       <td className={`px-6 py-4 text-center text-sm border-l border-gray-50 transition-colors ${!loading1 && !loading2 ? getCellColor(val2, val1, config) : ''}`}>
                         {loading2 ? <SkeletonCell /> : formatValue(val2, config)}
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>

           {!loading && !stats1 && !stats2 && (
              <div className="p-10 text-center text-gray-400 text-sm italic">
                No statistical data recorded for this sport.
              </div>
           )}
        </div>
      )}
    </div>
  );
}
