import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * IMPORTANT: Set this to wherever your Spring Boot backend is reachable.
 * - Testing on the SAME WiFi as your PC: use your PC's local IP, e.g. "http://192.168.1.5:8080"
 *   (NOT "localhost" - the phone can't reach your PC's localhost over WiFi)
 * - Once deployed online (Railway/Render): use that public URL instead
 *
 * Find your PC's local IP on Windows with: ipconfig  (look for IPv4 Address)
 */
export const BASE_URL = "http://172.25.144.1:8080";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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
