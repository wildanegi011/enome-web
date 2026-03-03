"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, ProfileData } from "@/lib/api/user-api";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export function useProfile() {
    return useQuery<ProfileData>({
        queryKey: queryKeys.user.profile,
        queryFn: () => userApi.getProfile(),
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: FormData) => userApi.updateProfile(data),
        onSuccess: () => {
            toast.success("Profil berhasil diperbarui");
            queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
        },
        onError: (error: any) => {
            toast.error(error.message || "Gagal memperbarui profil");
        },
    });
}
