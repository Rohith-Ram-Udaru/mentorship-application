import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mentorflow_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    let message = serverMessage || error.message || "Request failed";
    if (!error.response) {
      message = "Server unavailable. Please try again.";
    }
    if (status === 401) {
      message = serverMessage || "Invalid email or password.";
    }
    if (message === "Network Error") {
      message = "Unable to connect securely. Please verify credentials or server availability.";
    }
    error.friendlyMessage = message;
    if (status === 401) localStorage.removeItem("mentorflow_token");
    return Promise.reject(error);
  }
);
