import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
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
        {canEdit && <div className="ml-2">
          <button
            className="bg-red-600 text-white px-2 py-1 rounded"
            onClick={() => onEdit(fixture)}
          >
            ✎
          </button>
        </div>}
      </div>
    </div>
  );
}

export default function TournamentFixtures({ tournamentId, sportId }) {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [matchId, setMatchId] = useState("");
  const [check, setCheck] = useState(true);
  const isAdmin = isAdminAccount(getAccountFromCookie());

  const venues = [
    "DPS Rawalpindi",
    "BIIT Ground",
    "Shahbaz Sharif Complex",
    "Post Graduate College Ground",
  ];

  // Default values set to current date for Spring Boot compatibility
  const [form, setForm] = useState({
    team1Id: "",
    team2Id: "",
    scorerId: "", // Optional
    mediaScorerUsername: "",
    venue: "", // Required
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    time: "14:00", // Default 2:00 PM
    overs: "20", // Required
    tournamentId: tournamentId,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
    console.log(teams);
    setForm({
      team1Id: teams[0].id,
      team2Id: teams[1].id,
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
    console.log("Submitting to Spring Boot:", form);
    try {
      if (check) {
        const response = await createMatch(form);
        console.log("Match created:", response);
      } else {
        const response = await updateMatch(form, matchId);
        console.log("Match updated:", response);
      }
      await fetchData();
    } catch (error) {
      console.error("Error creating/updating match:", error);
    } finally {
      setModalOpen(false);
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
      console.log(fixturesResponse);
      console.log(teamsResponse);
      setFixtures(fixturesResponse ?? []);
      setTeams(teamsResponse ?? []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Floating Action Button */}
      {isAdmin && <div className="fixed bottom-6 right-6">
        <button
          onClick={handleCreate}
          className="bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition"
        >
          <Plus size={30} />
        </button>
      </div>}

      {/* Modal for Creating Fixture */}
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
              {/* Horizontal Team Selection */}
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

              {/* Venue & Scorer */}
              <select
                name="venue"
                required
                value={form.venue}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select Venue</option>
                <option value="DPS Rawalpindi">DPS Rawalpindi</option>
                <option value="BIIT Ground">BIIT Ground</option>
                <option value="Shahbaz Sharif Complex">
                  Shahbaz Sharif Complex
                </option>
                <option value="Post Graduate College Ground">
                  Post Graduate College Ground
                </option>
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
              {/* Date, Time, Overs */}
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
    </div>
  );
}
