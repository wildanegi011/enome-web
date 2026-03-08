import { apiClient } from "./api-client";

export interface CartItem {
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
    isOnline?: number;
    isFlashsale?: number;
    keterangan?: string;
    warnaName?: string;
    isGambarUtama?: number;
}


export interface CartResponse {
    items: CartItem[];
}

export const cartApi = {
    getCart: () => apiClient<CartResponse>("/api/cart"),
    getCount: async () => {
        const data = await apiClient<{ total: number }>("/api/cart/count");
        return data.total || 0;
    },
    updateItem: (id: number, qty: number) =>
        apiClient(`/api/cart/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ qty }),
        }),
    updateNotes: (id: number, notes: string) =>
        apiClient(`/api/cart/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ notes }),
        }),
    removeItem: (id: number) =>
        apiClient(`/api/cart/${id}`, {
            method: "DELETE",
        }),
    removeAll: () =>
        apiClient("/api/cart", {
            method: "DELETE",
        }),
};
