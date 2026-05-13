import { useEffect } from "react";
import { getSeasons } from "../../api/seasonApi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { createSeason } from "../../api/seasonApi";
import { ToastContainer, toast } from "react-toastify";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Cookies from "js-cookie";
import { getAccountFromCookie, isAdminAccount } from "../../utils/accessControl";

export default function Seasons() {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const isAdmin = isAdminAccount(getAccountFromCookie());

  useEffect(() => {
    fetchSeasons();
  }, []);
  const fetchSeasons = async () => {
    setLoading(true);
    try {
      const response = await getSeasons();
      setSeasons(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = () => {
    if (!isAdmin) {
      toast.error("Only admin can create seasons.");
      return;
    }

    const createNewSeason = async () => {
      try {
        const seasonData = {
          name: name,
          username: JSON.parse(Cookies.get("account")).username,
        };
        await createSeason(seasonData);
        const response = await getSeasons();

        if (response) {
          toast.success("Season created successfully!");
          fetchSeasons();
        } else {
          toast.error("Failed to create season.");
        }
        setCreateModalOpen(false);
      } catch (error) {
        toast.error(
          error.message || "An error occurred while creating the season.",
        );
      }
    };
    createNewSeason();
  };

  return (
    <div className="p-4 pb-24">
      <ToastContainer />

      {/* back arrow button  at corner */}
      <button
        className="absolute top-4 left-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-md z-10"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={20} />
      </button>
      <h1 className="text-2xl font-bold text-center mb-6 text-[#E31212]">
        Seasons
      </h1>
      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <div className="flex flex-col items-center">
          {seasons.map((season, index) => (
            <div
              key={index}
              className="group bg-white rounded-xl shadow-md p-3 flex items-center justify-center border border-red-300 hover:bg-red-500 hover:scale-105 transition-all duration-300 cursor-pointer w-4/5  mb-4"
              onClick={() => {
                navigate("/tournament-detail", {
                  state: { seasonID: season.id, seasonName: season.name },
                });
              }}
            >
              <span className="text-lg font-bold text-red-600 group-hover:text-white text-center transition-colors duration-300">
                {season.name}
              </span>
            </div>
          ))}
        </div>
      )}
      {/* border radius circle */}
      {isAdmin && <div className="mt-4">
        <button
          className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 transition-colors fixed bottom-4 right-4 shadow-lg"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>}

      {isAdmin && createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 bg-black/50 transition-opacity duration-300">
          <div
            className={`bg-white p-6 rounded shadow-lg w-[90vw] max-w-sm md:w-96 transform transition-all duration-300 ease-out relative
            }`}
          >
            <div
              className="relative mb-4 text-right cursor-pointer"
              onClick={() => setCreateModalOpen(false)}
            >
              <span className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                &times;
              </span>
            </div>
            <h2 className="text-xl font-bold mb-4">Create New Season</h2>
            {/* Form fields for creating a new season */}
            <input
              type="text"
              name=""
              id=""
              placeholder="Enter Season Name"
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex justify-end mt-4">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
                onClick={handleCreateSeason}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
