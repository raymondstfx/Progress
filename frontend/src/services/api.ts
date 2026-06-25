import type {
  LoginResponse,
  ResourceDetail,
  ResourceListItem,
  SearchFilters,
  SearchResponse,
  Stats,
  SynthesisResponse,
  User,
} from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export function getToken(): string {
  return localStorage.getItem("policyai_token") || "";
}

export function setSession(token: string, user: User): void {
  localStorage.setItem("policyai_token", token);
  localStorage.setItem("policyai_user", JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem("policyai_token");
  localStorage.removeItem("policyai_user");
}

export function getStoredUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem("policyai_user") || "null");
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData) && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      detail = data.detail || data.error || detail;
    } catch {
      // Keep default detail.
    }
    if (response.status === 401) {
      if (path === "/api/auth/me") clearSession();
      if (detail === "Invalid token" || detail === "Expired token" || detail === "Missing bearer token") {
        detail = "Upload failed: your session expired. Please log out and sign in again.";
      }
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

function queryString(params: SearchFilters): string {
  return new URLSearchParams(Object.entries(params).filter(([, value]) => value) as [string, string][]).toString();
}

export const api = {
  login: (payload: { username: string; password: string }) =>
    request<LoginResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => request<User>("/api/auth/me"),
  stats: () => request<Stats>("/api/stats"),
  resources: (params: SearchFilters = {}) => {
    const qs = queryString(params);
    return request<ResourceListItem[]>(`/api/resources${qs ? `?${qs}` : ""}`);
  },
  resource: (id: string) => request<ResourceDetail>(`/api/resources/${encodeURIComponent(id)}`),
  updateResource: (id: string, payload: Partial<ResourceDetail>) =>
    request<ResourceDetail>(`/api/resources/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteResource: (id: string) => request<{ ok: boolean }>(`/api/resources/${encodeURIComponent(id)}`, { method: "DELETE" }),
  upload: (formData: FormData) => request<ResourceDetail>("/api/documents/upload", { method: "POST", body: formData }),
  reprocess: (documentId: string) => request<ResourceDetail>(`/api/documents/${encodeURIComponent(documentId)}/reprocess`, { method: "POST" }),
  search: (payload: { query: string; filters: SearchFilters; top_k: number }) =>
    request<SearchResponse>("/api/search", { method: "POST", body: JSON.stringify(payload) }),
  synthesis: (payload: { query: string; filters: SearchFilters; top_k: number }) =>
    request<SynthesisResponse>("/api/synthesis", { method: "POST", body: JSON.stringify(payload) }),
  fileUrl: (documentId: string) => `${API_BASE}/api/documents/${encodeURIComponent(documentId)}/file`,
};
