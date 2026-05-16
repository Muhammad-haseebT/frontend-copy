import { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import { getAccountFromCookie } from "../../utils/accessControl";

export default function PlayerInfoSheet({ open, onClose }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const account = getAccountFromCookie();

  useEffect(() => {
    if (open && account?.playerId) {
      setLoading(true);
      axios.get(`${import.meta.env.VITE_BASE_URL}/player/${account.playerId}/info`)
        .then(res => {
          setInfo(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [open, account?.playerId]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60] transition-opacity" onClick={onClose}></div>
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto transform transition-transform duration-300 backdrop-blur-sm p-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <FaTimes size={20} />
        </button>

        {!account?.playerId ? (
          <div className="p-8 text-center text-gray-600">You are not registered as a player.</div>
        ) : loading ? (
          <div className="p-8 text-center text-gray-600 animate-pulse">Loading info...</div>
        ) : info ? (
          <div className="flex flex-col gap-6 pt-6">
            <div className="flex items-center gap-4 border-b pb-4">
              {info.profilePhotoUrl ? (
                <img src={info.profilePhotoUrl} alt={info.playerName} className="w-16 h-16 rounded-full object-cover border-2 border-red-600" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-xl font-bold text-red-600">
                  {info.playerName?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold">{info.playerName}</h2>
                <p className="text-sm text-gray-600">Jersey #{info.jerseyNumber || "N/A"}</p>
                <p className="text-xs text-gray-500 mt-1">Sports: {info.sports?.join(", ") || "None"}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3">TEAMS ({info.teams?.length || 0})</h3>
              {info.teams?.length > 0 ? (
                <ul className="space-y-2">
                  {info.teams.map((t, i) => (
                    <li key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span className="font-semibold text-sm">{t.teamName}</span>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 block">{t.tournamentName}</span>
                        <span className="text-[10px] text-red-600 font-medium">{t.sport}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">Not part of any team yet</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3">TOURNAMENTS ({info.tournaments?.length || 0})</h3>
              {info.tournaments?.length > 0 ? (
                <ul className="space-y-2">
                  {info.tournaments.map((t, i) => (
                    <li key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <span className="text-sm">{t.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'ONGOING' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {t.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">No tournaments joined</p>
              )}
            </div>

            <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
              <span className="text-xs text-gray-600 uppercase font-semibold">Total Matches Played</span>
              <div className="text-2xl font-black text-red-600">{info.totalMatchesPlayed}</div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-red-600">Failed to load info.</div>
        )}
      </div>
    </>
  );
}
