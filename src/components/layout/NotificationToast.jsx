import React from "react";
import { Bell, X } from "lucide-react";

export default function NotificationToast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.slice(0, 3).map((toast) => (
        <div
          key={toast.id}
          className="bg-red-600 text-white rounded-lg shadow-2xl p-4 w-80 flex items-start gap-3 pointer-events-auto"
          style={{ animation: "slideIn 0.3s ease-out forwards" }}
        >
          <div className="flex-shrink-0 mt-0.5">
            <Bell size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm leading-tight">{toast.title}</h4>
            <p className="text-xs mt-1 opacity-90 leading-snug">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="flex-shrink-0 text-white hover:text-gray-200 transition-colors p-1 -mt-1 -mr-1"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
