/**
 * Cart API
 *
 * Layer API untuk semua operasi keranjang belanja.
 * Setiap method menggunakan apiClient untuk konsistensi
 * error handling dan header management.
 */

import { apiClient } from "./api-client";

/** Struktur satu item di keranjang */
export interface CartItem {
    isPriceChanged?: boolean;
    oldHarga?: number;
    id: number;
    produkId: string;
    qty: number;
    harga: number;
    berat: number;
    warna: string;
    size: string;
    variant?: string;
    namaProduk: string;
    gambar: string;
    stock?: number;
    isPreorder?: number;
    produkPreorder?: number;
    isOnline?: number;
    isHighlighted?: number;
    isFlashsale?: number;
    isFlashsaleExpired?: number;
    keterangan?: string;
    warnaName?: string;
    isGambarUtama?: number;
}

/** Response dari GET /api/cart */
export interface CartResponse {
    items: CartItem[];
}

/** Parameter untuk menambah item ke keranjang */
export interface AddToCartParams {
    id_produk: string;
    color_sylla: string;
    size_sylla: string;
    variant: string;
    qty_produk: number;
    is_flash_sale?: boolean;
}

/** Response dari POST /api/cart/add */
export interface AddToCartResponse {
    message: string;
    totalinlove?: number;
    detail?: string;
    pesan?: string;
}

export const cartApi = {
    /** Ambil semua item di keranjang */
    getCart: () => apiClient<CartResponse>("/api/cart"),

    /** Tambah item baru ke keranjang */
    addItem: (params: AddToCartParams) =>
        apiClient<AddToCartResponse>("/api/cart/add", {
            method: "POST",
            body: JSON.stringify(params),
        }),

    /** Ambil jumlah total item di keranjang (untuk badge header) */
    getCount: async () => {
        const data = await apiClient<{ total: number }>("/api/cart/count");
        return data.total || 0;
    },

    /** Update quantity item tertentu */
    updateItem: (id: number, qty: number) =>
        apiClient(`/api/cart/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ qty }),
        }),

    /** Update catatan/notes item tertentu */
    updateNotes: (id: number, notes: string) =>
        apiClient(`/api/cart/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ notes }),
        }),

    /** Hapus satu item dari keranjang */
    removeItem: (id: number) =>
        apiClient(`/api/cart/${id}`, {
            method: "DELETE",
        }),

    /** Kosongkan seluruh keranjang */
    removeAll: () =>
        apiClient("/api/cart", {
            method: "DELETE",
        }),
};
