import { apiClient } from "./api-client";

export interface ShippingRequest {
    origin: number;
    destination: number;
    weight: number;
    courier: string;
    price?: string;
}

export interface OrderRequest {
    shipping: any;
    payment: string;
    totalAmount: number;
    specialNotes?: string;
    resi?: string;
    catatan?: string;
    isDropshipper: boolean;
    dropshipper?: any;
    voucherCode?: string | null;
    voucherDiscount?: number;
    walletAmount?: number;
    addressId: number;
    shippingPrice: number;
}

export const checkoutApi = {
    getPaymentMethods: () => apiClient<{ methods: any[]; lastUsed: string | null }>("/api/payment-methods"),
    getCouriers: () => apiClient<any[]>("/api/couriers"),
    getShippingCost: (data: ShippingRequest) =>
        apiClient<any>("/api/shipping", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    validateVoucher: (data: { kode: string; subtotal: number; order_tipe: number }) =>
        apiClient<any>("/api/vouchers/validate", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    submitOrder: (data: OrderRequest) =>
        apiClient<any>("/api/orders", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getConfig: (keys?: string[]) => {
        const query = keys ? `?keys=${keys.join(",")}` : "";
        return apiClient<Record<string, string>>(`/api/config${query}`);
    },
};
