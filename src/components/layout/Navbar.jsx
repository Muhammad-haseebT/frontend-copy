import { useState } from "react";
import DrawerMenu from "./DrawerMenu";
import logo from "../../assets/logo.png"; // apna logo yahan daal do
import { useNavigate } from "react-router-dom";

export default function Navbar({ username, onSearch }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav className="bg-white shadow-md px-4 py-2 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate("/home")}
        >
          <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
        </div>

        {/* Search bar + icon */}
        <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full flex-1 mx-4 max-w-md">
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent flex-1 outline-none text-gray-700"
            onChange={(e) => onSearch(e.target.value)}
          />
          <button className="text-gray-500">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>

        {/* Hamburger menu */}
        <button
          className="p-2 border border-gray-300 rounded"
          onClick={() => setDrawerOpen(true)}
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </nav>

      {/* Drawer Menu */}
      <DrawerMenu
        open={drawerOpen}
        setOpen={setDrawerOpen}
        username={username}
      />
    </>
  );
}
