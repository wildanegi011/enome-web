/**
 * useAddToCart Hook
 *
 * Mengelola proses tambah produk ke keranjang via React Query mutation.
 * Menggantikan pemanggilan fetch("/api/cart/add") langsung di component.
 *
 * Fitur:
 * - Otomatis tampilkan toast sukses/error
 * - Dispatch event "cart-updated" agar header cart count terupdate
 * - Invalidate cache cart setelah mutasi selesai
 *
 * @example
 * const { addToCart, isAdding } = useAddToCart();
 * addToCart({ id_produk: "123", color_sylla: "red", ... });
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi, AddToCartParams } from "@/lib/api/cart-api";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { createElement } from "react";

export function useAddToCart() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (params: AddToCartParams) => cartApi.addItem(params),

        /** Handle response — cek field `message` untuk sukses/gagal */
        onSuccess: (data) => {
            if (data.message === "success") {
                toast.success("Barang berhasil ditambahkan ke keranjang", {
                    icon: createElement(Check, {
                        className: "w-4 h-4 text-emerald-500",
                    }),
                });
                // Dispatch event agar komponen lain (header badge) terupdate
                window.dispatchEvent(
                    new CustomEvent("cart-updated", {
                        detail: { count: data.totalinlove },
                    })
                );
            } else {
                toast.error(
                    data.detail ||
                    data.pesan ||
                    "Terjadi kesalahan saat menambah ke keranjang"
                );
            }
        },

        /** Handle network / server error */
        onError: () => {
            toast.error("Gagal terhubung ke server");
        },

        /** Selalu invalidate cache cart agar data terbaru saat user buka keranjang */
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
        },
    });

    return {
        /** Fungsi untuk menambah item ke keranjang */
        addToCart: mutation.mutate,
        /** Status loading saat request sedang berjalan */
        isAdding: mutation.isPending,
    };
}
