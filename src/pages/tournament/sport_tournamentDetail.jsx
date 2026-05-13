import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTournamentsBySport } from "../../api/seasonApi";
import TournamentDetailComponent from "../../components/features/tournament/TournamentDetailComponent";
import MediaViewer from "../../components/common/MediaViewer";
import { getMediaBySportId } from "../../api/mediaApi";

export default function SportTournamentDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mediaData, setMediaData] = useState([]);
  const [mediaPage, setMediaPage] = useState(0);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [loadingMoreMedia, setLoadingMoreMedia] = useState(false);
  const MEDIA_PAGE_SIZE = 6;

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        const response = await getTournamentsBySport(
          state.sportID,
          state.seasonID,
        );
        setTournaments(response);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
    // Initial media load
    loadMoreMedia();
  }, []);

  const loadMoreMedia = async () => {
    if (loadingMoreMedia || !hasMoreMedia) return;

    setLoadingMoreMedia(true);
    try {
      // Using sportID as inferred tournamentID based on user context
      const response = await getMediaBySportId(
        state.sportID,
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

  return (
    <TournamentDetailComponent
      option="sport"
      navigate={navigate}
      name={state.seasonName}
      tournaments={tournaments}
      seasonID={state.seasonID}
      loading={loading}
      sportID={state.sportID}
      mediaData={mediaData}
      onLoadMore={loadMoreMedia}
      hasMore={hasMoreMedia}
      loadingMore={loadingMoreMedia}
    />
  );
}
