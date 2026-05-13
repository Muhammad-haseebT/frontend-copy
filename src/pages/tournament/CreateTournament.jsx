import React, { useState } from "react";
import { add_Sports_To_Season } from "../../api/seasonApi";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Banner from "../../assets/banner.png";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  createTournamentAPi,
  updateTournamentAPi,
} from "../../api/tournamentAPi";
import { getAccountFromCookie, isAdminAccount } from "../../utils/accessControl";

export default function CreateTournament() {
  const today = new Date().toISOString().split("T")[0];
  const { state } = useLocation();
  const navigate = useNavigate();
  const isAdmin = isAdminAccount(getAccountFromCookie());
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: today,
    endDate: today,
    tournamentStage: "roundRobin",
    playerType: "male",
    tournamentType: "hard",
    username: "",
    seasonId: state.seasonID,
    sportsId: state.sportID,
  });
  const type = state.type;
  const tournamentId = state.tournamentId;

  const handleSubmit = async () => {
    if (!isAdmin) {
      navigate("/home");
      return;
    }

    setLoading(true);
    try {
      console.log("Tournament Data:", formData);
      if (type === "edit") {
        await updateTournamentAPi(tournamentId, formData);
      } else {
        await createTournamentAPi(formData);
      }
      navigate(-1);
    } catch (error) {
      console.error("Error creating tournament:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className="w-full bg-white  overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ArrowLeft
              className="text-white cursor-pointer"
              size={24}
              onClick={() => navigate(-1)}
            />
            <h1 className="text-white font-bold text-2xl">
              {type === "edit" ? "Edit Tournament" : "Create Tournament"}
            </h1>
          </div>
          {/* Image */}
          <div className="w-full h-32 bg-green-700 rounded-lg overflow-hidden">
            <img
              src={Banner}
              alt="Sports"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Form */}
        <div className="p-2 space-y-4">
          {/* Tournament Name */}
          <div>
            <label className="text-lg font-semibold mb-1 block">
              Tournament Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-gray-100 rounded-lg px-4 py-3 border border-red-600"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-lg font-semibold mb-1 block">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full bg-gray-100 rounded-lg px-4 py-3 text-right text-sm border border-red-600"
              />
            </div>
            <div>
              <label className="text-lg font-semibold mb-1 block">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full bg-gray-100 rounded-lg px-4 py-3 text-right text-sm border border-red-600 "
              />
            </div>
          </div>

          {/* Tournament Stages */}
          <div>
            <label className="text-lg font-semibold mb-2 block">
              Tournament Stages
            </label>
            <div className="space-y-2">
              {[
                { value: "roundRobin", label: "Round Robin" },
                {
                  value: "roundRobinKnockout",
                  label: "Round Robin + Knock out Rounds",
                },
                { value: "knockOut", label: "Knock Out Rounds" },
                { value: "league", label: "League" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="stage"
                    value={option.value}
                    checked={formData.stage === option.value}
                    onChange={(e) =>
                      setFormData({ ...formData, stage: e.target.value })
                    }
                    className="w-5 h-5  border border-red-600"
                  />
                  <span className="text-lg">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Player Type */}
          <div>
            <label className="text-lg font-semibold mb-2 block">
              Tournament Player Type
            </label>
            <div className="space-y-2">
              {[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="playerType"
                    value={option.value}
                    checked={formData.playerType === option.value}
                    onChange={(e) =>
                      setFormData({ ...formData, playerType: e.target.value })
                    }
                    className="w-5 h-5 border border-red-600"
                  />
                  <span className="text-lg">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tournament Type */}
          <div>
            <label className="text-lg font-semibold mb-2 block">
              Tournament Type
            </label>
            <div className="space-y-2">
              {[
                { value: "hard", label: "Hard" },
                { value: "tennis", label: "Tennis" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="tournamentType"
                    value={option.value}
                    checked={formData.tournamentType === option.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tournamentType: e.target.value,
                      })
                    }
                    className="w-5 h-5 border border-red-600"
                  />
                  <span className="text-lg">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-lg text-gray-500 mb-1 block">
              Enter Organizer Email/AridNo
            </label>
            <input
              type="email"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full bg-gray-100 rounded-lg px-4 py-3 border border-red-600"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              "Create Tournament"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
