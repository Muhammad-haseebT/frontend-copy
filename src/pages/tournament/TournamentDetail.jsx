import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getTournamentsBySeason } from "../../api/seasonApi";
import { getMediaBySeasonId } from "../../api/mediaApi";
import TournamentDetailComponent from "../../components/features/tournament/TournamentDetailComponent";

import MediaViewer from "../../components/common/MediaViewer";

export default function TournamentDetail() {
  const navigate = useNavigate();
  const { state } = useLocation();
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
        const response = await getTournamentsBySeason(state.seasonID);
        setTournaments(response);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
    loadMoreMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMoreMedia = async () => {
    if (loadingMoreMedia || !hasMoreMedia) return;

    setLoadingMoreMedia(true);
    try {
      const response = await getMediaBySeasonId(
        state.seasonID,
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
      option="season"
      navigate={navigate}
      name={state.seasonName}
      tournaments={tournaments}
      seasonID={state.seasonID}
      loading={loading}
      mediaData={mediaData}
      hasMore={hasMoreMedia} // Changed from hasMoreMedia
      loadingMore={loadingMoreMedia} // Changed from loadingMoreMedia
      onLoadMore={loadMoreMedia} // Changed from loadMoreMedia
    />
  );
}
