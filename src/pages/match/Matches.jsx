import { useState, useEffect } from "react";
import {
  getMatches,
  getMatchBySportAndStatus,
  getMatchByStatus,
} from "../../api/matchApi";
import SportFilter from "../../components/common/SportFilter";
import StatusFilter from "../../components/common/StatusFilter";
import MatchCard from "../../components/common/MatchCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";

export default function Matches() {
  const navigate = useNavigate();
  const [allMatches, setAllMatches] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedSport, setSelectedSport] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc");

  // 1. Initial fetch on mount (reload)
  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const response = await getMatches();
        setAllMatches(response.data);
        setMatches(response.data);
      } catch (err) {
        console.error("Fetch error:", err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []); // Run only once when component mounts (reload)

  const SPORT_MAP = {
    Cricket: 1,
    Futsal: 2,
    VolleyBall: 3,
    "Table Tennis": 4,
    Badminton: 5,
    "Tug Of War": 6,
    Ludo: 7,
    Chess: 8,
  };

  // 2. Local filtering when filters or data change
  useEffect(() => {
    if (allMatches.length > 0) {
      let filtered = [...allMatches];

      if (selectedSport !== "All") {
        const targetSportId = SPORT_MAP[selectedSport];
        filtered = filtered.filter((m) => m.sportId === targetSportId);
      }

      if (selectedStatus !== "All") {
        filtered = filtered.filter(
          (m) => m.status?.toUpperCase() === selectedStatus.toUpperCase(),
        );
      }
      setMatches(filtered);
    }
  }, [selectedSport, selectedStatus, allMatches]);

  const handleClick = (
    matchId,
    status,
    team1Id,
    team2Id,
    decision,
    tossWinnerId,
    team1Name,
    team2Name,
    sportId,
    inningsId,
    venue,
    match,
  ) => {
    if (status?.toUpperCase() === "LIVE" && decision == "BAT") {
      let name = "";
      if (tossWinnerId == team1Id) name = team1Name;
      else name = team2Name;

      navigate(`/match`, {
        state: {
          matchId: matchId,
          status: status,
          team1Id: team1Id,
          team2Id: team2Id,
          battingTeamId: tossWinnerId,
          team1Name: team1Name,
          team2Name: team2Name,
          battingTeamName: name,
          sportId: sportId,
          inningsId: inningsId,
          venue: venue,
          match: match,
        },
      });
    } else if (status?.toUpperCase() === "LIVE" && decision == "BOWL") {
      if (tossWinnerId == team1Id) {
        navigate(`/match`, {
          state: {
            matchId: matchId,
            status: status,
            team1Id: team1Id,
            team2Id: team2Id,
            battingTeamId: team2Id,
            team1Name: team1Name,
            team2Name: team2Name,
            battingTeamName: team2Name,
            sportId: sportId,
            inningsId: inningsId,
            venue: venue,
            match: match,
          },
        });
      } else {
        navigate(`/match`, {
          state: {
            matchId: matchId,
            status: status,
            team1Id: team1Id,
            team2Id: team2Id,
            battingTeamId: team1Id,
            team1Name: team1Name,
            team2Name: team2Name,
            battingTeamName: team1Name,
            sportId: sportId,
            inningsId: inningsId,
            venue: venue,
            match: match,
          },
        });
      }
    } else {
      navigate(`/match`, {
        state: {
          matchId: matchId,
          status: status,
          team1Id: team1Id,
          team2Id: team2Id,
          battingTeamId: 0,
          team1Name: team1Name,
          team2Name: team2Name,
          battingTeamName: "",
          sportId: sportId,
          inningsId: 0,
          venue: venue,
          match: match,
        },
      });
    }
  };

  // Sort matches by date+time
  const sortedMatches = [...matches].sort((a, b) => {
    const aDate = new Date(`${a.date?.split("T")[0]}T${a.time || "00:00"}`);
    const bDate = new Date(`${b.date?.split("T")[0]}T${b.time || "00:00"}`);
    return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
  });

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            className="bg-[#E31212] text-white p-2 rounded-full hover:bg-opacity-90 transition-colors shadow-md disabled:opacity-50"
            onClick={() => navigate("/home")}
            disabled={loading}
          >
            <FaArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold">Matches</h1>
        </div>
        <button
          id="sort-toggle"
          onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          disabled={loading}
          title={
            sortOrder === "asc"
              ? "Sorted: Oldest first"
              : "Sorted: Newest first"
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            loading
              ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400 bg-white"
              : "border-red-200 text-red-600 bg-white hover:bg-red-50 shadow-sm"
          }`}
        >
          {sortOrder === "asc" ? (
            <FaSortAmountDown size={12} />
          ) : (
            <FaSortAmountUp size={12} />
          )}
          {sortOrder === "asc" ? "Oldest First" : "Newest First"}
        </button>
      </div>

      <div className={loading ? "pointer-events-none opacity-60" : ""}>
        <SportFilter
          onFilter={setSelectedSport}
          selectedSport={selectedSport}
        />
        <StatusFilter
          onFilter={setSelectedStatus}
          selectedStatus={selectedStatus}
        />
      </div>
      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <div className="flex flex-col gap-4">
          {sortedMatches.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              No matches found
            </p>
          ) : (
            sortedMatches.map((match) => (
              <MatchCard
                key={match.id}
                title={match.tournamentName}
                team1={match.team1Name}
                team2={match.team2Name}
                team1Id={match.team1Id}
                team2Id={match.team2Id}
                extra={match.date?.split("T")[0] + " " + (match.time || "")}
                live={match.status?.toUpperCase() === "LIVE"}
                sportId={match.sportId}
                onClick={() =>
                  handleClick(
                    match.id,
                    match.status,
                    match.team1Id,
                    match.team2Id,
                    match.decision,
                    match.tossWinnerId,
                    match.team1Name,
                    match.team2Name,
                    match.sportId,
                    match.inningsId,
                    match.venue,
                    match,
                  )
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
