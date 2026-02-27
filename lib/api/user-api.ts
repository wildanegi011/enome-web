import { apiClient } from "./api-client";

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
    }
};
