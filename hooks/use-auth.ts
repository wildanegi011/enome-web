"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth-api";

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
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
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

    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth-me"] });
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            queryClient.invalidateQueries({ queryKey: ["user"] });
            queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            queryClient.invalidateQueries({ queryKey: ["couriers"] });
        },
    });

    const registerMutation = useMutation({
        mutationFn: authApi.register,
    });

    const forgotPasswordMutation = useMutation({
        mutationFn: authApi.forgotPassword,
    });

    const resetPasswordMutation = useMutation({
        mutationFn: authApi.resetPassword,
    });

    return {
        user: data?.user,
        isAuthenticated: !!data?.authenticated,
        isLoading,
        logout: logoutMutation.mutate,
        isLoggingOut: logoutMutation.isPending,
        login: loginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        register: registerMutation.mutateAsync,
        isRegistering: registerMutation.isPending,
        forgotPassword: forgotPasswordMutation.mutateAsync,
        isForgottingPassword: forgotPasswordMutation.isPending,
        resetPassword: resetPasswordMutation.mutateAsync,
        isResettingPassword: resetPasswordMutation.isPending,
        verifyResetToken: authApi.verifyResetToken,
    };
}
