import axios from "axios";

const API_URL = import.meta.env.VITE_BASE_URL;

export const getAccountNotifications = async (accountId) => {
  return await axios.get(`${API_URL}/notification/account/${accountId}`);
};

export const markNotificationAsRead = async (notificationId) => {
  return await axios.patch(`${API_URL}/notification/${notificationId}/read`);
};
