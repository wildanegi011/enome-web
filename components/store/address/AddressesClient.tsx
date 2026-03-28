"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Plus, MapPin } from "lucide-react";
import AccountHeader from "@/components/store/layout/AccountHeader";
import { Button } from "@/components/ui/button";
import { useAddresses, Address } from "@/hooks/use-addresses";
import AddressCard from "@/components/store/address/AddressCard";
import AddAddressModal from "@/components/store/address/AddAddressModal";
import SearchInput from "@/components/store/shared/SearchInput";
import EmptyState from "@/components/store/shared/EmptyState";
import ConfirmDialog from "@/components/store/shared/ConfirmDialog";

import { Skeleton } from "@/components/ui/skeleton";

export function AddressesSkeleton() {
    return (
        <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4 md:mb-10">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                </div>
                <Skeleton className="h-12 w-44 rounded-2xl hidden md:block" />
            </div>

            <div className="mb-4 md:mb-8">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <Skeleton className="h-12 flex-1 rounded-[20px]" />
                    <Skeleton className="h-12 w-32 rounded-[20px] hidden md:block" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[300px] w-full rounded-[32px]" />
                ))}
            </div>
        </div>
    );
}

export default function AddressesClient() {
    const { addresses, isLoading, deleteAddress, setPrimary } = useAddresses();

    if (isLoading) return <AddressesSkeleton />;
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

    const handleEdit = (address: Address) => {
        setSelectedAddress(address);
        setIsAddModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedAddress(null);
        setIsAddModalOpen(true);
    };

    const handleDeleteRequest = (id: number) => {
        setAddressToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (addressToDelete !== null) {
            await deleteAddress(addressToDelete);
            setAddressToDelete(null);
        }
    };

    const filteredAddresses = addresses.filter(addr =>
        addr.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.fullAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 min-w-0">
            <AccountHeader
                title="Daftar Alamat"
                description="Kelola alamat pengiriman kamu untuk proses checkout yang lebih cepat."
                className="mb-4 md:mb-10"
            >
            </AccountHeader>

            {/* Search & Stats Bar - Sticky */}
            <div className="sticky top-[80px] z-30 -mx-4 px-4 py-2 md:py-4 bg-[#F9FAFB]/80 backdrop-blur-md border-b border-transparent transition-all mb-4 md:mb-8">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <SearchInput
                        placeholder="Cari alamat atau nama penerima..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                        className="bg-white/60 backdrop-blur-md"
                    />
                    <div className="px-6 py-3 bg-white/60 backdrop-blur-md border border-neutral-base-100/60 rounded-[20px] shadow-sm hidden md:block shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-base-400">Total: {addresses.length} Alamat</span>
                    </div>
                </div>
            </div>

            {/* Address Grid */}
            {filteredAddresses.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredAddresses.map((address, idx) => (
                            <m.div
                                key={address.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <AddressCard
                                    address={address}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteRequest}
                                    onSetPrimary={setPrimary}
                                />
                            </m.div>
                        ))}
                    </AnimatePresence>

                    {/* Add Address Skeleton/Placeholder */}
                    <m.button
                        whileHover={{ scale: 0.99 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAdd}
                        className="bg-neutral-base-50/50 rounded-[32px] border-2 border-dashed border-neutral-base-200 flex flex-col items-center justify-center p-12 hover:bg-white hover:border-amber-800/20 transition-all min-h-[300px] gap-4"
                    >
                        <div className="w-16 h-16 rounded-[24px] bg-neutral-base-100 flex items-center justify-center text-neutral-base-300 group-hover:bg-amber-50 group-hover:text-amber-800 transition-colors">
                            <Plus className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                            <p className="text-[13px] font-black uppercase tracking-widest text-neutral-base-900 mb-1">Tambah Lokasi Baru</p>
                            <p className="text-[11px] font-bold text-neutral-base-400">Simpan alamat pengiriman lainnya</p>
                        </div>
                    </m.button>
                </div>
            ) : (
                <EmptyState
                    icon={MapPin}
                    title="Belum Ada Alamat Tersimpan"
                    description="Kamu belum menambahkan alamat pengiriman. Tambahkan satu untuk mempermudah saat checkout."
                    actionLabel="Tambah Alamat Sekarang"
                    onActionClick={handleAdd}
                />
            )}

            <AddAddressModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                initialData={selectedAddress}
            />

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Hapus Alamat?"
                description="Alamat ini akan dihapus secara permanen dan tidak bisa dikembalikan. Apakah kamu yakin ingin menghapusnya?"
                onConfirm={handleDeleteConfirm}
                confirmText="Hapus"
                cancelText="Batal"
                variant="destructive"
            />
        </div>
    );
}
