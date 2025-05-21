import axios from "axios";
import { SERVER_URL } from "../utils/constants";
// Create axios instance with default config
const api = axios.create({
  baseURL: SERVER_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies/session
});

// Token storage utility functions
export const getToken = (): string | null => {
  return localStorage.getItem("jwt_token");
};

export const setToken = (token: string): void => {
  localStorage.setItem("jwt_token", token);
};

export const clearToken = (): void => {
  localStorage.removeItem("jwt_token");
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add JWT token from localStorage if available
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Store JWT token if present in response
    if (response.data && response.data.token) {
      setToken(response.data.token);
    }
    return response;
  },
  (error) => {
    // Handle errors globally here (like 401 unauthorized, etc.)
    if (error.response?.status === 401) {
      // Clear token on authentication failure
      clearToken();
      console.error("Unauthorized request");
      // Could redirect to login page if needed
    }
    return Promise.reject(error);
  },
);

export default api;
