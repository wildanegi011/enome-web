"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Address {
    id: number;
    label: string;
    receiverName: string;
    phoneNumber: string;
    fullAddress: string;
    city: string;
    province: string;
    district: string;
    postalCode: string;
    shopName: string;
    isPrimary: number;
    type?: string;
    customerId?: string;
}

export function useAddresses() {
    const queryClient = useQueryClient();

    const { data: addresses = [], isLoading } = useQuery<Address[]>({
        queryKey: ["user-addresses"],
        queryFn: async () => {
            const res = await fetch("/api/user/addresses");
            if (!res.ok) throw new Error("Failed to fetch addresses");
            const data = await res.json();
            return data.addresses;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (newAddress: any) => {
            const res = await fetch("/api/user/addresses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAddress),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to add address");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
            toast.success("Alamat berhasil ditambahkan");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...data }: any) => {
            const res = await fetch("/api/user/addresses", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...data }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update address");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
            toast.success("Alamat berhasil diperbarui");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch("/api/user/addresses", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error("Failed to delete address");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
            toast.success("Alamat berhasil dihapus");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const setPrimaryMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch("/api/user/addresses", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isPrimary: 1 }),
            });
            if (!res.ok) throw new Error("Failed to update address");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
            toast.success("Alamat utama berhasil diperbarui");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    return {
        addresses,
        isLoading,
        createAddress: createMutation.mutateAsync,
        updateAddress: updateMutation.mutateAsync,
        deleteAddress: deleteMutation.mutateAsync,
        setPrimary: setPrimaryMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isSettingPrimary: setPrimaryMutation.isPending,
    };
}
