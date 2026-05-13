
import axios from "axios";
const API_URL = import.meta.env.VITE_BASE_URL;
export const createTournamentAPi = (formData) => {
    return axios.post(`${API_URL}/tournament`, formData);
};
export const getTournamentOverviewApi = (tournamentId) => {
    return axios.get(`${API_URL}/tournament/overview/${tournamentId}`);
}
export const getTournamentPointsApi = (tournamentId) => {
    return axios.get(`${API_URL}/ptsTable/tournament/${tournamentId}`);
}

export const updateTournamentAPi = (tournamentId, formData) => {
    return axios.put(`${API_URL}/tournament/${tournamentId}`, formData);
};