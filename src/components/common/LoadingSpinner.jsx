import React from 'react';

export default function LoadingSpinner({ size = 'medium', overlay = false }) {
    const sizeClasses = {
        small: 'w-8 h-8 border-2',
        medium: 'w-12 h-12 border-3',
        large: 'w-16 h-16 border-4'
    };

    const spinner = (
        <div className="flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} border-[#E31212] border-t-transparent rounded-full animate-spin`}
                role="status"
                aria-label="Loading"
            ></div>
        </div>
    );

    if (overlay) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-8">
            {spinner}
        </div>
    );
}
