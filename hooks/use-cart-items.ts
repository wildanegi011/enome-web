import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi, CartItem, CartResponse } from "@/lib/api/cart-api";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { useCart } from "./use-cart";

export function useCartItems() {
    const queryClient = useQueryClient();
    const { refreshCart } = useCart();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const { data, isLoading, refetch } = useQuery({
        queryKey: queryKeys.cart.all,
        queryFn: cartApi.getCart,
        select: (data) => data.items || [],
    });

    const cartItems = data || [];

    const selectedItems = useMemo(() => {
        return cartItems.filter(item => selectedIds.includes(item.id));
    }, [cartItems, selectedIds]);

    const totalAmount = useMemo(() => {
        return selectedItems.reduce((acc, item) => acc + (Number(item.harga || 0) * Number(item.qty || 0)), 0);
    }, [selectedItems]);

    const toggleSelectAll = useCallback(() => {
        const onlineItems = cartItems.filter(item => item.isOnline !== 0);
        if (selectedIds.length === onlineItems.length && onlineItems.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(onlineItems.map(i => i.id));
        }
    }, [cartItems, selectedIds]);

    const toggleSelectItem = useCallback((id: number) => {
        const item = cartItems.find(i => i.id === id);
        if (item?.isOnline === 0) return;

        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }, [cartItems]);

    // Mutations
    const updateQuantityMutation = useMutation({
        mutationFn: ({ id, qty }: { id: number; qty: number }) => cartApi.updateItem(id, qty),
        onMutate: async ({ id, qty }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.cart.all });
            const previousData = queryClient.getQueryData<CartResponse>(queryKeys.cart.all);

            queryClient.setQueryData(queryKeys.cart.all, (old: CartResponse | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    items: old.items.map(item => item.id === id ? { ...item, qty } : item)
                };
            });

            return { previousData };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(queryKeys.cart.all, context?.previousData);
            toast.error(err instanceof Error ? err.message : "Gagal update quantity");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
            refreshCart();
        },
    });

    const updateNotesMutation = useMutation({
        mutationFn: ({ id, notes }: { id: number; notes: string }) => cartApi.updateNotes(id, notes),
        onSuccess: () => {
            toast.success("Catatan disimpan", { duration: 1000 });
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
        },
        onError: () => {
            toast.error("Gagal menyimpan catatan");
        },
    });

    const removeItemMutation = useMutation({
        mutationFn: (id: number) => cartApi.removeItem(id),
        onSuccess: (_, id) => {
            setSelectedIds(prev => prev.filter(i => i !== id));
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
            refreshCart();
            toast.success("Produk dihapus");
        },
        onError: () => {
            toast.error("Gagal menghapus produk");
        },
    });

    const removeAllMutation = useMutation({
        mutationFn: () => cartApi.removeAll(),
        onSuccess: () => {
            setSelectedIds([]);
            queryClient.setQueryData(queryKeys.cart.all, []);
            refreshCart();
            toast.success("Semua produk dihapus dari keranjang");
        },
        onError: () => {
            toast.error("Gagal mengosongkan keranjang");
        },
    });

    return {
        cartItems,
        isLoading,
        selectedIds,
        selectedItems,
        totalAmount,
        toggleSelectAll,
        toggleSelectItem,
        updateQuantity: (id: number, qty: number) => updateQuantityMutation.mutate({ id, qty }),
        updateNotes: (id: number, notes: string) => updateNotesMutation.mutate({ id, notes }),
        removeItem: (id: number) => removeItemMutation.mutate(id),
        removeAll: () => removeAllMutation.mutate(),
        refetch,
    };
}
