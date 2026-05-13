import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';


const MediaViewer = ({ isOpen, onClose, mediaData, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [loading, setLoading] = useState(true);

    // Sync currentIndex when the viewer opens or initialIndex changes
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setLoading(true);
        }
    }, [isOpen, initialIndex]);

    if (!isOpen || !mediaData || mediaData.length === 0) return null;

    const currentMedia = mediaData[currentIndex];

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === mediaData.length - 1 ? 0 : prev + 1));
        setLoading(true);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? mediaData.length - 1 : prev - 1));
        setLoading(true);
    };

    const handleImageLoad = () => {
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
            {/* Close Button */}
            <button
                className="absolute top-4 right-4 text-white hover:text-red-500 transition-colors p-2 z-50"
                onClick={onClose}
            >
                <X size={32} />
            </button>

            {/* Main Content */}
            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>

                {/* Navigation Buttons */}
                {mediaData.length > 1 && (
                    <>
                        <button
                            className="absolute left-2 md:left-4 text-white hover:text-red-500 transition-colors p-2 bg-black/50 rounded-full z-10"
                            onClick={handlePrev}
                        >
                            <ChevronLeft size={32} />
                        </button>
                        <button
                            className="absolute right-2 md:right-4 text-white hover:text-red-500 transition-colors p-2 bg-black/50 rounded-full z-10"
                            onClick={handleNext}
                        >
                            <ChevronRight size={32} />
                        </button>
                    </>
                )}

                {/* Media Display */}
                <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="animate-spin text-red-600" size={48} />
                        </div>
                    )}
                    <img
                        src={currentMedia.url}
                        alt="Tournament Media"
                        className={`max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} `}
                        onLoad={handleImageLoad}
                    />
                </div>

                {/* Counter */}
                {mediaData.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                        {currentIndex + 1} / {mediaData.length}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaViewer;
