import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import {
  getPlayerRequestsByPlayerId,
  approvePlayerRequest,
  rejectPlayerRequest,
} from "../../../api/playerRequestApi";
import LoadingSpinner from "../../common/LoadingSpinner";

export default function PlayerRequests({ playerId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await getPlayerRequestsByPlayerId(playerId);
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch player requests:", error);
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playerId) {
      fetchRequests();
    }
  }, [playerId]);

  const handleApprove = async (id) => {
    try {
      setLoading(true);
      await approvePlayerRequest(id);
      toast.success("Request approved!");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setLoading(true);
      await rejectPlayerRequest(id);
      toast.success("Request rejected.");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request.");
    } finally {
      setLoading(false);
    }
  };

  return loading ? (
    <LoadingSpinner />
  ) : (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Requests</h2>
      <ToastContainer />
      {requests.length === 0 ? (
        <p className="text-gray-500 text-center">No pending requests.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.requestId}
              className="bg-white p-4 rounded-xl shadow-md flex items-center justify-between border-l-4 border-red-500 transition hover:shadow-lg"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {req.teamName || "Unknown Team"}
                </h3>
                <h4 className="text-sm font-medium text-gray-600">
                  Creator: {req.teamCreatorName || "Unknown Creator"}
                </h4>
                <p className="text-sm text-gray-600">
                  Status: <span className="font-medium">{req.status}</span>
                </p>
              </div>

              {/* Only show actions if pending */}
              {req.status?.toUpperCase() == "PENDING" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(req.requestId)}
                    className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition"
                    title="Approve"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={() => handleReject(req.requestId)}
                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                    title="Reject"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
