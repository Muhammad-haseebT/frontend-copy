import axios from "axios";
const API_URL = import.meta.env.VITE_BASE_URL;
export const getPlayers = () => {
    return axios.get(`${API_URL}/player`);
}
export const addPlayer = (player) => {
    return axios.post(`${API_URL}/player`, player);
}
export const updatePlayer = (id, player) => {
    return axios.put(`${API_URL}/player/${id}`, player);
}
export const deletePlayer = (id) => {
    return axios.delete(`${API_URL}/player/${id}`);
}