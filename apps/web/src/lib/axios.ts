import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach access token ─────────────────────────────────
apiClient.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// ── Response interceptor — handle 401, refresh token ─────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const refresh = localStorage.getItem("refresh_token");
                if (!refresh) throw new Error("No refresh token");

                const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
                    refresh_token: refresh,
                });

                localStorage.setItem("access_token", data.access_token);
                original.headers.Authorization = `Bearer ${data.access_token}`;
                return apiClient(original);
            } catch {
                // Refresh failed — clear storage and redirect to login
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                if (typeof window !== "undefined") {
                    window.location.href = "/auth/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;