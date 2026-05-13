import React, { useRef, useState } from "react";
import { createMedia } from "../../../../api/mediaApi";

export default function Media({ ballId, matchId, onClose, onSuccess }) {
  const [comment, setComment] = useState(""); // ✅ NEW
  const [pendingFile, setPendingFile] = useState(null); // ✅ NEW — hold file until comment submitted
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState("source"); // "source" | "comment"

  const uploadFile = async (file, commentText) => {
    setUploading(true);
    try {
      await createMedia(matchId, ballId, file, commentText);
      alert("Upload Successful!");
      if (onSuccess) onSuccess();
      onClose();
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
      setStep("comment"); // ✅ go to comment step
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
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
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
          </>
        )}

        {/* ✅ Step 2 — Comment input after file selected */}
        {step === "comment" && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
              Add Comment
            </h2>
            <p className="text-xs text-gray-400 text-center mb-4">
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
              className="mt-3 w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
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

        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-gray-400 hover:text-red-500 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
