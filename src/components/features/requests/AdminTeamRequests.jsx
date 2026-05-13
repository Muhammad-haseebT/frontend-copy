import React, { useEffect, useState } from "react";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import {
  getTeamRequests,
  approveTeamRequest,
  rejectTeamRequest,
} from "../../../api/teamApi";
import LoadingSpinner from "../../common/LoadingSpinner";

export default function AdminTeamRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchRequests = async () => {
    try {
      const data = await getTeamRequests();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch team requests:", error);
      toast.error("Failed to load team requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (e, id) => {
    e.stopPropagation(); // Prevent toggling expand
    try {
      await approveTeamRequest(id);
      toast.success("Team approved!");
      fetchRequests();
    } catch (error) {
      console.error("Error approving team:", error);
      toast.error("Failed to approve team.");
    }
  };

  const handleReject = async (e, id) => {
    e.stopPropagation(); // Prevent toggling expand
    try {
      await rejectTeamRequest(id);
      toast.success("Team rejected.");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting team:", error);
      toast.error("Failed to reject team.");
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Team Requests</h2>
      {requests.length === 0 ? (
        <p className="text-gray-500 text-center">No pending team requests.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition hover:shadow-lg cursor-pointer"
              onClick={() => toggleExpand(req.requestId)}
            >
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {req.teamName}
                    {expandedId === req.requestId ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Captain:{" "}
                    <span className="font-medium">
                      {req.CaptainName || "N/A"}
                    </span>
                  </p>
                </div>

                {req.status?.toUpperCase() === "PENDING" && (
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => handleApprove(e, req.requestId)}
                      className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition"
                      title="Approve Team"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={(e) => handleReject(e, req.requestId)}
                      className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                      title="Reject Team"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>

              {/* Expandable Player List */}
              {expandedId === req.requestId && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Team Players:
                  </h4>
                  {req.players && req.players.length > 0 ? (
                    <ul className="space-y-1">
                      {req.players.map((player, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 flex justify-between"
                        >
                          <span>{player.name}</span>
                          <span className="text-gray-400 text-xs">
                            @{player.username}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No players listed.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
