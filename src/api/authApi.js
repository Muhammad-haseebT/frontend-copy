import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const login = (data) => {
  return axios.post(`${BASE_URL}/account/login`, data);
};
