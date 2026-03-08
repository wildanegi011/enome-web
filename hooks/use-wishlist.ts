"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { userApi, WishlistItem } from "@/lib/api/user-api";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export function useWishlist() {
    const { isAuthenticated } = useAuth();
    return useQuery({
        queryKey: queryKeys.user.wishlist.all,
        queryFn: async () => {
            const res = await fetch("/api/wishlist");
            if (!res.ok) throw new Error("Failed to fetch wishlist");
            return res.json() as Promise<{ items: string[] }>;
        },
        enabled: isAuthenticated,
    });
}

export function useWishlistDetails() {
    const { isAuthenticated } = useAuth();
    return useQuery<WishlistItem[]>({
        queryKey: queryKeys.user.wishlist.details,
        queryFn: () => userApi.getWishlistDetails(),
        enabled: isAuthenticated,
    });
}

export const useToggleWishlist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { produkId: string; variant?: string; size?: string; warna?: string; price?: number }) => userApi.toggleWishlist(data),
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.user.wishlist.all });
            await queryClient.cancelQueries({ queryKey: queryKeys.user.wishlist.details });

            const previousWishlist = queryClient.getQueryData<{ items: string[] }>(queryKeys.user.wishlist.all);
            const previousDetails = queryClient.getQueryData(queryKeys.user.wishlist.details);

            // Optimistically update basic list
            queryClient.setQueryData(queryKeys.user.wishlist.all, (old: { items: string[] } | undefined) => {
                if (!old) return { items: [variables.produkId] };
                const exists = old.items.includes(variables.produkId);
                return {
                    items: exists
                        ? old.items.filter(id => id !== variables.produkId)
                        : [...old.items, variables.produkId]
                };
            });

            return { previousWishlist, previousDetails };
        },
        onError: (err, produkId, context: any) => {
            if (context?.previousWishlist) {
                queryClient.setQueryData(queryKeys.user.wishlist.all, context.previousWishlist);
            }
            if (context?.previousDetails) {
                queryClient.setQueryData(queryKeys.user.wishlist.details, context.previousDetails);
            }
            toast.error("Gagal memperbarui wishlist");
        },
        onSettled: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user.wishlist.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.user.wishlist.details });

            if (data?.action === "added") {
                toast.success("Berhasil ditambahkan ke wishlist");
            } else if (data?.action === "removed") {
                toast.success("Berhasil dihapus dari wishlist");
            }
        },
    });
}
