import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Cricket from "../../assets/Cricket.png";
import Futsal from "../../assets/Futsal.png";
import VolleyBall from "../../assets/VolleyBall.png";
import TableTennis from "../../assets/TableTennis.png";
import Badminton from "../../assets/Badminton.png";
import Ludo from "../../assets/Ludo.png";
import TugOfWar from "../../assets/Tug Of War.png";
import Chess from "../../assets/Chess.png";

export default function Sports() {
  const navigate = useNavigate();
  const sports = [
    { name: "Cricket", img: Cricket },
    { name: "Futsal", img: Futsal },
    { name: "Volleyball", img: VolleyBall },
    { name: "Table Tennis", img: TableTennis },
    { name: "Badminton", img: Badminton },
    { name: "Ludo", img: Ludo },
    { name: "Tug Of War", img: TugOfWar, fullWidth: true },
    { name: "Chess", img: Chess, fullWidth: true },
  ];

  return (
    <div className="p-4 pb-24">
      {/* back arrow button  at corner */}
      <button
        className="absolute top-4 left-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-md z-10"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={20} />
      </button>

      <h1 className="text-2xl font-bold text-center mb-4 text-red-600">
        Sports
      </h1>
      <div className="grid grid-cols-2 gap-3">
        {sports.map((sport, index) => (
          <div
            key={index}
            className={`flex flex-col items-center ${sport.fullWidth ? "col-span-2" : ""}`}
          >
            <img
              src={sport.img}
              alt={sport.name}
              className={`w-full bg-white rounded-lg object-contain p-2 border border-gray-200 ${sport.fullWidth ? "h-48" : "h-32"}`}
            />
            <span className="mt-1 text-sm font-medium text-gray-700">
              {sport.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
