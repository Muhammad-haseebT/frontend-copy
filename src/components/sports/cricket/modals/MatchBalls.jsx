import React, { useState, useEffect } from "react";
import { getMatchBalls } from "../../../../api/matchApi";
import { Search, X, Filter } from "lucide-react";

// Extra types ka label aur color mapping
const EXTRA_CONFIG = {
  legbye: {
    label: "Leg Bye",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  bye: {
    label: "Bye",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  wide: { label: "Wide", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  noball: {
    label: "No Ball",
    color: "bg-pink-50 text-pink-700 border-pink-200",
  },
};

const EVENT_FILTERS = [
  { key: "boundary", label: "Boundaries", activeClass: "bg-blue-600 text-white border-blue-600", idleClass: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100" },
  { key: "wicket", label: "Wickets", activeClass: "bg-red-600 text-white border-red-600", idleClass: "text-red-700 bg-red-50 border-red-200 hover:bg-red-100" },
  { key: "extra", label: "Extras", activeClass: "bg-orange-500 text-white border-orange-500", idleClass: "text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100" },
  { key: "dot", label: "Dot Balls", activeClass: "bg-gray-600 text-white border-gray-600", idleClass: "text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200" }
];

const BallByBallTab = ({ matchId, team1Name, team2Name, team1Id, team2Id }) => {
  const [activeTeam, setActiveTeam] = useState(team1Id);
  const [balls, setBalls] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [eventFilters, setEventFilters] = useState([]);
  const [selectedBatsman, setSelectedBatsman] = useState("all");
  const [selectedBowler, setSelectedBowler] = useState("all");

  useEffect(() => {
    if (matchId && activeTeam) fetchBalls();
  }, [activeTeam, matchId]);

  // Reset filters when team changes
  useEffect(() => {
    clearFilters();
  }, [activeTeam]);

  const fetchBalls = async () => {
    setLoading(true);
    try {
      const res = await getMatchBalls(matchId, activeTeam);
      setBalls(res);
    } catch (error) {
      console.error("Error fetching balls:", error);
      setBalls([]);
    } finally {
      setLoading(false);
    }
  };

  const getBallBgColor = (ball) => {
    if (ball.isWicket) return "bg-red-600 text-white";
    if (ball.event === "6") return "bg-purple-700 text-white";
    if (ball.event === "4") return "bg-blue-600 text-white";
    if (ball.eventType === "wide") return "bg-cyan-500 text-white";
    if (ball.eventType === "noball") return "bg-pink-500 text-white";
    if (ball.eventType === "legbye") return "bg-orange-400 text-white";
    if (ball.eventType === "bye") return "bg-yellow-400 text-gray-900";
    return "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const getBallDisplay = (ball) => {
    const runs = ball.runs > 0 ? `+${ball.runs}` : "";

    if (ball.eventType === "wide")
      return (
        <>
          <span className="text-[9px] font-bold leading-none">WD</span>
          {runs && <span className="text-[10px] leading-none">{runs}</span>}
        </>
      );
    if (ball.eventType === "noball")
      return (
        <>
          <span className="text-[9px] font-bold leading-none">NB</span>
          {runs && <span className="text-[10px] leading-none">{runs}</span>}
        </>
      );
    if (ball.eventType === "legbye")
      return (
        <>
          <span className="text-[9px] font-bold leading-none">LB</span>
          {runs && <span className="text-[10px] leading-none">{runs}</span>}
        </>
      );
    if (ball.eventType === "bye")
      return (
        <>
          <span className="text-[9px] font-bold leading-none">B</span>
          {runs && <span className="text-[10px] leading-none">{runs}</span>}
        </>
      );
    return ball.event;
  };

  // Unique players for dropdowns
  const batsmen = Array.from(new Set(balls.map(b => b.batsmanName).filter(Boolean)));
  const bowlers = Array.from(new Set(balls.map(b => b.bowlerName).filter(Boolean)));

  const toggleEventFilter = (key) => {
    setEventFilters(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    setEventFilters([]);
    setSelectedBatsman("all");
    setSelectedBowler("all");
  };

  const hasActiveFilters = eventFilters.length > 0 || selectedBatsman !== "all" || selectedBowler !== "all";

  // Apply filters
  const filteredBalls = balls.filter(ball => {
    if (selectedBatsman !== "all" && ball.batsmanName !== selectedBatsman) return false;
    if (selectedBowler !== "all" && ball.bowlerName !== selectedBowler) return false;

    if (eventFilters.length === 0) return true;

    const isBoundary = ball.event === "4" || ball.event === "6" || ball.isBoundary === true;
    const isWicket = ball.isWicket === true;
    const isExtra = ball.eventType === "wide" || ball.eventType === "noball" || ball.eventType === "legbye" || ball.eventType === "bye";
    const isDot = ball.event === "0" && !ball.isWicket && ball.eventType === "run";

    return (
      (eventFilters.includes("boundary") && isBoundary) ||
      (eventFilters.includes("wicket") && isWicket) ||
      (eventFilters.includes("extra") && isExtra) ||
      (eventFilters.includes("dot") && isDot)
    );
  });

  return (
    <div className="max-w-md mx-auto bg-white min-h-[500px] pb-10 shadow-sm rounded-lg overflow-hidden">
      {/* Team Tabs */}
      <div className="flex border-b sticky top-0 bg-white z-10 shadow-sm">
        {[
          { id: team1Id, name: team1Name },
          { id: team2Id, name: team2Name },
        ].map((team) => (
          <button
            key={team.id}
            onClick={() => setActiveTeam(team.id)}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTeam === team.id
                ? "border-b-4 border-blue-600 text-blue-600 bg-blue-50/30"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {team.name}
          </button>
        ))}
      </div>

      {/* Filter Header */}
      {balls.length > 0 && !loading && (
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
          >
            <Filter size={16} /> {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500">
              Showing {filteredBalls.length} of {balls.length} balls
            </span>
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Filter Panel */}
      {showFilters && balls.length > 0 && !loading && (
        <div className="p-4 bg-white border-b shadow-inner space-y-4">
          {/* Event Pills */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Event Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEventFilters([])}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  eventFilters.length === 0 
                    ? "bg-gray-800 text-white border-gray-800" 
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
              >
                All
              </button>
              {EVENT_FILTERS.map(filter => {
                const isActive = eventFilters.includes(filter.key);
                return (
                  <button
                    key={filter.key}
                    onClick={() => toggleEventFilter(filter.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      isActive ? filter.activeClass : filter.idleClass
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Player Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Batsman</label>
              <select 
                value={selectedBatsman}
                onChange={(e) => setSelectedBatsman(e.target.value)}
                className="w-full text-xs p-2 rounded border border-gray-300 focus:border-blue-500 outline-none"
              >
                <option value="all">All Players</option>
                {batsmen.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Bowler</label>
              <select 
                value={selectedBowler}
                onChange={(e) => setSelectedBowler(e.target.value)}
                className="w-full text-xs p-2 rounded border border-gray-300 focus:border-blue-500 outline-none"
              >
                <option value="all">All Players</option>
                {bowlers.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Ball List */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-500">Fetching Timeline...</p>
          </div>
        ) : balls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-3">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm font-medium">
              Innings history will appear here once the match starts.
            </p>
          </div>
        ) : filteredBalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-10 text-center bg-gray-50/50">
            <p className="text-gray-500 font-medium">No balls match this filter.</p>
            <button 
              onClick={clearFilters}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredBalls.map((ball) => {
            const extraConfig = EXTRA_CONFIG[ball.eventType];

            return (
              <div
                key={ball.id}
                className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Left: Over + Ball Circle */}
                <div className="flex flex-col items-center min-w-[52px]">
                  <span className="text-[11px] font-mono font-bold text-gray-400 mb-1.5">
                    {ball.overBall}
                  </span>
                  <div
                    className={`w-11 h-11 rounded-full flex flex-col items-center justify-center font-black shadow-sm ${getBallBgColor(ball)}`}
                  >
                    {getBallDisplay(ball)}
                  </div>
                </div>

                {/* Right: Details */}
                <div className="flex-1 pt-1">
                  {/* Bowler → Batsman */}
                  <div className="text-[14px] leading-tight">
                    <span className="font-bold text-gray-900">
                      {ball.bowlerName}
                    </span>
                    <span className="text-gray-400 mx-1.5 text-xs italic">
                      to
                    </span>
                    <span className="font-semibold text-gray-800">
                      {ball.batsmanName}
                    </span>
                  </div>

                  {/* Non-striker */}
                  {ball.nonStrikerName && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Non-striker: {ball.nonStrikerName}
                    </p>
                  )}

                  {/* Wicket */}
                  {ball.isWicket && (
                    <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-100">
                      <span className="text-[11px] font-black text-red-600 uppercase tracking-tighter block">
                        OUT! {ball.dismissalType}
                      </span>
                      <p className="text-[13px] text-red-800 font-medium">
                        {ball.outPlayerName}
                        {ball.fielderName ? ` c ${ball.fielderName}` : ""}
                      </p>
                    </div>
                  )}

                  {/* Boundary Badge */}
                  {ball.isBoundary && !ball.isWicket && (
                    <div className="mt-1.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          ball.event === "6"
                            ? "bg-purple-50 text-purple-700 border-purple-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}
                      >
                        {ball.event === "6" ? "MAXIMUM" : "FOUR"}
                      </span>
                    </div>
                  )}

                  {/* Extra Badge — legbye, bye, wide, noball */}
                  {extraConfig && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${extraConfig.color}`}
                      >
                        {extraConfig.label}
                      </span>
                      {/* Extra runs agar 0 se zyada ho */}
                      {ball.extra > 0 && (
                        <span className="text-[11px] text-gray-500">
                          +{ball.extra} extra
                        </span>
                      )}
                    </div>
                  )}

                  {/* Commentary */}
                  {ball.comment && (
                    <p className="text-[12px] text-gray-500 mt-2 leading-relaxed border-l-2 border-gray-100 pl-2">
                      {ball.comment}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BallByBallTab;
