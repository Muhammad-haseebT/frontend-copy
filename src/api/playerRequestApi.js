import axios from "axios";
const API_URL = import.meta.env.VITE_BASE_URL;

export const createPlayerRequest = (playerRequest) => {
    return axios.post(`${API_URL}/playerRequest`, playerRequest);
}

export const getPlayerRequestsByPlayerId = async (playerId) => {
    const r = await axios.get(`${API_URL}/playerRequest/player/${playerId}`);
    return r.data ?? []; // array
};
//approve player request
export const approvePlayerRequest = async (playerRequestId) => {
    const r = await axios.put(`${API_URL}/playerRequest/approve/${playerRequestId}`);
    return r.data;
};
//reject player request
export const rejectPlayerRequest = async (playerRequestId) => {
    const r = await axios.put(`${API_URL}/playerRequest/reject/${playerRequestId}`);
    return r.data;
};
