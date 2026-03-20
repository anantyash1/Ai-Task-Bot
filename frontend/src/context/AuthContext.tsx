import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../api/axios";

interface User { id: string; name: string; email: string; }
interface AuthPayload {
  access_token: string;
  user: User;
}
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const RETRYABLE_ERROR_CODES = new Set(["ECONNABORTED", "ERR_NETWORK"]);

type ApiErrorLike = {
  code?: string;
  response?: { status?: number };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableNetworkError = (error: ApiErrorLike): boolean => {
  if (typeof error.response?.status === "number") return false;
  if (error.code && RETRYABLE_ERROR_CODES.has(error.code)) return true;
  return !error.response;
};

const postWithRetry = async <T,>(url: string, payload: object): Promise<T> => {
  try {
    const res = await api.post<T>(url, payload);
    return res.data;
  } catch (error) {
    if (!isRetryableNetworkError(error as ApiErrorLike)) throw error;
    await sleep(1200);
    const retryRes = await api.post<T>(url, payload);
    return retryRes.data;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) setUser(JSON.parse(savedUser));
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await postWithRetry<AuthPayload>("/auth/login", { email, password });
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await postWithRetry<AuthPayload>("/auth/register", { name, email, password });
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
