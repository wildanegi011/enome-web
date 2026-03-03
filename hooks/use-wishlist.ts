"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, WishlistItem } from "@/lib/api/user-api";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export function useWishlist() {
    return useQuery({
        queryKey: queryKeys.user.wishlist.all,
        queryFn: async () => {
            const res = await fetch("/api/wishlist");
            if (!res.ok) throw new Error("Failed to fetch wishlist");
            return res.json() as Promise<{ items: string[] }>;
        },
    });
}

export function useWishlistDetails() {
    return useQuery<WishlistItem[]>({
        queryKey: queryKeys.user.wishlist.details,
        queryFn: () => userApi.getWishlistDetails(),
    });
}

export function useToggleWishlist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (produkId: string) => userApi.toggleWishlist(produkId),
        onMutate: async (produkId) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.user.wishlist.all });
            await queryClient.cancelQueries({ queryKey: queryKeys.user.wishlist.details });

            const previousWishlist = queryClient.getQueryData<{ items: string[] }>(queryKeys.user.wishlist.all);
            const previousDetails = queryClient.getQueryData<WishlistItem[]>(queryKeys.user.wishlist.details);

            // Optimistically update the ID list
            queryClient.setQueryData<{ items: string[] }>(queryKeys.user.wishlist.all, (old) => {
                if (!old) return { items: [produkId] };
                const exists = old.items.includes(produkId);
                return {
                    items: exists
                        ? old.items.filter(id => id !== produkId)
                        : [...old.items, produkId],
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
