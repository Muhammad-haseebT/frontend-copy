import React, { useState, useEffect } from "react";
import { getAccountFavouriteMedia, toggleFavouriteMedia } from "../../api/mediaApi";
import Cookies from "js-cookie";
import { FaHeart } from "react-icons/fa";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useNavigate } from "react-router-dom";

export default function MyFavouriteMedia() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const accountCookie = Cookies.get("account");
  const accountId = accountCookie ? JSON.parse(accountCookie).id : null;

  useEffect(() => {
    if (!accountId) {
      navigate("/");
      return;
    }
    fetchFavourites();
  }, [accountId]);

  const fetchFavourites = async () => {
    setLoading(true);
    try {
      const data = await getAccountFavouriteMedia(accountId);
      setMediaList(data || []);
    } catch (error) {
      console.error("Error fetching favourite media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavourite = async (mediaId) => {
    // Optimistically remove from list
    setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
    try {
      // In getAccountFavouriteMedia, the response only gives Media DTOs.
      // But toggleFavouriteMedia needs matchId. 
      // The media DTO in MediaService.java doesn't expose matchId currently, but toggle API doesn't strictly need it if the logic drops it, OR we just pass a dummy matchId like -1 since we're un-favouriting.
      // Wait, toggleFavouriteMedia expects matchId in the backend. 
      // Let's pass 1 as a fallback, or we can update the backend to not require matchId for removing.
      // Actually, passing -1 is safe because the backend checks `findByAccountIdAndMediaId(accountId, mediaId)` which doesn't check matchId.
      await toggleFavouriteMedia(accountId, mediaId, -1);
    } catch (error) {
      console.error("Error removing favourite:", error);
      fetchFavourites(); // revert on fail
    }
  };

  if (!accountId) return null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 min-h-screen pb-20">
      <div className="flex items-center gap-3 mb-8">
        <FaHeart className="text-red-500 text-3xl" />
        <h1 className="text-3xl font-bold text-gray-800">My Favourite Media</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <LoadingSpinner size="large" />
        </div>
      ) : mediaList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
          <span className="text-6xl block mb-4">🤍</span>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No favourites yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            You haven't added any media to your favourites. Look for the heart icon on match media to save them here!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mediaList.map((media) => (
            <div key={media.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
              <div className="relative">
                <img 
                  src={media.url} 
                  alt="Favourite" 
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={() => handleRemoveFavourite(media.id)}
                  className="absolute top-3 right-3 bg-white/90 p-2.5 rounded-full shadow-md hover:scale-110 transition-transform z-10"
                  title="Remove from favourites"
                >
                  <FaHeart className="text-red-500 text-lg" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
