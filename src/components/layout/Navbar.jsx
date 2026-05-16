import { useState, useEffect } from "react";
import DrawerMenu from "./DrawerMenu";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Bell } from "lucide-react";
import NotificationToast from "./NotificationToast";
import { getAccountNotifications, markNotificationAsRead } from "../../api/notificationApi";

export default function Navbar({ username, onSearch }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const accountStr = Cookies.get("account");
        if (!accountStr) return;
        const account = JSON.parse(accountStr);
        if (!account || !account.id) return;
        
        const res = await getAccountNotifications(account.id);
        const newNotifs = res.data;
        
        setNotifications((prevNotifs) => {
          const oldUnreadIds = new Set(prevNotifs.filter(n => !n.isRead).map(n => n.id));
          const incomingUnread = newNotifs.filter(n => !n.isRead);
          
          const freshUnread = incomingUnread.filter(n => !oldUnreadIds.has(n.id));
          
          if (freshUnread.length > 0) {
            setToasts(prevToasts => {
              const updatedToasts = [...prevToasts, ...freshUnread];
              return updatedToasts;
            });
            
            freshUnread.forEach(n => {
              setTimeout(() => {
                setToasts(curr => curr.filter(t => t.id !== n.id));
              }, 5000);
            });
          }
          
          return newNotifs;
        });
        
        setUnreadCount(newNotifs.filter(n => !n.isRead).length);
        
      } catch(err) {
        console.error("Error fetching notifications", err);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDismissToast = async (id) => {
    setToasts(curr => curr.filter(t => t.id !== id));
    try {
      await markNotificationAsRead(id);
      setNotifications(curr => curr.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch(err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications(curr => curr.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch(err) {
        console.error(err);
      }
    }
  };

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

        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <div className="relative">
            <button
              className="p-2 relative rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <Bell className="w-6 h-6 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-100 font-bold flex justify-between items-center bg-gray-50 rounded-t-lg">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded-full">{unreadCount} New</span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-red-50/30' : ''}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <h4 className={`text-sm ${!notif.isRead ? 'font-bold' : 'font-medium'} text-gray-800`}>{notif.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
        </div>
      </nav>

      {/* Drawer Menu */}
      <DrawerMenu
        open={drawerOpen}
        setOpen={setDrawerOpen}
        username={username}
      />

      <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
    </>
  );
}
