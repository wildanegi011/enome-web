import { apiClient } from "./api-client";
import { Order } from "@/components/store/orders/OrderCard";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export interface Address {
    id: number;
    label: string;
    receiverName: string;
    phoneNumber: string;
    fullAddress: string;
    city: string;
    province: string;
    district: string;
    cityId?: string;
    provinceId?: string;
    districtId?: string;
    postalCode: string;
    shopName: string;
    isPrimary: number;
    type?: string;
    customerId?: string;
}

export interface WalletTransaction {
    id: number;
    custId: string;
    debit: number;
    kredit: number;
    saldo: number;
    keterangan: string;
    createdAt: string;
    updatedAt: string;
}

export interface WalletHistoryResponse {
    history: WalletTransaction[];
    metadata: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

export interface OrderDetail {
    order: {
        orderId: string;
        tglOrder: string;
        statusOrder: string;
        statusTagihan: string;
        totalTagihan: number;
        totalHarga: number;
        ongkir: number;
        biayalain: number;
        totalBerat: number;
        metodebayar: string;
        keterangan: string;
        namaPenerima: string;
        teleponPenerima: string;
        alamatKirim: string;
        provinsiKirim: string;
        kotaKirim: string;
        distrikKirim: string;
        noResi: string;
        ekspedisi: string;
        service: string;
        viaWallet: number;
        viaBank: number;
    };
    items: {
        id: number;
        namaProduk: string;
        harga: number;
        qty: number;
        gambar: string | null;
        ukuran?: string;
        warna?: string;
    }[];
    paymentInfo?: {
        namaBank: string;
        noRekening: string;
        namaPemilik: string;
    };
    voucherInfo?: {
        kode: string;
        nominal: number;
    } | null;
    uniqueCode?: number;
    expiredTime?: string | number | null;
    whatsappAdmin?: string;
}

export interface ProfileData {
    id: number;
    username: string;
    email: string;
    nama: string;
    kodeCustomer: string;
    namaTipeCustomer: string;
    namaToko: string;
    noHandphone: string;
    gender: number;
    brithdate: string | null;
    photo: string | null;
    urlphoto: string | null;
    vouchers: any[];
}

export interface WishlistItem {
    wishlist_id: number;
    produk_id: string;
    nama_produk: string;
    kategori: string;
    gambar: string | null;
    variant?: string | null;
    warna?: string | null;
    size?: string | null;
    harga_poduk?: number | null;
    isaktif: number;
    is_online: number;
    min_price: string | null;
    max_price: string | null;
    base_min_price?: string | null;
    base_max_price?: string | null;
    final_min_price?: string | null;
    final_max_price?: string | null;
    flash_sale_id?: number | null;
    is_on_flash_sale?: boolean;
    flash_sale_discount?: number;
    total_stock: string | null;
    colors: string | null;
    created_at: string | null;
}

export interface OrdersResponse {
    orders: Order[];
    total: number;
    tabs?: { label: string; value: string }[];
}

export const userApi = {
    getAddresses: async () => {
        const data = await apiClient<{ addresses: Address[] }>("/api/user/addresses");
        return data.addresses;
    },
    createAddress: (address: Partial<Address>) =>
        apiClient("/api/user/addresses", {
            method: "POST",
            body: JSON.stringify(address),
        }),
    updateAddress: (data: { id: number } & Partial<Address>) =>
        apiClient("/api/user/addresses", {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
    deleteAddress: (id: number) =>
        apiClient("/api/user/addresses", {
            method: "DELETE",
            body: JSON.stringify({ id }),
        }),
    getWalletBalance: async () => {
        const data = await apiClient<{ balance: number }>("/api/user/wallet");
        return data.balance;
    },
    getWalletHistory: async (page: number = 1, limit: number = 10) => {
        return await apiClient<WalletHistoryResponse>(`/api/user/wallet/history?page=${page}&limit=${limit}`);
    },
    topUpWallet: async (amount: number, description?: string) => {
        return await apiClient<{ message: string; data: any }>("/api/user/wallet/topup", {
            method: "POST",
            body: JSON.stringify({ amount, description }),
        });
    },
    getOrders: async (params: {
        page: number;
        limit: number;
        search?: string;
        dateRange?: DateRange;
        statusOrder?: string;
    }) => {
        const queryParams = new URLSearchParams({
            page: params.page.toString(),
            limit: params.limit.toString(),
            search: params.search || "",
        });

        if (params.dateRange?.from) queryParams.append("startDate", format(params.dateRange.from, "yyyy-MM-dd"));
        if (params.dateRange?.to) queryParams.append("endDate", format(params.dateRange.to, "yyyy-MM-dd"));
        if (params.statusOrder && params.statusOrder !== "ALL") queryParams.append("statusOrder", params.statusOrder);

        return await apiClient<OrdersResponse>(`/api/user/orders?${queryParams.toString()}`);
    },
    getOrderDetail: async (id: string) => {
        return await apiClient<OrderDetail>(`/api/user/orders/${encodeURIComponent(id)}`);
    },
    getProfile: async () => {
        return await apiClient<ProfileData>("/api/user/profile");
    },
    updateProfile: async (data: FormData) => {
        return await apiClient<{ message: string }>("/api/user/profile", {
            method: "POST",
            body: data,
        });
    },
    getWishlistDetails: async () => {
        const data = await apiClient<{ items: WishlistItem[] }>("/api/wishlist/details");
        return data.items;
    },
    toggleWishlist: async (data: { produkId: string; variant?: string; size?: string; warna?: string; price?: number }) => {
        return await apiClient<{ action: "added" | "removed"; produkId: string }>("/api/wishlist", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    trackWaybill: async (awb: string, courier: string, phone: string) => {
        return await apiClient<any>("/api/shipping/track", {
            method: "POST",
            body: JSON.stringify({ awb, courier, phone }),
        });
    }
};
