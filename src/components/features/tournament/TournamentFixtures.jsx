import React, { useEffect, useState, useMemo } from "react";
import { Plus, X, Zap, LayoutList, Share2 } from "lucide-react";
import { getMatchesByTournamentId, generateFixturesApi, createMatch, updateMatch } from "../../../api/matchApi";
import Loading from "../../common/LoadingSpinner";
import { getTeamsByTournamentId } from "../../../api/teamApi";
import { getAccountFromCookie, isAdminAccount } from "../../../utils/accessControl";

function FixtureCard({ fixture, onEdit, sportId, canEdit }) {
  return (
    <div className="bg-gray-100 rounded-xl p-3 mb-3 shadow-sm border border-red-600 min-w-[200px]">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold flex flex-col gap-1">
            <span className={fixture.winnerTeam?.id === fixture.team1?.id ? "text-green-600" : ""}>
              {fixture.team1Name || fixture.team1?.name || "TBD"}
            </span>
            <span className="text-xs text-gray-400 font-normal">vs</span>
            <span className={fixture.winnerTeam?.id === fixture.team2?.id ? "text-green-600" : ""}>
              {fixture.team2Name || fixture.team2?.name || "TBD"}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Date: {fixture.date} | Time: {fixture.time}
          </div>
          <div className="text-xs text-gray-400">
            Venue: {fixture.venue} {sportId == 1 && `| ${fixture.overs} Overs`}
          </div>
          {fixture.groupName && (
            <div className="text-xs font-bold text-red-600 mt-1">{fixture.groupName}</div>
          )}
        </div>
        {canEdit && (
          <div className="ml-2">
            <button
              className="bg-red-600 text-white px-2 py-1 rounded"
              onClick={() => onEdit(fixture)}
            >
              ✎
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TournamentFixtures({ tournamentId, sportId }) {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const isAdmin = isAdminAccount(getAccountFromCookie());

  const [viewMode, setViewMode] = useState("list"); // 'list' or 'bracket'

  // Manual create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [matchId, setMatchId] = useState("");
  const [check, setCheck] = useState(true);
  const [form, setForm] = useState({
    team1Id: "", team2Id: "", scorerId: "", mediaScorerUsername: "",
    venue: "", date: new Date().toISOString().split("T")[0],
    time: "14:00", overs: "20", tournamentId: tournamentId,
  });

  // Auto-generate modal
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [autoConfig, setAutoConfig] = useState({
    tournamentType: "ROUND_ROBIN",
    startDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    gapMinutes: "120",
    venue: "",
    overs: "20",
    scorerId: "",
    mediaScorerUsername: "",
  });

  const venues = [
    "DPS Rawalpindi",
    "BIIT Ground",
    "Shahbaz Sharif Complex",
    "Post Graduate College Ground",
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleAutoChange = (e) => setAutoConfig({ ...autoConfig, [e.target.name]: e.target.value });

  const handleEdit = (fixture) => {
    setMatchId(fixture.id);
    setCheck(false);
    setForm({
      team1Id: fixture.team1?.id || fixture.team1Id,
      team2Id: fixture.team2?.id || fixture.team2Id,
      scorerId: fixture.scorerId || "",
      mediaScorerUsername: fixture.mediaScorerUsername || "",
      venue: fixture.venue || "",
      date: fixture.date || "",
      time: fixture.time || "",
      overs: fixture.overs || "",
      tournamentId: tournamentId,
    });
    setModalOpen(true);
  };

  const handleCreate = () => {
    setCheck(true);
    setForm({
      team1Id: teams[0]?.id || "",
      team2Id: teams[1]?.id || "",
      scorerId: "", mediaScorerUsername: "", venue: "",
      date: new Date().toISOString().split("T")[0],
      time: "14:00", overs: "20", tournamentId: tournamentId,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (check) {
        await createMatch(form);
      } else {
        await updateMatch(form, matchId);
      }
      await fetchData();
      setModalOpen(false);
    } catch (error) {
      console.error("Error creating/updating match:", error);
      alert(error.response?.data || "Failed to update match. Please check fields.");
    }
  };

  const handleAutoSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await generateFixturesApi(tournamentId, {
        ...autoConfig,
        gapMinutes: parseInt(autoConfig.gapMinutes)
      });
      setAutoModalOpen(false);
      await fetchData();
      setViewMode("bracket"); // Switch to bracket view automatically
    } catch (err) {
      console.error("Failed to generate fixtures:", err);
      alert(err.response?.data || "Failed to generate fixtures.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fixturesResponse, teamsResponse] = await Promise.all([
        getMatchesByTournamentId(tournamentId),
        getTeamsByTournamentId(tournamentId),
      ]);
      setFixtures(fixturesResponse ?? []);
      setTeams(teamsResponse ?? []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Bracket Rendering Logic
  const renderBracket = () => {
    if (!fixtures || fixtures.length === 0) {
      return <div className="text-gray-500 p-4 text-center">No fixtures available to display bracket.</div>;
    }

    // Determine type from fixtures if possible, or just default to checking groups/rounds
    const hasGroups = fixtures.some(f => f.groupName);
    const hasMultipleRounds = new Set(fixtures.map(f => f.roundNumber)).size > 1;

    if (hasGroups) {
      // MIXED: Group by groupName
      const groups = {};
      fixtures.forEach(f => {
        const gn = f.groupName || "Knockout Phase";
        if (!groups[gn]) groups[gn] = [];
        groups[gn].push(f);
      });

      return (
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-8 w-max px-4">
            {Object.keys(groups).sort().map(gn => (
              <div key={gn} className="flex flex-col">
                <h4 className="text-lg font-bold text-red-600 mb-4">{gn}</h4>
                <div className="flex flex-col gap-4">
                  {groups[gn].map(f => <FixtureCard key={f.id} fixture={f} onEdit={handleEdit} sportId={sportId} canEdit={isAdmin} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (hasMultipleRounds && !fixtures.some(f => f.groupName)) {
      // ROUND_ROBIN or LEAGUE (columns by round)
      const rounds = {};
      fixtures.forEach(f => {
        const r = f.roundNumber || 1;
        if (!rounds[r]) rounds[r] = [];
        rounds[r].push(f);
      });

      return (
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-8 w-max px-4">
            {Object.keys(rounds).map(r => (
              <div key={r} className="flex flex-col w-64">
                <h4 className="font-bold text-gray-700 mb-3 text-center border-b pb-2">Round {r}</h4>
                <div className="flex flex-col gap-3">
                  {rounds[r].map(f => <FixtureCard key={f.id} fixture={f} onEdit={handleEdit} sportId={sportId} canEdit={isAdmin} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // KNOCK_OUT or fallback single round bracket
    // A proper tree requires knowing the structure, here we just show columns connecting linearly.
    // For a real knockout tree, you need matches linking to next rounds, but the backend only generates Round 1 for Knockout.
    // So we just show Round 1. 
    return (
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-8 w-max px-4">
          <div className="flex flex-col w-72 relative">
             <h4 className="font-bold text-gray-700 mb-3 text-center border-b pb-2">Round 1 (Knockout)</h4>
             <div className="flex flex-col gap-4">
               {fixtures.filter(f => f.roundNumber === 1 || !f.roundNumber).map((f, i) => (
                 <div key={f.id} className="relative">
                   <FixtureCard fixture={f} onEdit={handleEdit} sportId={sportId} canEdit={isAdmin} />
                   {/* CSS Connector line to the right (placeholder for tree logic) */}
                   <div className="hidden md:block absolute top-1/2 -right-4 w-4 border-t-2 border-gray-300"></div>
                 </div>
               ))}
             </div>
          </div>
          {/* Placeholder for future rounds */}
          <div className="flex flex-col w-72 justify-center border-l-2 border-gray-200 pl-4 opacity-50">
             <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center text-gray-400">
               Next Round (TBD)
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 relative min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-800 font-semibold text-2xl">Fixtures</h3>
        
        {/* Toggle View Mode */}
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${viewMode === "list" ? "bg-white shadow-sm font-bold text-red-600" : "text-gray-600"}`}
          >
            <LayoutList size={16} /> List
          </button>
          <button
            onClick={() => setViewMode("bracket")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${viewMode === "bracket" ? "bg-white shadow-sm font-bold text-red-600" : "text-gray-600"}`}
          >
            <Share2 size={16} /> Bracket
          </button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          {viewMode === "list" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fixtures.length > 0 ? (
                fixtures.map((f) => (
                  <FixtureCard
                    key={f.id}
                    fixture={f}
                    onEdit={handleEdit}
                    sportId={sportId}
                    canEdit={isAdmin}
                  />
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-8">No fixtures found</div>
              )}
            </div>
          ) : (
            renderBracket()
          )}
        </div>
      )}

      {/* FABs */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 items-end z-40">
          <button
            onClick={() => setAutoModalOpen(true)}
            className="bg-white border-2 border-red-600 text-red-600 rounded-full p-3 shadow-lg hover:bg-red-50 transition flex items-center gap-2 pr-4"
            title="Auto Generate Fixtures"
          >
            <Zap size={22} />
            <span className="text-sm font-semibold">Generate by Type</span>
          </button>

          <button
            onClick={handleCreate}
            className="bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition"
            title="Create Fixture Manually"
          >
            <Plus size={30} />
          </button>
        </div>
      )}

      {/* Manual Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {check ? "Create New Fixture" : "Update Fixture"}
              </h2>
              <button onClick={() => setModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <select
                  name="team1Id" required value={form.team1Id} onChange={handleChange}
                  className="flex-1 border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Team 1</option>
                  {teams.filter((t) => t.id != form.team2Id).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <span className="font-bold text-red-600">VS</span>
                <select
                  name="team2Id" required value={form.team2Id} onChange={handleChange}
                  className="flex-1 border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Team 2</option>
                  {teams.filter((t) => t.id != form.team1Id).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <select
                name="venue" required value={form.venue} onChange={handleChange}
                className="w-full border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select Venue</option>
                {venues.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>

              <input type="text" name="scorerId" placeholder="Scorer ID (Optional)" value={form.scorerId} onChange={handleChange} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500" />
              <input type="text" name="mediaScorerUsername" placeholder="Media Person Username (Optional)" value={form.mediaScorerUsername} onChange={handleChange} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Match Date</label>
                  <input type="date" name="date" required value={form.date} onChange={handleChange} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Start Time</label>
                  <input type="time" name="time" required value={form.time} onChange={handleChange} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              {sportId == 1 && (
                <input type="number" name="overs" placeholder="Total Overs" required value={form.overs} onChange={handleChange} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500" />
              )}

              <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition shadow-md">
                {check ? "Create Fixture" : "Update Fixture"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Auto Generate Modal */}
      {autoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap size={20} className="text-red-600" /> Auto Generate Fixtures
              </h2>
              <button onClick={() => !generating && setAutoModalOpen(false)}><X size={24} /></button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 text-sm text-red-700">
              <span className="font-semibold">{teams.length} teams</span> registered
            </div>

            {teams.length < 2 ? (
              <div className="text-center text-gray-500 py-6">At least 2 teams are required.</div>
            ) : (
              <form onSubmit={handleAutoSubmit} className="space-y-4">
                
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Tournament Type</label>
                  <select name="tournamentType" required value={autoConfig.tournamentType} onChange={handleAutoChange} className="w-full border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500">
                    <option value="ROUND_ROBIN">Round Robin</option>
                    <option value="LEAGUE">League (Double Round Robin)</option>
                    <option value="KNOCK_OUT">Knockout</option>
                    <option value="MIXED">Mixed (Group + Knockout)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Start Date</label>
                    <input type="date" name="startDate" required value={autoConfig.startDate} onChange={handleAutoChange} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Start Time (Daily)</label>
                    <input type="time" name="startTime" required value={autoConfig.startTime} onChange={handleAutoChange} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Gap Between Matches (Minutes)</label>
                  <input type="number" name="gapMinutes" required min="30" step="15" value={autoConfig.gapMinutes} onChange={handleAutoChange} placeholder="e.g. 120" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Venue (all matches)</label>
                  <select name="venue" required value={autoConfig.venue} onChange={handleAutoChange} className="w-full border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500">
                    <option value="">Select Venue</option>
                    {venues.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div className="space-y-2 pt-2 border-t mt-2">
                  <label className="text-xs font-semibold text-gray-600 block">Optional Details</label>
                  <input type="text" name="scorerId" placeholder="Scorer ID" value={autoConfig.scorerId} onChange={handleAutoChange} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500" />
                  <input type="text" name="mediaScorerUsername" placeholder="Media Scorer Username" value={autoConfig.mediaScorerUsername} onChange={handleAutoChange} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500" />
                  {sportId == 1 && (
                    <input type="number" name="overs" placeholder="Overs per match" required value={autoConfig.overs} onChange={handleAutoChange} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500" />
                  )}
                </div>

                <button type="submit" disabled={generating} className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-4">
                  <Zap size={18} />
                  {generating ? "Generating..." : "Generate Fixtures"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
