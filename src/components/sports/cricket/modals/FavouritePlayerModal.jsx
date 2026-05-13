import { useState, useEffect } from "react";
import {
  submitVote,
  getVoteResults,
  checkVoted,
} from "../../../../api/matchApi";
import Cookies from "js-cookie";

export default function FavouritePlayerModal({
  matchId,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
  team1Players,
  team2Players,
  onClose,
}) {
  const [voted, setVoted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const account = JSON.parse(Cookies.get("account") || "{}");
  const accountId = account?.id;

  useEffect(() => {
    const init = async () => {
      try {
        const hasVoted = await checkVoted(matchId, accountId);
        console.log(hasVoted);
        setVoted(hasVoted); // true ho to results UI, false ho to voting UI
        if (hasVoted) {
          const res = await getVoteResults(matchId);
          setResults(res);
        }
      } catch (e) {
        // API error — safe side pe voted true rakhو تاکہ double vote na ho
        setVoted(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleVote = async (playerId) => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await submitVote(matchId, accountId, playerId, feedback || null);
      setVoted(true);
      const res = await getVoteResults(matchId);
      setResults(res);
    } catch (e) {
      setError(e.response?.data || "Vote submit nahi hua");
    } finally {
      setSubmitting(false);
    }
  };

  const totalVotes = results
    ? Object.values(results.playerVoteCounts || {}).reduce((a, b) => a + b, 0)
    : 0;

  const allPlayers = [
    ...team1Players.map((p) => ({ ...p, team: team1Name })),
    ...team2Players.map((p) => ({ ...p, team: team2Name })),
  ];

  if (loading)
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <h2 className="text-2xl font-bold text-red-600 mb-1 text-center">
          ⭐ Favourite Player
        </h2>
        <p className="text-center text-gray-500 text-sm mb-4">
          {voted ? "Vote Results" : "Apne favourite player ko vote karo"}
        </p>

        {error && (
          <p className="text-red-500 text-center text-sm mb-3 bg-red-50 rounded-lg p-2">
            {error}
          </p>
        )}

        {!voted ? (
          // ── Voting UI ──
          <div className="space-y-3">
            {/* Feedback textarea */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Match Feedback{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
                rows={2}
                placeholder="Match ke baare mein kuch likhein..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={300}
              />
              <p className="text-xs text-gray-300 text-right">
                {feedback.length}/300
              </p>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400 text-center mb-2">
                Player select karo phir vote karo
              </p>

              {/* Player selection cards */}
              {allPlayers.map((p) => {
                const isSelected = selectedPlayerId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`w-full flex justify-between items-center border rounded-xl px-4 py-3 mb-2 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-red-50 border-red-500 ring-2 ring-red-300"
                        : "bg-gray-100 border-gray-200 hover:bg-red-50 hover:border-red-300"
                    }`}
                  >
                    {/* Radio indicator + name */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? "border-red-500 bg-red-500"
                            : "border-gray-400"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="font-semibold text-gray-800">
                        {p.name}
                      </span>
                    </div>

                    {/* Team badge */}
                    <span className="text-xs text-white bg-red-400 rounded-full px-2 py-0.5">
                      {p.team}
                    </span>
                  </div>
                );
              })}

              {/* Submit Vote button */}
              <button
                disabled={!selectedPlayerId || submitting}
                onClick={() => handleVote(selectedPlayerId)}
                className="mt-2 w-full bg-red-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Vote Submit Karo ✓"}
              </button>
            </div>
          </div>
        ) : (
          // ── Results UI ──
          <div className="space-y-3">
            {allPlayers.map((p) => {
              const voteCount = results?.playerVoteCounts?.[p.id] || 0;
              const pct =
                totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">
                      {p.name}
                      <span className="text-gray-400 text-xs ml-1">
                        ({p.team})
                      </span>
                    </span>
                    <span className="text-red-600 font-bold">
                      {pct}% ({voteCount})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-center text-gray-400 text-xs mt-2">
              Total votes: {totalVotes}
            </p>
          </div>
        )}

        {/* Close / Skip button */}
        <button
          onClick={onClose}
          className="mt-5 w-full bg-red-600 text-white py-2 rounded-xl font-semibold text-lg hover:bg-red-700 transition"
        >
          {voted ? "Close" : "Skip"}
        </button>
      </div>
    </div>
  );
}
