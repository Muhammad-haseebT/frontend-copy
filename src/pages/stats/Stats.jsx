import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Navbar from "../../components/layout/Navbar";
import PlayerStats from "../../components/features/stats/PlayerStats";

export default function Stats() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    try {
      const account = JSON.parse(Cookies.get("account"));
      setUsername(account.name || "User");
    } catch (err) {
      console.error("Error getting username:", err);
      setUsername("User");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={username} onSearch={() => {}} />

      <div className="p-4 md:p-6">
        <PlayerStats />
      </div>
    </div>
  );
}
