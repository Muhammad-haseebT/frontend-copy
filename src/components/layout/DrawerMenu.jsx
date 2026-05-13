import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaFutbol,
  FaCalendarAlt,
  FaChartBar,
  FaListAlt,
  FaUserShield,
  FaClipboardList,
  FaSignOutAlt,
} from "react-icons/fa";
import { getAccountFromCookie, isAdminAccount } from "../../utils/accessControl";

export default function DrawerMenu({ open, setOpen, username }) {
  const navigate = useNavigate();
  const isAdmin = isAdminAccount(getAccountFromCookie());

  const menuItems = [
    { name: "Sports", icon: <FaFutbol />, path: "/sports" },
    { name: "Seasons", icon: <FaCalendarAlt />, path: "/seasons" },
    { name: "Stats", icon: <FaChartBar />, path: "/stats" },
    { name: "Matches", icon: <FaListAlt />, path: "/matches" },
    isAdmin && { name: "Manage Account", icon: <FaUserShield />, path: "/manage-accounts" },
    { name: "My Scoring Assignments", icon: <FaClipboardList />, path: "/my-scorer" },
    { name: "Requests", icon: <FaClipboardList />, path: "/request" },
    { name: "Logout", icon: <FaSignOutAlt />, path: "/logout", red: true },
  ].filter(Boolean);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${open ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={() => setOpen(false)}
      ></div>

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-white shadow-md transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="p-4 border-b flex items-center space-x-2">
          <FaUserCircle className="w-10 h-10 text-gray-700" />
          <span className="font-bold">{username}</span>
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
    </>
  );
}
