"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
    id: number;
    email: string;
    name: string;
}

interface AuthResponse {
    authenticated: boolean;
    user?: User;
}

export function useAuth() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<AuthResponse>({
        queryKey: ["auth-me"],
        queryFn: async () => {
            const res = await fetch("/api/auth/me");
            if (res.status === 401) return { authenticated: false };
            if (!res.ok) throw new Error("Failed to fetch auth state");
            return res.json();
        },
        retry: false,
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/auth/logout", { method: "POST" });
            if (!res.ok) throw new Error("Logout failed");
        },
        onSuccess: () => {
            queryClient.setQueryData(["auth-me"], { authenticated: false });
            window.location.reload();
        },
    });

    return {
        user: data?.user,
        isAuthenticated: !!data?.authenticated,
        isLoading,
        logout: logoutMutation.mutate,
        isLoggingOut: logoutMutation.isPending,
    };
}
