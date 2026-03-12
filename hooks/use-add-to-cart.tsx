/**
 * useAddToCart Hook
 *
 * Mengelola proses tambah produk ke keranjang via React Query mutation.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cartApi, AddToCartParams } from "@/lib/api/cart-api";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { Check, ShoppingBag, X } from "lucide-react";
import React from "react";

export interface AddToCartWithMetadata extends AddToCartParams {
    metadata?: {
        name: string;
        image?: string;
    };
}

export function useAddToCart() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const mutation = useMutation({
        mutationFn: (params: AddToCartWithMetadata) => {
            const { metadata, ...apiParams } = params;
            return cartApi.addItem(apiParams);
        },

        onSuccess: (data, variables) => {
            if (data.message === "success") {
                const { metadata } = variables;

                toast.custom((t) => (
                    <div className="bg-white/95 backdrop-blur-xl border border-neutral-base-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[28px] p-5 flex items-center gap-5 max-w-[420px] w-full group animate-in slide-in-from-right-full duration-500 font-montserrat relative overflow-hidden">
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        {/* Product Image Container */}
                        <div className="relative shrink-0">
                            <div className="w-[64px] h-[64px] rounded-2xl overflow-hidden bg-neutral-base-50 border border-neutral-base-100 shadow-sm relative z-10">
                                {metadata?.image ? (
                                    <img
                                        src={metadata.image}
                                        alt={metadata.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-500">
                                        <ShoppingBag size={24} strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>
                            {/* Decorative badge */}
                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white shadow-md z-20">
                                <Check size={12} strokeWidth={3} />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-[13px] font-black text-neutral-base-900 leading-tight uppercase tracking-wide truncate">
                                {metadata?.name || "Produk ditambahkan"}
                            </h4>
                            <p className="text-[11px] text-neutral-base-400 font-bold mt-1 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Berhasil Masuk Keranjang
                            </p>

                            <button
                                onClick={() => {
                                    router.push("/cart");
                                    toast.dismiss(t);
                                }}
                                className="mt-3 inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-base-900 border-b-2 border-neutral-base-900 pb-0.5 hover:text-amber-800 hover:border-amber-800 transition-all duration-300"
                            >
                                Lihat Keranjang
                            </button>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => toast.dismiss(t)}
                            className="absolute top-4 right-4 text-neutral-base-300 hover:text-neutral-base-900 transition-colors p-1"
                        >
                            <X size={16} strokeWidth={2} />
                        </button>
                    </div>
                ), {
                    duration: 6000,
                    position: "top-right",
                });

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

        onError: () => {
            toast.error("Gagal terhubung ke server");
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
        },
    });

    return {
        addToCart: mutation.mutate,
        isAdding: mutation.isPending,
    };
}
