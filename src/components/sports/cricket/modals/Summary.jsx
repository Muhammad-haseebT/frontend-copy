import React, { useEffect, useState } from "react";
import { Trophy, User, Target, CircleDot } from "lucide-react";
import { getMatchSummary } from "../../../../api/matchApi";

const MatchSummary = ({ matchId }) => {
  // matchId props se ani chahiye ya params se
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await getMatchSummary(matchId); // Wait for API
        setData(result);
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      loadData();
    }
  }, [matchId]);

  // 1. Loading State (Taake crash na ho)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        <p className="mt-4 text-gray-500">Fetching Match Summary...</p>
      </div>
    );
  }

  // 2. Data Not Found State
  if (!data) {
    return (
      <div className="text-center p-10 text-gray-500">
        No summary data available.
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen pb-10 font-sans">
      {/* Result Header */}
      <div className="bg-white p-4 shadow-sm border-b-2 border-red-600 mb-4 text-center">
        <p className="text-red-600 font-bold text-lg uppercase tracking-wider">
          {data.result}
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Scorecards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team 1 Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-red-600">
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="text-gray-500 text-sm font-bold uppercase">
                  {data.team1Name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-800">
                    {data.team1Runs}-{data.team1Wickets}
                  </span>
                  <span className="text-gray-500 font-medium">
                    ({data.team1Overs})
                  </span>
                </div>
              </div>
              <div className="bg-red-50 p-2 rounded-full">
                <Target className="text-red-600 w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Team 2 Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-gray-400">
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="text-gray-500 text-sm font-bold uppercase">
                  {data.team2Name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-800">
                    {data.team2Runs}-{data.team2Wickets}
                  </span>
                  <span className="text-gray-500 font-medium">
                    ({data.team2Overs})
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-2 rounded-full">
                <Target className="text-gray-400 w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Man of the Match Section */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-4 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold opacity-80">
                Player of the Match
              </p>
              <h2 className="text-xl font-black italic tracking-tight">
                {data.manOfTheMatch}
              </h2>
            </div>
          </div>
          <User className="w-12 h-12 opacity-20" />
        </div>

        {/* Top Performers */}
        <div className="space-y-4">
          <h2 className="text-gray-800 font-bold text-lg px-1 flex items-center gap-2">
            <CircleDot className="w-5 h-5 text-red-600" /> Top Performers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team 1 Performers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-gray-50 px-4 py-2 border-b font-bold text-gray-700 rounded-t-xl">
                {data.team1Name}
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-bold mb-2">
                    Top Batsmen
                  </p>
                  {data.topBatsmen1?.map((p, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-gray-700 font-medium">
                        {p.playerName}
                      </span>
                      <span className="font-bold text-gray-900">
                        {p.runs}{" "}
                        <span className="text-xs text-gray-400 font-normal">
                          runs
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-bold mb-2">
                    Top Bowlers
                  </p>
                  {data.topBowlers1?.map((p, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-1"
                    >
                      <span className="text-gray-700 font-medium">
                        {p.playerName}
                      </span>
                      <span className="font-bold text-red-600">
                        {p.wickets}-{p.runsConceded}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team 2 Performers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-gray-50 px-4 py-2 border-b font-bold text-gray-700 rounded-t-xl">
                {data.team2Name}
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-bold mb-2">
                    Top Batsmen
                  </p>
                  {data.topBatsmen2?.map((p, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-gray-700 font-medium">
                        {p.playerName}
                      </span>
                      <span className="font-bold text-gray-900">
                        {p.runs}{" "}
                        <span className="text-xs text-gray-400 font-normal">
                          runs
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-bold mb-2">
                    Top Bowlers
                  </p>
                  {data.topBowlers2?.map((p, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-1"
                    >
                      <span className="text-gray-700 font-medium">
                        {p.playerName}
                      </span>
                      <span className="font-bold text-red-600">
                        {p.wickets}-{p.runsConceded}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchSummary;
