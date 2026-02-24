"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Plus, Home, MoreVertical,
    Edit2, Trash2, CheckCircle2, Star,
    Search, Map, ChevronRight, Loader2,
    Package, AlertCircle
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/store/Navbar";
import UserSidebar from "@/components/store/UserSidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAddresses, Address } from "@/hooks/use-addresses";
import AddressCard from "@/components/store/AddressCard";
import AddAddressModal from "@/components/store/AddAddressModal";

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
        return (
            <div className="min-h-screen bg-neutral-base-50 flex flex-col items-center justify-center p-6 bg-[url('/bg-pattern.svg')] bg-repeat bg-size-[400px_400px]">
                <Loader2 className="w-10 h-10 text-amber-800 animate-spin mb-4" />
                <p className="text-[12px] font-black uppercase tracking-widest text-neutral-base-400">Memuat Daftar Alamat...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-base-50 font-sans text-neutral-base-900 selection:bg-amber-100 selection:text-amber-900">
            <Navbar />

            <main className="max-w-[1240px] mx-auto px-6 py-12 md:py-16">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                    <UserSidebar />

                    <div className="flex-1 min-w-0">
                        {/* Breadcrumbs */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link href="/" className="flex items-center gap-1.5 transition-colors hover:text-amber-800">
                                                <Home className="w-3.5 h-3.5" />
                                                <span>Home</span>
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="text-[11px] font-bold uppercase tracking-widest text-neutral-base-900">
                                            Daftar Alamat
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </motion.div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h1 className="text-[32px] md:text-[42px] font-heading font-bold text-neutral-base-900 tracking-tight leading-tight mb-3">Daftar <span className="text-amber-800">Alamat</span></h1>
                                <p className="text-[14px] md:text-[16px] text-neutral-base-400 font-bold max-w-[500px] leading-relaxed">Atur alamat pengiriman kamu untuk proses checkout yang lebih cepat.</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <Button
                                    onClick={handleAdd}
                                    className="h-14 px-8 rounded-2xl bg-neutral-base-900 text-white font-bold tracking-widest uppercase hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10 gap-3 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    Tambah Alamat
                                </Button>
                            </motion.div>
                        </div>

                        {/* Search & Stats Bar */}
                        <div className="bg-white/60 backdrop-blur-md border border-neutral-base-100/60 rounded-[24px] p-2 mb-8 flex flex-col md:flex-row items-center gap-4 shadow-sm">
                            <div className="relative flex-1 group w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300 group-focus-within:text-amber-800 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari alamat atau nama penerima..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 bg-white/80 border-transparent rounded-[18px] pl-12 pr-6 text-[13px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-amber-50/20 transition-all placeholder:text-neutral-base-300"
                                />
                            </div>
                            <div className="px-6 py-2 border-l border-neutral-base-100 hidden md:block">
                                <span className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Total: {addresses.length} Alamat</span>
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
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[40px] p-20 border border-neutral-base-100/60 shadow-sm flex flex-col items-center text-center"
                            >
                                <div className="w-24 h-24 rounded-full bg-neutral-base-50 flex items-center justify-center mb-8 relative">
                                    <Package className="w-10 h-10 text-neutral-base-200" />
                                    <div className="absolute -right-2 -bottom-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border border-neutral-base-50">
                                        <AlertCircle className="w-5 h-5 text-amber-800" />
                                    </div>
                                </div>
                                <h3 className="text-[20px] font-bold text-neutral-base-900 mb-3 tracking-tight">Belum Ada Alamat Tersimpan</h3>
                                <p className="text-neutral-base-400 font-bold text-[14px] max-w-[320px] mb-10 leading-relaxed">
                                    Kamu belum menambahkan alamat pengiriman. Tambahkan satu untuk mempermudah saat checkout.
                                </p>
                                <Button
                                    onClick={handleAdd}
                                    className="h-14 px-10 rounded-full bg-neutral-base-900 text-white font-bold tracking-widest uppercase hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10 gap-3 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    Tambah Alamat Sekarang
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>

            <AddAddressModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                initialData={selectedAddress}
            />
        </div>
    );
}
