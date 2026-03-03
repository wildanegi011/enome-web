import { apiClient } from "./api-client";

export const authApi = {
    login: (data: any) => apiClient("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    register: (data: any) => apiClient("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    forgotPassword: (data: { email: string }) => apiClient("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    resetPassword: (data: { token: string; password: string }) => apiClient("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
    }),
};
