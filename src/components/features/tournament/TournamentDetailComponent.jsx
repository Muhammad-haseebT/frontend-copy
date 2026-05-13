import React, { useState } from "react";
import { ArrowLeft, Home, Play, Plus, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Banner from "../../../assets/banner.png";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "../../common/LoadingSpinner";
import MediaViewer from "../../common/MediaViewer";
import { getAccountFromCookie, isAdminAccount } from "../../../utils/accessControl";

export default function TournamentDetailComponent({
  option,
  navigate,
  name,
  tournaments,
  seasonID,
  loading,
  sportID,
  mediaData = [],
  onLoadMore,
  hasMore,
  loadingMore,
}) {
  const [activeTab, setActiveTab] = useState("tournaments"); // 'tournaments' | 'media'
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const isAdmin = isAdminAccount(getAccountFromCookie());

  const handleAddSports = () => {
    if (!isAdmin) return;
    navigate("/sports-selection", { state: { seasonID: seasonID } });
  };
  const handleAddTournament = () => {
    if (!isAdmin) return;
    navigate("/create-tournament", {
      state: { seasonID: seasonID, sportID: sportID },
    });
  };

  const openMediaViewer = (index) => {
    setViewerIndex(index);
    setIsViewerOpen(true);
  };

  return (
    <div>
      <ToastContainer />
      <div className="">
        {/* Header */}
        <div className="bg-red-600 p-2 relative">
          <button
            className="absolute top-4 left-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-md z-10"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-white font-bold text-lg text-center mt-2 block">
            {name}
          </span>

          <div className="flex justify-between gap-3 mb-4 mt-10 px-4 md:px-12">
            <div
              className={`flex flex-col items-center cursor-pointer transition-all ${activeTab === "tournaments" ? "scale-110 text-white" : "text-red-200 hover:text-white"}`}
              onClick={() => setActiveTab("tournaments")}
            >
              <Home size={24} />
              {activeTab === "tournaments" && (
                <div className="h-1 w-1 bg-white rounded-full mt-1"></div>
              )}
            </div>
            <div
              className={`flex flex-col items-center cursor-pointer transition-all ${activeTab === "media" ? "scale-110 text-white" : "text-red-200 hover:text-white"}`}
              onClick={() => setActiveTab("media")}
            >
              <Play size={24} />
              {activeTab === "media" && (
                <div className="h-1 w-1 bg-white rounded-full mt-1"></div>
              )}
            </div>
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

        {/* Content Section */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold mt-4">
              {activeTab === "tournaments" ? name : "Media Gallery"}
            </h2>
          </div>

          {activeTab === "tournaments" ? (
            /* Tournament List */
            <>
              <div className="space-y-3">
                {loading ? (
                  <LoadingSpinner size="large" />
                ) : tournaments.length > 0 ? (
                  tournaments.map((tournament) => (
                    <div
                      key={
                        option == "season" ? tournament.sportId : tournament.id
                      }
                      className="border border-red-300 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-red-50 transition-all duration-300"
                      onClick={() =>
                        option == "season"
                          ? navigate("/sport-tournament-detail", {
                              state: {
                                sportID: tournament.sportId,
                                seasonID: seasonID,
                                seasonName: name,
                              },
                            })
                          : navigate("/detailed-tournament", {
                              state: {
                                tournamentId: tournament.id,
                                tournamentName: tournament.name,
                                sportId: sportID,
                              },
                            })
                      }
                    >
                      <span className="font-semibold text-gray-800">
                        {tournament.name}
                      </span>
                      {option == "season" ? (
                        <span className="text-gray-600 font-bold">
                          {tournament.tournamentCount}
                        </span>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <h2 className="text-center text-gray-600">
                    No Tournaments Found
                  </h2>
                )}
              </div>

              {/* Add Button - Only for tournaments tab */}
              {isAdmin && <div className="mt-4">
                <button
                  className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 transition-colors fixed bottom-4 right-4 shadow-lg"
                  onClick={() =>
                    option == "season"
                      ? handleAddSports()
                      : handleAddTournament()
                  }
                >
                  <Plus size={28} strokeWidth={3} />
                </button>
              </div>}
            </>
          ) : (
            /* Media Gallery Grid */
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mediaData && mediaData.length > 0
                  ? mediaData.map((media, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow relative group"
                        onClick={() => openMediaViewer(index)}
                      >
                        <img
                          src={media.url}
                          alt={`Media ${index}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <ImageIcon
                            className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                            size={32}
                          />
                        </div>
                      </div>
                    ))
                  : !loadingMore && (
                      <div className="col-span-full py-6 md:py-10 text-center">
                        <div className="flex justify-center mb-3">
                          <ImageIcon className="text-gray-300" size={48} />
                        </div>
                        <h3 className="text-gray-500 font-medium">
                          No media available
                        </h3>
                      </div>
                    )}
              </div>

              {/* Sentinel for Infinite Scroll */}
              {onLoadMore && hasMore && (
                <div
                  className="h-10 w-full flex items-center justify-center mt-4"
                  ref={(el) => {
                    if (el) {
                      const observer = new IntersectionObserver(
                        (entries) => {
                          if (entries[0].isIntersecting && !loadingMore) {
                            onLoadMore();
                          }
                        },
                        { threshold: 1.0 },
                      );
                      observer.observe(el);
                      return () => observer.disconnect();
                    }
                  }}
                >
                  {loadingMore && <LoadingSpinner size="small" />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <MediaViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        mediaData={mediaData}
        initialIndex={viewerIndex}
      />
    </div>
  );
}
