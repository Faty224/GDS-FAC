import axios from "axios";

/**
 * Client HTTP unique de l'application.
 *
 * L'URL de base est fournie par l'environnement (VITE_API_URL) — jamais codée en dur.
 * Aucun secret (credentials DGI, clés API) ne doit transiter par le frontend.
 */
export const API_URL = ((import.meta.env["VITE_API_URL"] as string | undefined) || "http://127.0.0.1:8000").trim();


const TOKEN_KEY = "gdsf.access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_URL ? `${API_URL.replace(/\/$/, "")}/api` : "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export interface ApiError {
  status: number | null;
  message: string;
  details?: unknown;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status ?? null;
    const normalized: ApiError = {
      status,
      message:
        error?.response?.data?.detail ??
        error?.response?.data?.message ??
        (status === null ? "Service indisponible ou délai dépassé." : "Une erreur est survenue."),
      details: error?.response?.data,
    };
    if (status === 401) setAccessToken(null);
    return Promise.reject(normalized);
  },
);
