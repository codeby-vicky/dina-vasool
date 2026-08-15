import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Your deployed backend on Render (Neon Postgres behind it).
 * Free-tier Render instances sleep after inactivity - first request after
 * that can take 50-90 seconds to wake up, hence the long timeout below.
 */
export const BASE_URL = "https://dina-vasool.onrender.com";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 90000, // 90s - accommodates Render free-tier cold starts
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong. Check your connection to the server.";
    return Promise.reject(new Error(message));
  }
);

export default client;