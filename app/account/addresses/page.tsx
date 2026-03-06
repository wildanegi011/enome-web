"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import Navbar from "@/components/store/layout/Navbar";
import UserSidebar from "@/components/store/layout/UserSidebar";
import AccountHeader from "@/components/store/layout/AccountHeader";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { useAddresses, Address } from "@/hooks/use-addresses";
import AddressCard from "@/components/store/address/AddressCard";
import AddAddressModal from "@/components/store/address/AddAddressModal";
import SearchInput from "@/components/store/shared/SearchInput";
import EmptyState from "@/components/store/shared/EmptyState";
import { MapPin } from "lucide-react";

export default function AddressesPage() {
    const { addresses, isLoading, deleteAddress, setPrimary } = useAddresses();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

    const handleEdit = (address: Address) => {
        setSelectedAddress(address);
        setIsAddModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedAddress(null);
        setIsAddModalOpen(true);
    };

    const filteredAddresses = addresses.filter(addr =>
        addr.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.fullAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return <AddressesSkeleton />;
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans text-neutral-base-900">
            <Navbar />

            <main className="max-w-[1340px] mx-auto px-3 sm:px-4 md:px-8 py-6 md:py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="hidden lg:block">
                        <UserSidebar />
                    </div>

                    <div className="flex-1 min-w-0">
                        <AccountHeader
                            title="Daftar Alamat"
                            description="Kelola alamat pengiriman kamu untuk proses checkout yang lebih cepat."
                            className="mb-4 md:mb-10"
                        >
                            <Button
                                onClick={handleAdd}
                                className="hidden h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl bg-neutral-base-900 text-white font-bold tracking-widest uppercase hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10 gap-3 group shrink-0 w-full sm:w-auto text-[11px] md:text-[13px]"
                            >
                                <Plus className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-300" />
                                Tambah Alamat
                            </Button>
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
                                    <span className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Total: {addresses.length} Alamat</span>
                                </div>
                            </div>
                        </div>

                        {/* Address Grid */}
                        {filteredAddresses.length > 0 ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {filteredAddresses.map((address, idx) => (
                                        <motion.div
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
                                                onDelete={deleteAddress}
                                                onSetPrimary={setPrimary}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Add Address Skeleton/Placeholder */}
                                <motion.button
                                    whileHover={{ scale: 0.99 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleAdd}
                                    className="bg-neutral-base-50/50 rounded-[32px] border-2 border-dashed border-neutral-base-200 flex flex-col items-center justify-center p-12 hover:bg-white hover:border-amber-800/20 transition-all min-h-[300px] gap-4"
                                >
                                    <div className="w-16 h-16 rounded-[24px] bg-neutral-base-100 flex items-center justify-center text-neutral-base-300 group-hover:bg-amber-50 group-hover:text-amber-800 transition-colors">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black uppercase tracking-widest text-neutral-base-900 mb-1">Tambah Lokasi Baru</p>
                                        <p className="text-[12px] font-bold text-neutral-base-400">Simpan alamat pengiriman lainnya</p>
                                    </div>
                                </motion.button>
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
                    </div>
                </div>
            </main>

            <AddAddressModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                initialData={selectedAddress}
            />

            {/* Floating Action Button for Add Address */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                className="fixed bottom-[100px] right-6 w-14 h-14 rounded-full bg-neutral-base-900 text-white shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:bg-neutral-base-800 transition-all z-40 flex items-center justify-center group md:hidden"
            >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                <span className="sr-only">Tambah Alamat</span>
            </motion.button>
        </div>
    );
}
function AddressesSkeleton() {
    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <Navbar />
            <main className="max-w-[1340px] mx-auto px-4 md:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="hidden lg:block w-[280px] shrink-0">
                        <UserSidebar />
                    </div>
                    <div className="flex-1 space-y-10">
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-48" />
                                <Skeleton className="h-4 w-96" />
                            </div>
                            <Skeleton className="h-14 w-44 rounded-2xl" />
                        </div>
                        <div className="bg-white/60 backdrop-blur-md border border-neutral-base-100/60 rounded-[24px] p-2 flex items-center gap-4">
                            <Skeleton className="h-12 flex-1 rounded-[18px]" />
                            <Skeleton className="h-4 w-32 mr-6" />
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-[300px] w-full rounded-[32px]" />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
