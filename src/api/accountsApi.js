import axios from "axios";
const API_URL = import.meta.env.VITE_BASE_URL;
export const getAccounts = () => {
    return axios.get(`${API_URL}/account`);
}
export const updateAccount = (id, account) => {
    return axios.put(`${API_URL}/account/${id}`, account);
}
export const deleteAccount = (id) => {
    return axios.delete(`${API_URL}/account/${id}`);
}
export const addAccount = (account) => {
    return axios.post(`${API_URL}/account`, account);
}
// accountsApi.js mein
export const GetAllPlayers = async (tournamentId) => {
    try {
        const r = await axios.get(`${API_URL}/account/players/${tournamentId}`);


        if (r.status === 200) {
            return r.data;
        }
        return [];
    } catch (error) {

        return [];
    }
}
