import { useEffect, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar";
import SportFilter from "../components/common/SportFilter";
import MatchCard from "../components/common/MatchCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getMatchByStatus, getMatchBySportAndStatus } from "../api/matchApi";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [live, setLive] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [username, setUsername] = useState("");
  const [searchLive, setSearchLive] = useState([]);
  const [searchUpcoming, setSearchUpcoming] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        let response = await getMatchBySportAndStatus("All", "LIVE");
        setLive(response.data);
        setSearchLive(response.data);

        response = await getMatchBySportAndStatus("All", "UPCOMING");
        setUpcoming(response.data);
        setUsername(JSON.parse(Cookies.get("account")).name);
        setSearchUpcoming(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleSportFilter = async (sport) => {
    setLoading(true);
    try {
      let live, upcomming;
      live = await getMatchBySportAndStatus(sport, "LIVE");
      upcomming = await getMatchBySportAndStatus(sport, "UPCOMING");
      console.log(live.data);
      console.log(upcomming.data);
      setLive(live.data);
      setUpcoming(upcomming.data);
      setSearchLive(live.data);
      setSearchUpcoming(upcomming.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const onSearch = (search) => {
    try {
      if (!search || search.trim() === "") {
        setSearchLive(live);
        setSearchUpcoming(upcoming);
        return;
      }

      const searchLower = search.toLowerCase();

      setSearchLive(
        live.filter(
          (match) =>
            match.team1Name?.toLowerCase().includes(searchLower) ||
            match.team2Name?.toLowerCase().includes(searchLower),
        ),
      );

      setSearchUpcoming(
        upcoming.filter(
          (match) =>
            match.team1Name?.toLowerCase().includes(searchLower) ||
            match.team2Name?.toLowerCase().includes(searchLower),
        ),
      );
    } catch (err) {
      console.error("Search error:", err);
    }
  };
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
    if (status === "LIVE" && decision == "BAT") {
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
    } else if (status === "LIVE" && decision == "BOWL") {
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

  const liveSlides = searchLive.slice(0, 3);

  const goCarousel = (dir) => {
    const next = (carouselIndex + dir + liveSlides.length) % liveSlides.length;
    setCarouselIndex(next);
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: next * cardWidth,
        behavior: "smooth",
      });
    }
  };

  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const idx = Math.round(
        carouselRef.current.scrollLeft / carouselRef.current.offsetWidth,
      );
      setCarouselIndex(idx);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar username={username} onSearch={onSearch} />
      <div className="p-4 md:p-6">
        <SportFilter onFilter={handleSportFilter} />

        {loading ? (
          <LoadingSpinner size="large" />
        ) : (
          <>
            {/* ── Live Matches Carousel ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  Live Matches
                </h3>
                {liveSlides.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      id="carousel-prev"
                      onClick={() => goCarousel(-1)}
                      className="p-1.5 rounded-full bg-white shadow hover:bg-red-50 text-red-500 transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      id="carousel-next"
                      onClick={() => goCarousel(1)}
                      className="p-1.5 rounded-full bg-white shadow hover:bg-red-50 text-red-500 transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              {liveSlides.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
                  <p className="text-sm font-medium">
                    No live matches right now
                  </p>
                </div>
              ) : (
                <>
                  <div
                    ref={carouselRef}
                    onScroll={handleCarouselScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar gap-0"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {liveSlides.map((match) => (
                      <div
                        key={match.id}
                        className="flex-shrink-0 w-full snap-start"
                      >
                        <MatchCard
                          title={match.tournamentName}
                          team1={match.team1Name}
                          team2={match.team2Name}
                          extra={match.status}
                          sportId={match.sportId}
                          live={true}
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
                      </div>
                    ))}
                  </div>
                  {/* Dot indicators */}
                  {liveSlides.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-2">
                      {liveSlides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => goCarousel(i - carouselIndex)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === carouselIndex
                              ? "w-5 bg-red-500"
                              : "w-1.5 bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <h3 className="text-xl font-bold mb-4">Upcoming Matches</h3>
            <div>
              {searchUpcoming.map((match) => (
                <MatchCard
                  key={match.id}
                  title={match.tournamentName}
                  team1={match.team1Name}
                  team2={match.team2Name}
                  team1Id={match.team1Id}
                  sportId={match.sportId}
                  team2Id={match.team2Id}
                  extra={match.date + " " + match.time}
                  live={false}
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
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
