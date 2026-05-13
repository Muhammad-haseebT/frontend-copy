import { Home, Play, ChevronLeft, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Futsal from "../../assets/Futsal.png";
import VolleyBall from "../../assets/VolleyBall.png";
import TableTennis from "../../assets/TableTennis.png";
import Badminton from "../../assets/Badminton.png";
import Ludo from "../../assets/Ludo.png";
import TugOfWar from "../../assets/Tug Of War.png";
import Chess from "../../assets/Chess.png";
import Cricket from "../../assets/Cricket.png";
import { add_Sports_To_Season } from "../../api/seasonApi";
import { ToastContainer, toast } from "react-toastify";
import { getAccountFromCookie, isAdminAccount } from "../../utils/accessControl";

export default function SportSelection() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const isAdmin = isAdminAccount(getAccountFromCookie());
  const [sports, setSports] = useState([
    { id: 1, name: "Cricket", img: Cricket, selected: false },
    { id: 2, name: "Futsal", img: Futsal, selected: false },
    { id: 3, name: "Volleyball", img: VolleyBall, selected: false },
    { id: 4, name: "Table Tennis", img: TableTennis, selected: false },
    { id: 5, name: "Badminton", img: Badminton, selected: false },
    { id: 6, name: "Ludo", img: Ludo, selected: false },
    { id: 7, name: "Tug Of War", img: TugOfWar, selected: false },
    { id: 8, name: "Chess", img: Chess, selected: false },
  ]);

  // Selected sports ki alag array
  const selectedSports = sports.filter((sport) => sport.selected);

  const toggleSport = (id) => {
    if (!isAdmin) return;

    setSports(
      sports.map((sport) =>
        sport.id === id ? { ...sport, selected: !sport.selected } : sport,
      ),
    );
  };

  const handleAdd = async () => {
    if (!isAdmin) {
      toast.error("Only admin can add sports to a season.");
      return;
    }

    console.log("Selected Sports:", selectedSports);
    try {
      const sportsData = {
        sportsIds: selectedSports.map((sport) => sport.id),
        seasonId: state.seasonID,
      };
      await add_Sports_To_Season(sportsData);
      toast.success("Sports added successfully!");
      setTimeout(() => {
        navigate("/tournament-detail", {
          state: { seasonID: state.seasonID, seasonName: state.seasonName },
        });
      }, 1500);
    } catch (error) {
      toast.error(
        error.message || "An error occurred while adding sports to the season.",
      );
    }
  };

  return (
    <div className="">
      <ToastContainer />

      <div className="w-full bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-6">
          <div className="flex items-center gap-3">
            <ChevronLeft
              className="text-white"
              size={24}
              onClick={() => navigate(-1)}
            />
            <h1 className="text-white font-bold text-2xl">Sports</h1>
          </div>
        </div>

        {/* Sports Grid */}
        <div className="p-6">
          {/* Selected Count */}
          {selectedSports.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              {selectedSports.length} sport
              {selectedSports.length > 1 ? "s" : ""} selected
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {sports.map((sport) => (
              <div
                key={sport.id}
              onClick={() => toggleSport(sport.id)}
              className={`relative bg-white border-2 rounded-2xl p-6 transition ${
                isAdmin ? "cursor-pointer hover:shadow-lg" : "cursor-default"
              } ${
                  sport.selected ? "border-red-600" : "border-gray-200"
                }`}
              >
                {/* Tick Mark */}
                {sport.selected && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}

                <div className="flex flex-col items-center gap-2">
                  <img
                    src={sport.img}
                    alt={sport.name}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Button */}
          {isAdmin && <button
            onClick={handleAdd}
            disabled={selectedSports.length === 0}
            className={`w-full mt-6 py-3 rounded-xl font-semibold transition ${
              selectedSports.length > 0
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Add {selectedSports.length > 0 && `(${selectedSports.length})`}
          </button>}
        </div>
      </div>
    </div>
  );
}
