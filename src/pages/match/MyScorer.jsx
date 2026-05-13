import { useEffect } from "react";
import { getMatchScorer } from "../../api/matchApi";
import { useState } from "react";
import Cookies from "js-cookie";
import MatchCard from "../../components/common/MatchCard";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
export default function MyScorer() {
  const navigate = useNavigate();
  const [scorer, setScorer] = useState([]);
  useEffect(() => {
    const fetchScorer = async () => {
      const response = await getMatchScorer(
        JSON.parse(Cookies.get("account")).id,
      );
      setScorer(response.data);
    };
    fetchScorer();
  }, []);
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 mt-3 text-center text-[#E31212]">
        My Scoring Assignments
      </h1>
      {/* Back Button */}
      <button
        className="absolute top-3 left-3 bg-[#E31212] text-white p-2 rounded-full hover:bg-opacity-90 transition-colors shadow-md z-10"
        onClick={() => navigate("/home")}
      >
        <FaArrowLeft size={20} />
      </button>
      {scorer.map((scorer) => (
        <MatchCard
          key={scorer.id}
          title={scorer.tournamentName}
          team1={scorer.team1Name}
          team2={scorer.team2Name}
          extra={scorer.status}
          sportId={scorer.sportId}
        />
      ))}
    </div>
  );
}
