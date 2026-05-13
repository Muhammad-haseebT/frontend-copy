import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getTournamentOverviewApi } from "../../api/tournamentAPi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

import TournamentOverview from "../../components/features/tournament/TournamentOverview";
import TournamentFixtures from "../../components/features/tournament/TournamentFixtures";
import TournamentTeams from "../../components/features/tournament/TournamentTeams";
import TournamentPoints from "../../components/features/tournament/TournamentPoints";
import { getMediaByTournamentId } from "../../api/mediaApi";
import MediaViewer from "../../components/common/MediaViewer";
import { ImageIcon, Pencil } from "lucide-react";
import TournamentStatsTab from "../../components/features/tournament/TournamentStatsTab";
import CreateTournament from "./CreateTournament";
import { getAccountFromCookie, isAdminAccount } from "../../utils/accessControl";

export default function DetailedTournament() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    teams: 0,
    playerType: "",
    startDate: "",
    top: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mediaData, setMediaData] = useState([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [mediaPage, setMediaPage] = useState(0);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [loadingMoreMedia, setLoadingMoreMedia] = useState(false);
  const isAdmin = isAdminAccount(getAccountFromCookie());
  const sports = [
    "cricket",
    "futsal",
    "volleyball",
    "tabletennis",
    "badminton",
    "ludo",
    "tugofWar",
    "chess",
  ];

  const MEDIA_PAGE_SIZE = 6;

  useEffect(() => {
    if (activeTab === "overview") fetchTournamentOverview();
    if (activeTab === "Media" && mediaData.length === 0) loadMoreMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchTournamentOverview = async () => {
    try {
      setLoading(true);
      const response = await getTournamentOverviewApi(state.tournamentId);
      setOverview(response.data);
    } catch (error) {
      console.error("Error fetching tournament overview:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMedia = async () => {
    if (loadingMoreMedia || !hasMoreMedia) return;

    setLoadingMoreMedia(true);
    try {
      const response = await getMediaByTournamentId(
        state.tournamentId,
        mediaPage,
        MEDIA_PAGE_SIZE,
      );

      if (response && response.length > 0) {
        setMediaData((prev) => [...prev, ...response]);
        setMediaPage((prev) => prev + 1);
        if (response.length < MEDIA_PAGE_SIZE) {
          setHasMoreMedia(false);
        }
      } else {
        setHasMoreMedia(false);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
      setHasMoreMedia(false);
    } finally {
      setLoadingMoreMedia(false);
    }
  };

  const openMediaViewer = (index) => {
    setViewerIndex(index);
    setIsViewerOpen(true);
  };

  const handleEditClick = () => {
    if (!isAdmin) return;

    console.log(state.tournamentId);
    navigate("/create-tournament", {
      state: { tournamentId: state.tournamentId, type: "edit" },
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-red-600 p-6">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="text-white cursor-pointer"
            size={24}
            onClick={() => navigate(-1)}
          />
          <h1 className="text-white font-bold text-2xl">
            {state.tournamentName || "Tournament"}
          </h1>
          {isAdmin && (
            <button
              className="text-white cursor-pointer"
              onClick={handleEditClick}
            >
              <Pencil
                className="text-white cursor-pointer absolute right-10 top-7"
                size={24}
              />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto whitespace-nowrap no-scrollbar">
        {["overview", "fixtures", "teams", "stats", "Points", "Media"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-lg font-semibold capitalize min-w-fit ${
                activeTab === tab
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-500 hover:text-red-400"
              }`}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <LoadingSpinner size="large" />
        ) : (
          <>
            {activeTab === "overview" && (
              <TournamentOverview overview={overview} />
            )}

            {activeTab === "fixtures" && (
              // pass fixtures prop if you fetch them; currently using sample inside component
              <TournamentFixtures
                tournamentId={state.tournamentId}
                sportId={state.sportId}
              />
            )}

            {activeTab === "teams" && (
              <TournamentTeams tournamentId={state.tournamentId} />
            )}

            {activeTab === "Points" && (
              <TournamentPoints
                tournamentId={state.tournamentId}
                sport={sports[state.sportId - 1]}
              />
            )}

            {activeTab === "stats" && (
              <TournamentStatsTab
                tournamentId={state.tournamentId}
                sport={state.sport || overview.sport || "cricket"}
              />
            )}
            {activeTab === "Media" && (
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
                    : !loadingMoreMedia && (
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
                {hasMoreMedia && (
                  <div
                    className="h-10 w-full flex items-center justify-center mt-4"
                    ref={(el) => {
                      if (el) {
                        const observer = new IntersectionObserver(
                          (entries) => {
                            if (
                              entries[0].isIntersecting &&
                              !loadingMoreMedia
                            ) {
                              loadMoreMedia();
                            }
                          },
                          { threshold: 1.0 },
                        );
                        observer.observe(el);
                        return () => observer.disconnect();
                      }
                    }}
                  >
                    {loadingMoreMedia && <LoadingSpinner size="small" />}
                  </div>
                )}
              </div>
            )}
          </>
        )}
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
