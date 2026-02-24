"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./use-auth";

export function useCart() {
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    const fetchCount = useCallback(async () => {
        if (!isAuthenticated) {
            setCount(0);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/cart/count");
            const data = await response.json();
            setCount(data.total || 0);
        } catch (error) {
            console.error("Failed to fetch cart count:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchCount();

        const handleCartUpdate = (e: any) => {
            if (e.detail && typeof e.detail.count === "number") {
                setCount(e.detail.count);
            } else {
                fetchCount();
            }
        };

        window.addEventListener("cart-updated", handleCartUpdate);
        return () => window.removeEventListener("cart-updated", handleCartUpdate);
    }, [fetchCount]);

    return {
        count,
        isLoading,
        refreshCart: fetchCount
    };
}
