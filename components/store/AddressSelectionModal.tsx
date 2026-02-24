"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Package } from "lucide-react";
import { Address, useAddresses } from "@/hooks/use-addresses";
import AddressCard from "./AddressCard";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface AddressSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (address: Address) => void;
}

export default function AddressSelectionModal({
    isOpen,
    onClose,
    onSelect
}: AddressSelectionModalProps) {
    const { addresses, isLoading } = useAddresses();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] max-h-[90vh] sm:max-w-[800px] p-0 bg-white rounded-[32px] md:rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border-none overflow-hidden flex flex-col">
                <DialogHeader className="p-6 md:p-10 pb-0 flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[22px] bg-linear-to-br from-amber-50 to-orange-50 flex items-center justify-center shadow-sm border border-amber-100/50">
                            <MapPin className="w-6 h-6 md:w-7 md:h-7 text-amber-800" />
                        </div>
                        <div>
                            <DialogTitle className="text-[20px] md:text-[24px] font-black tracking-tight text-neutral-base-900 leading-tight">
                                Pilih Alamat
                            </DialogTitle>
                            <DialogDescription className="text-[12px] md:text-[13px] font-bold text-neutral-base-400 mt-0.5 md:mt-1">
                                Pilih dari alamat yang pernah Anda gunakan
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 pb-6 md:pb-10 pt-6 md:pt-8 bg-neutral-base-50/10">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 animate-spin text-amber-800" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-amber-800 rounded-full" />
                                </div>
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-base-300">Memuat Daftar Alamat...</p>
                        </div>
                    ) : addresses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <AnimatePresence mode="popLayout">
                                {addresses.map((addr, idx) => (
                                    <motion.div
                                        key={addr.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <AddressCard
                                            address={addr}
                                            variant="selection"
                                            isSelectable
                                            onSelect={(a) => {
                                                onSelect(a);
                                                onClose();
                                            }}
                                            className="p-5 md:p-6 h-full bg-white shadow-sm border border-neutral-base-100/60"
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-[28px] bg-neutral-base-50 flex items-center justify-center mb-6 border border-dashed border-neutral-base-200">
                                <Package className="w-10 h-10 text-neutral-base-200" />
                            </div>
                            <h4 className="text-[18px] font-bold text-neutral-base-900 mb-2">Belum ada alamat</h4>
                            <p className="text-[14px] font-bold text-neutral-base-400 max-w-[280px] leading-relaxed">
                                Silakan tutup modal ini dan pilih "Tambah Baru" untuk membuat alamat pertama Anda.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
