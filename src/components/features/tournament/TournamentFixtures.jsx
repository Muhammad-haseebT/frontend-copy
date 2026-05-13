import React, { useEffect, useState, useMemo } from "react";
import { Plus, X, Zap } from "lucide-react";
import { getMatchesByTournamentId } from "../../../api/matchApi";
import Loading from "../../common/LoadingSpinner";
import { getTeamsByTournamentId } from "../../../api/teamApi";
import { createMatch, updateMatch } from "../../../api/matchApi";
import {
  getAccountFromCookie,
  isAdminAccount,
} from "../../../utils/accessControl";

function FixtureCard({ fixture, onEdit, sportId, canEdit }) {
  return (
    <div className="bg-gray-100 rounded-xl p-3 mb-3 shadow-sm border border-red-600">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">
            {fixture.team1Name} vs {fixture.team2Name}
          </div>
          <div className="text-sm text-gray-500">
            Date: {fixture.date} | Time: {fixture.time}
          </div>
          <div className="text-xs text-gray-400">
            Venue: {fixture.venue} | {sportId == 1 && `${fixture.overs} Overs`}
          </div>
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

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate every unique pair from the teams array */
function generatePairs(teams) {
  const pairs = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairs.push([teams[i], teams[j]]);
    }
  }
  return pairs;
}

/** Convert "HH:MM" string to total minutes */
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/** Convert total minutes to "HH:MM" string */
function toTimeStr(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Add days to a YYYY-MM-DD string */
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TournamentFixtures({ tournamentId, sportId }) {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const isAdmin = isAdminAccount(getAccountFromCookie());

  // ── Manual create/edit modal ──
  const [modalOpen, setModalOpen] = useState(false);
  const [matchId, setMatchId] = useState("");
  const [check, setCheck] = useState(true);
  const [form, setForm] = useState({
    team1Id: "",
    team2Id: "",
    scorerId: "",
    mediaScorerUsername: "",
    venue: "",
    date: new Date().toISOString().split("T")[0],
    time: "14:00",
    overs: "20",
    tournamentId: tournamentId,
  });

  // ── Auto-generate modal ──
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState({
    current: 0,
    total: 0,
  });
  const [autoConfig, setAutoConfig] = useState({
    startDate: new Date().toISOString().split("T")[0],
    dayStartTime: "08:00",
    dayEndTime: "17:00",
    gapHours: "1",
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

  // ── Live preview calculation ──
  const preview = useMemo(() => {
    if (teams.length < 2) return null;

    const totalMatches = (teams.length * (teams.length - 1)) / 2;
    const startMin = toMinutes(autoConfig.dayStartTime);
    const endMin = toMinutes(autoConfig.dayEndTime);
    const gapMin = parseFloat(autoConfig.gapHours) * 60;

    if (!gapMin || gapMin <= 0 || endMin <= startMin) return null;

    const slotsPerDay = Math.floor((endMin - startMin) / gapMin);
    if (slotsPerDay <= 0) return null;

    const daysNeeded = Math.ceil(totalMatches / slotsPerDay);

    // Build day-wise breakdown
    const dayBreakdown = [];
    for (let d = 0; d < daysNeeded; d++) {
      const matchesThisDay = Math.min(
        slotsPerDay,
        totalMatches - d * slotsPerDay,
      );
      dayBreakdown.push({
        date: addDays(autoConfig.startDate, d),
        count: matchesThisDay,
      });
    }

    return { totalMatches, slotsPerDay, daysNeeded, dayBreakdown };
  }, [
    teams,
    autoConfig.dayStartTime,
    autoConfig.dayEndTime,
    autoConfig.gapHours,
    autoConfig.startDate,
  ]);

  // ── Build full schedule array ──
  function buildSchedule() {
    const pairs = generatePairs(teams);
    const startMin = toMinutes(autoConfig.dayStartTime);
    const endMin = toMinutes(autoConfig.dayEndTime);
    const gapMin = parseFloat(autoConfig.gapHours) * 60;
    const slotsPerDay = Math.floor((endMin - startMin) / gapMin);

    return pairs.map(([team1, team2], index) => {
      const dayOffset = Math.floor(index / slotsPerDay);
      const slotInDay = index % slotsPerDay;
      const slotMinutes = startMin + slotInDay * gapMin;

      return {
        team1Id: team1.id,
        team2Id: team2.id,
        date: addDays(autoConfig.startDate, dayOffset),
        time: toTimeStr(slotMinutes),
        venue: autoConfig.venue,
        overs: parseInt(autoConfig.overs) || 20,
        scorerId: autoConfig.scorerId,
        mediaScorerUsername: autoConfig.mediaScorerUsername,
        tournamentId: tournamentId,
      };
    });
  }

  // ── Handlers ──

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAutoChange = (e) =>
    setAutoConfig({ ...autoConfig, [e.target.name]: e.target.value });

  const handleEdit = (fixture) => {
    setMatchId(fixture.id);
    setCheck(false);
    setForm({
      team1Id: fixture.team1Id,
      team2Id: fixture.team2Id,
      scorerId: fixture.scorerId || "",
      mediaScorerUsername: fixture.mediaScorerUsername || "",
      venue: fixture.venue,
      date: fixture.date,
      time: fixture.time,
      overs: fixture.overs,
      tournamentId: tournamentId,
    });
    setModalOpen(true);
  };

  const handleCreate = () => {
    setCheck(true);
    setForm({
      team1Id: teams[0]?.id || "",
      team2Id: teams[1]?.id || "",
      scorerId: "",
      mediaScorerUsername: "",
      venue: "",
      date: new Date().toISOString().split("T")[0],
      time: "14:00",
      overs: "20",
      tournamentId: tournamentId,
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
    } catch (error) {
      console.error("Error creating/updating match:", error);
    } finally {
      setModalOpen(false);
    }
  };

  const handleAutoSubmit = async (e) => {
    e.preventDefault();
    if (!preview) return;

    const schedule = buildSchedule();
    setGenerating(true);
    setGenerateProgress({ current: 0, total: schedule.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < schedule.length; i++) {
      try {
        await createMatch(schedule[i]);
        successCount++;
      } catch (err) {
        errorCount++;
        console.error(`Match ${i + 1} failed:`, err);
      }
      setGenerateProgress({ current: i + 1, total: schedule.length });
    }

    setGenerating(false);
    setAutoModalOpen(false);
    await fetchData();

    if (errorCount > 0) {
      alert(
        `${successCount} matches created, ${errorCount} failed. Check console for details.`,
      );
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

  // ── Render ──

  return (
    <div className="p-4 relative min-h-screen">
      <h3 className="text-gray-800 font-semibold text-2xl mb-3">Fixtures</h3>

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white p-4 rounded-lg">
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
            <div>No fixtures found</div>
          )}
        </div>
      )}

      {/* FABs — manual + auto-generate */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 items-end">
          {/* Auto Generate Button */}
          <button
            onClick={() => setAutoModalOpen(true)}
            className="bg-white border-2 border-red-600 text-red-600 rounded-full p-3 shadow-lg hover:bg-red-50 transition flex items-center gap-2 pr-4"
            title="Auto Generate Fixtures"
          >
            <Zap size={22} />
            <span className="text-sm font-semibold">Auto Generate</span>
          </button>

          {/* Manual Create Button */}
          <button
            onClick={handleCreate}
            className="bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition"
            title="Create Fixture Manually"
          >
            <Plus size={30} />
          </button>
        </div>
      )}

      {/* ── Manual Create/Edit Modal ── */}
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
                  name="team1Id"
                  required
                  value={form.team1Id}
                  onChange={handleChange}
                  className="flex-1 border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500"
                >
                  {teams
                    .filter((t) => t.id != form.team2Id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
                <span className="font-bold text-red-600">VS</span>
                <select
                  name="team2Id"
                  required
                  value={form.team2Id}
                  onChange={handleChange}
                  className="flex-1 border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500"
                >
                  {teams
                    .filter((t) => t.id != form.team1Id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <select
                name="venue"
                required
                value={form.venue}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select Venue</option>
                {venues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="scorerId"
                placeholder="Scorer ID (Optional)"
                value={form.scorerId}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <input
                type="text"
                name="mediaScorerUsername"
                placeholder="Media Person Username (Optional)"
                value={form.mediaScorerUsername}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Match Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={form.date}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Start Time</label>
                  <input
                    type="time"
                    name="time"
                    required
                    value={form.time}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {sportId == 1 && (
                <input
                  type="number"
                  name="overs"
                  placeholder="Total Overs"
                  required
                  value={form.overs}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              )}

              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition shadow-md"
              >
                {check ? "Create Fixture" : "Update Fixture"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Auto Generate Modal ── */}
      {autoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Zap size={20} className="text-red-600" />
                  Auto Generate Fixtures
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Round Robin — every team vs every team
                </p>
              </div>
              <button onClick={() => !generating && setAutoModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Teams count info */}
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 text-sm text-red-700">
              <span className="font-semibold">{teams.length} teams</span>{" "}
              registered →{" "}
              <span className="font-semibold">
                {(teams.length * (teams.length - 1)) / 2} total matches
              </span>
            </div>

            {teams.length < 2 ? (
              <div className="text-center text-gray-500 py-6">
                At least 2 teams are required to generate fixtures.
              </div>
            ) : (
              <form onSubmit={handleAutoSubmit} className="space-y-4">
                {/* Start Date */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={autoConfig.startDate}
                    onChange={handleAutoChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Daily Window */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Daily Match Window
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400">
                        Start Time
                      </label>
                      <input
                        type="time"
                        name="dayStartTime"
                        required
                        value={autoConfig.dayStartTime}
                        onChange={handleAutoChange}
                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">End Time</label>
                      <input
                        type="time"
                        name="dayEndTime"
                        required
                        value={autoConfig.dayEndTime}
                        onChange={handleAutoChange}
                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Gap */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Gap Between Matches (hours)
                  </label>
                  <input
                    type="number"
                    name="gapHours"
                    required
                    min="0.5"
                    max="12"
                    step="0.5"
                    value={autoConfig.gapHours}
                    onChange={handleAutoChange}
                    placeholder="e.g. 1 or 1.5"
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Venue */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Venue (same for all matches)
                  </label>
                  <select
                    name="venue"
                    required
                    value={autoConfig.venue}
                    onChange={handleAutoChange}
                    className="w-full border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Venue</option>
                    {venues.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional fields */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 block">
                    Optional
                  </label>
                  <input
                    type="text"
                    name="scorerId"
                    placeholder="Scorer ID (Optional)"
                    value={autoConfig.scorerId}
                    onChange={handleAutoChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    name="mediaScorerUsername"
                    placeholder="Media Person Username (Optional)"
                    value={autoConfig.mediaScorerUsername}
                    onChange={handleAutoChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  {sportId == 1 && (
                    <input
                      type="number"
                      name="overs"
                      placeholder="Overs per match"
                      required
                      value={autoConfig.overs}
                      onChange={handleAutoChange}
                      className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  )}
                </div>

                {/* ── Live Preview ── */}
                {preview ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-gray-700">
                      📅 Schedule Preview
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>
                        <span className="font-bold text-red-600">
                          {preview.slotsPerDay}
                        </span>{" "}
                        matches/day
                      </span>
                      <span>
                        <span className="font-bold text-red-600">
                          {preview.daysNeeded}
                        </span>{" "}
                        day{preview.daysNeeded > 1 ? "s" : ""} needed
                      </span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {preview.dayBreakdown.map((day, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-xs bg-white border border-gray-100 rounded-lg px-3 py-1.5"
                        >
                          <span className="text-gray-500">
                            Day {i + 1} — {day.date}
                          </span>
                          <span className="font-semibold text-gray-700">
                            {day.count} match{day.count > 1 ? "es" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-xs text-yellow-700">
                    Adjust time window and gap to see preview.
                  </div>
                )}

                {/* ── Generating Progress ── */}
                {generating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Creating matches...</span>
                      <span>
                        {generateProgress.current} / {generateProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(generateProgress.current / generateProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!preview || generating}
                  className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  {generating
                    ? `Generating... (${generateProgress.current}/${generateProgress.total})`
                    : `Generate ${preview?.totalMatches ?? ""} Fixtures`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
