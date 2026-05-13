import axios from "axios";
const API_URL = import.meta.env.VITE_BASE_URL;
export const getSeasons = async () => {
    const response = await axios.get(`${API_URL}/season`);
    return response.data;
};
export const createSeason = async (seasonData) => {
    const response = await axios.post(`${API_URL}/season`, seasonData);
    return response.data;
}
export const getTournamentsBySeason = async (seasonID) => {
    const response = await axios.get(`${API_URL}/season/${seasonID}`);
    return response.data;
}
export const add_Sports_To_Season = async (sportsData) => {
    const response = await axios.post(`${API_URL}/add-sports`, sportsData);
    return response.data;
}
export const getTournamentsBySport = async (sportID, seasonID) => {
    const response = await axios.get(`${API_URL}/season/tournaments/${seasonID}/${sportID}`);
    return response.data;
}