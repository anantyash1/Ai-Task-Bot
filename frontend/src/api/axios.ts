import axios from "axios";

const envApiUrl = (import.meta.env.VITE_API_URL || "").trim();
const envApiTimeoutRaw = Number(import.meta.env.VITE_API_TIMEOUT_MS);
const isBrowser = typeof window !== "undefined";
const isCapacitorRuntime =
  isBrowser &&
  (window.location.protocol === "capacitor:" ||
    (window.location.hostname === "localhost" && window.location.port === ""));
const isVercelFrontend = isBrowser && window.location.hostname.endsWith(".vercel.app");
const deployedApiUrl = "https://aitaskbotapi.onrender.com";

const fallbackApiUrl = isCapacitorRuntime
  ? deployedApiUrl
  : isVercelFrontend
    ? deployedApiUrl
    : "http://localhost:8002";

export const API_BASE_URL = (envApiUrl || fallbackApiUrl).replace(/\/+$/, "");
export const API_TIMEOUT_MS = Number.isFinite(envApiTimeoutRaw) && envApiTimeoutRaw > 0
  ? envApiTimeoutRaw
  : isCapacitorRuntime
    ? 60000
    : 30000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
