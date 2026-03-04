import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { cartApi } from "@/lib/api/cart-api";
import { queryKeys } from "@/lib/query-keys";

export function useCart() {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const { data: count = 0, isLoading, refetch } = useQuery({
        queryKey: queryKeys.cart.count,
        queryFn: cartApi.getCount,
        enabled: isAuthenticated,
    });

    useEffect(() => {
        const handleCartUpdate = (e: any) => {
            if (e.detail && typeof e.detail.count === "number") {
                queryClient.setQueryData(queryKeys.cart.count, e.detail.count);
            }

            // Always invalidate the full cart list to ensure synchronization
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });

            if (!e.detail || typeof e.detail.count !== "number") {
                refetch();
            }
        };

        window.addEventListener("cart-updated", handleCartUpdate);
        return () => window.removeEventListener("cart-updated", handleCartUpdate);
    }, [refetch, queryClient]);

    return {
        count,
        isLoading,
        refreshCart: refetch
    };
}
