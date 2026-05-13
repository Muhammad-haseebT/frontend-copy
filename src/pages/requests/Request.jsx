import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import PlayerRequests from "../../components/features/requests/PlayerRequests";
import AdminTeamRequests from "../../components/features/requests/AdminTeamRequests";
import Navbar from "../../components/layout/Navbar";

export default function Request() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const account = Cookies.get("account");
      if (account) {
        const parsedUser = JSON.parse(account);
        setUser(parsedUser);
        console.log("Current User:", parsedUser); // For debugging role
      }
    } catch (error) {
      console.error("Error parsing user cookie:", error);
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-xl text-gray-500">
            Please log in to view requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.name} />
      <div className="pt-6">
        {user.role === "ADMIN" ? (
          <AdminTeamRequests />
        ) : (
          <PlayerRequests playerId={user.playerId} />
        )}
      </div>
    </div>
  );
}
