import React, { useState, useEffect } from "react";
import { createMedia, getMediaByBallId, getMatchFavouriteMediaIds, toggleFavouriteMedia } from "../../../../api/mediaApi";
import Cookies from "js-cookie";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import LoadingSpinner from "../../../common/LoadingSpinner";

export default function Media({ ballId, matchId, onClose, onSuccess }) {
  const [comment, setComment] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState("gallery"); // "gallery" | "source" | "comment"
  
  const [mediaList, setMediaList] = useState([]);
  const [favouriteMediaIds, setFavouriteMediaIds] = useState(new Set());
  const [loadingMedia, setLoadingMedia] = useState(true);

  const accountCookie = Cookies.get("account");
  const accountId = accountCookie ? JSON.parse(accountCookie).id : null;

  useEffect(() => {
    fetchMediaData();
  }, [ballId, matchId, accountId]);

  const fetchMediaData = async () => {
    setLoadingMedia(true);
    try {
      const [mediaRes, favRes] = await Promise.all([
        getMediaByBallId(ballId),
        accountId ? getMatchFavouriteMediaIds(matchId, accountId) : Promise.resolve([])
      ]);
      setMediaList(mediaRes);
      setFavouriteMediaIds(new Set(favRes));
    } catch (error) {
      console.error("Error fetching media data:", error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleToggleFavourite = async (mediaId) => {
    if (!accountId) {
      alert("Please log in to favourite media");
      return;
    }
    
    // Optimistic update
    setFavouriteMediaIds(prev => {
      const next = new Set(prev);
      if (next.has(mediaId)) next.delete(mediaId);
      else next.add(mediaId);
      return next;
    });

    try {
      await toggleFavouriteMedia(accountId, mediaId, matchId);
    } catch (error) {
      // Revert on error
      setFavouriteMediaIds(prev => {
        const next = new Set(prev);
        if (next.has(mediaId)) next.delete(mediaId);
        else next.add(mediaId);
        return next;
      });
      console.error("Error toggling favourite:", error);
    }
  };

  const uploadFile = async (file, commentText) => {
    setUploading(true);
    try {
      await createMedia(matchId, ballId, file, commentText);
      alert("Upload Successful!");
      if (onSuccess) onSuccess();
      // Go back to gallery and refresh
      setStep("gallery");
      fetchMediaData();
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelected = (file) => {
    if (file) {
      setPendingFile(file);
      setStep("comment");
    }
  };

  const openGallery = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => handleFileSelected(e.target.files[0]);
    input.click();
  };

  const openCamera = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => handleFileSelected(e.target.files[0]);
    input.click();
  };

  const handleSubmit = async () => {
    if (pendingFile) await uploadFile(pendingFile, comment);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm md:max-w-md rounded-2xl shadow-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "gallery" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Ball Media</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            
            {loadingMedia ? (
              <div className="py-8 flex justify-center"><LoadingSpinner /></div>
            ) : mediaList.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 mb-4">
                <span className="text-4xl block mb-2">📷</span>
                <p className="text-gray-500 text-sm">No media uploaded for this ball yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {mediaList.map((media) => {
                  const isFav = favouriteMediaIds.has(media.id);
                  return (
                    <div key={media.id} className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
                      <img 
                        src={media.url} 
                        alt="Ball media" 
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={() => handleToggleFavourite(media.id)}
                        className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-md hover:scale-110 transition-transform z-10"
                      >
                        {isFav ? <FaHeart className="text-red-500 text-lg" /> : <FaRegHeart className="text-gray-400 hover:text-red-400 text-lg" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-sm"
              onClick={() => setStep("source")}
            >
              + Upload New Media
            </button>
          </>
        )}

        {step === "source" && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
              Select Image Source
            </h2>
            <div className="flex flex-col gap-3">
              <button
                className="flex items-center justify-center gap-3 w-full py-4 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                onClick={openCamera}
              >
                <span className="text-2xl">📷</span>
                <span className="font-medium text-gray-700">Open Camera</span>
              </button>
              <button
                className="flex items-center justify-center gap-3 w-full py-4 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                onClick={openGallery}
              >
                <span className="text-2xl">🖼️</span>
                <span className="font-medium text-gray-700">From Gallery</span>
              </button>
            </div>
            <button
              onClick={() => setStep("gallery")}
              className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600"
            >
              ← Back to Gallery
            </button>
          </>
        )}

        {step === "comment" && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
              Add Comment
            </h2>
            <p className="text-xs text-gray-400 text-center mb-4 truncate">
              {pendingFile?.name}
            </p>
            <textarea
              className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-red-400"
              rows={3}
              placeholder="Optional comment about this moment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="mt-3 w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 shadow-sm"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button
              onClick={() => setStep("source")}
              className="mt-2 w-full text-sm text-gray-400 hover:text-gray-600"
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
