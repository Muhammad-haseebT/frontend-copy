import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  FaUserCircle,
  FaFutbol,
  FaCalendarAlt,
  FaChartBar,
  FaListAlt,
  FaUserShield,
  FaShieldAlt,
  FaClipboardList,
  FaSignOutAlt,
  FaBalanceScale,
  FaHeart,
  FaPen,
  FaInfoCircle
} from "react-icons/fa";
import { getAccountFromCookie, isAdminAccount } from "../../utils/accessControl";
import PlayerInfoSheet from "./PlayerInfoSheet";

export default function DrawerMenu({ open, setOpen, username }) {
  const navigate = useNavigate();
  const [account, setAccount] = useState(() => {
    const acc = getAccountFromCookie();
    if (acc) {
      acc.profilePhotoUrl = localStorage.getItem("profilePhotoUrl");
    }
    return acc;
  });
  const isAdmin = isAdminAccount(account);
  const [showInfo, setShowInfo] = useState(false);
  const fileInputRef = useRef(null);
  
  console.log("DrawerMenu account state:", account);

  const menuItems = [
    { name: "Sports", icon: <FaFutbol />, path: "/sports" },
    { name: "Seasons", icon: <FaCalendarAlt />, path: "/seasons" },
    { name: "Stats", icon: <FaChartBar />, path: "/stats" },
    { name: "Compare Players", icon: <FaBalanceScale />, path: "/player-comparison" },
    { name: "Matches", icon: <FaListAlt />, path: "/matches" },
    isAdmin && { name: "Manage Account", icon: <FaUserShield />, path: "/manage-accounts" },
    { name: "My Scoring Assignments", icon: <FaClipboardList />, path: "/my-scorer" },
    { name: "Requests", icon: <FaClipboardList />, path: "/request" },
    { name: "Logout", icon: <FaSignOutAlt />, path: "/logout", red: true },
  ].filter(Boolean);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/account/${account.id}/profile-photo`, formData);
      const newPhotoUrl = res.data.profilePhotoUrl;
      const updated = { ...account, profilePhotoUrl: newPhotoUrl };
      
      localStorage.setItem("profilePhotoUrl", newPhotoUrl);
      const { profilePhotoUrl: _, ...cookieData } = updated;
      Cookies.set("account", JSON.stringify(cookieData), { expires: 7, path: "/" });
      
      setAccount(updated);
    } catch (err) {
      console.error("Failed to upload photo", err);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${open ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={() => setOpen(false)}
      ></div>

      <div
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-white shadow-md transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="p-4 border-b flex flex-col items-center gap-2">
          <div className="relative w-20 h-20 mx-auto">
            {account?.profilePhotoUrl 
              ? <img src={account.profilePhotoUrl} alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-red-600" />
              : <div className="w-20 h-20 rounded-full bg-red-100 
                                flex items-center justify-center 
                                text-2xl font-bold text-red-600">
                  {username?.[0]?.toUpperCase()}
                </div>
            }
            {account && (
              <>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-red-600 rounded-full 
                            p-1.5 shadow-lg hover:bg-red-700">
                  <FaPen size={12} className="text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" 
                      className="hidden" onChange={handlePhotoUpload} />
              </>
            )}
          </div>
          <span className="font-bold">{username}</span>
          {account?.playerId && (
            <button onClick={() => setShowInfo(true)}
              className="flex items-center gap-2 text-sm text-gray-600 
                        hover:text-red-600 transition">
              <FaInfoCircle size={16} />
              My Player Info
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
                setOpen(false);
              }}
              className={`flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-100 transition ${item.red ? "text-red-600" : "text-gray-800"
                }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>
      <PlayerInfoSheet open={showInfo} onClose={() => setShowInfo(false)} />
    </>
  );
}
