"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trash2, AlertCircle, RefreshCw, XCircle, ShoppingBag } from "lucide-react";
import ConfirmDialog from "@/components/store/shared/ConfirmDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import OrderList from "@/components/store/shared/OrderList";

import { OrderItemType } from "@/components/store/shared/OrderItem";

interface CartReviewProps {
    items: OrderItemType[];
    isLoading: boolean;
    updateQuantity: (id: number, currentQty: number, delta: number, stock: number) => Promise<void>;
    removeItem: (id: number) => Promise<void>;
    updateNotes?: (id: number, notes: string) => Promise<void>;
    removeAllItems?: () => Promise<void>;
    formatPrice: (price: number) => string;
}

export default function CartReview({ items, isLoading, updateQuantity, removeItem, updateNotes, removeAllItems, formatPrice }: CartReviewProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isFixing, setIsFixing] = useState(false);

    // Identify problematic items
    const unavailableItems = items.filter(item => (item.isOnline === 0 || (item.stock !== undefined && item.stock <= 0)));
    const insufficientStockItems = items.filter(item => (item.isOnline !== 0 && item.stock !== undefined && item.stock > 0 && Number(item.qty) > item.stock));
    const hasProblems = unavailableItems.length > 0 || insufficientStockItems.length > 0;

    const handleClearUnavailable = async () => {
        setIsFixing(true);
        try {
            for (const item of unavailableItems) {
                await removeItem(item.id);
            }
        } finally {
            setIsFixing(false);
        }
    };

    const handleFixQuantities = async () => {
        setIsFixing(true);
        try {
            for (const item of insufficientStockItems) {
                const delta = (item.stock || 0) - item.qty;
                await updateQuantity(item.id, item.qty, delta, item.stock || 0);
            }
        } finally {
            setIsFixing(false);
        }
    };

    return (
        <section className="flex flex-col gap-3 bg-white/80 backdrop-blur-sm border border-neutral-base-100/50 p-4 md:p-5 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between border-b border-neutral-base-50 pb-2 md:pb-3">
                <div className="flex items-center gap-2.5 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800">
                        <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <h2 className="text-[13px] md:text-[15px] font-bold uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900 leading-none">
                        Review Barang
                    </h2>
                </div>
                <div className="px-1">
                    <span className="text-[9px] md:text-[11px] font-bold text-neutral-base-400 uppercase tracking-widest bg-neutral-base-50 px-2.5 py-1.5 rounded-full border border-neutral-base-100 leading-none">
                        {items.length} Item
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-4">


                <AnimatePresence>
                    {hasProblems && !isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            className="overflow-hidden mb-4"
                        >
                            <div className="relative group/banner">
                                {/* Glassmorphic Background with Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50/80 backdrop-blur-md rounded-[24px] md:rounded-[32px] border border-red-100/60 shadow-[0_20px_50px_-12px_rgba(239,68,68,0.12)] transition-all duration-500 group-hover/banner:shadow-[0_25px_60px_-12px_rgba(239,68,68,0.18)]" />

                                <div className="relative p-5 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8">
                                    <div className="flex items-start gap-4 md:gap-5">
                                        {/* Animated Icon Container */}
                                        <div className="relative shrink-0">
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.5, 0.8, 0.5]
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                                className="absolute inset-0 bg-red-400 rounded-2xl blur-xl"
                                            />
                                            <div className="relative w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-red-50">
                                                <AlertCircle className="w-5 h-5 md:w-7 md:h-7 text-red-600" />
                                            </div>
                                        </div>

                                        <div className="flex-1 pt-0.5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-[14px] md:text-[18px] font-black text-red-950 tracking-tight font-montserrat">
                                                    Kendala Pesanan
                                                </h4>
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                            </div>
                                            <p className="text-[11px] md:text-[13px] font-bold text-red-800/70 leading-relaxed max-w-[320px] md:max-w-md font-montserrat">
                                                Ada <span className="text-red-600 underline decoration-red-200 decoration-2 underline-offset-4">{unavailableItems.length + insufficientStockItems.length} produk</span> bermasalah. Segera bereskan sebelum melanjutkan pembayaran.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                                        {unavailableItems.length > 0 && (
                                            <motion.button
                                                whileHover={{ y: -1, scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                disabled={isLoading || isFixing}
                                                onClick={handleClearUnavailable}
                                                className="h-9 md:h-11 bg-rose-600 hover:bg-rose-700 text-white px-5 md:px-7 rounded-full font-bold text-[10px] md:text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50 font-montserrat"
                                            >
                                                {isFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 md:w-4 h-4" />}
                                                <span>hapus</span>
                                            </motion.button>
                                        )}
                                        {insufficientStockItems.length > 0 && (
                                            <motion.button
                                                whileHover={{ y: -1, scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                disabled={isFixing}
                                                onClick={handleFixQuantities}
                                                className="h-9 md:h-11 bg-neutral-base-900 hover:bg-black text-white px-5 md:px-7 rounded-full font-bold text-[10px] md:text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-neutral-base-900/10 flex items-center justify-center gap-2 disabled:opacity-50 font-montserrat"
                                            >
                                                {isFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 md:w-4 h-4" />}
                                                <span>sesuaikan</span>
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isLoading ? (
                    <div className="py-6 md:py-12 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-base-200" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-white border border-neutral-base-100 p-6 md:p-8 rounded-xl md:rounded-2xl text-center shadow-sm">
                        <p className="text-neutral-base-400 text-sm">Keranjang Anda kosong.</p>
                    </div>
                ) : (
                    <div className="relative">
                        {isFixing && (
                            <div className="absolute inset-0 bg-white/20 backdrop-blur-xs z-10 flex items-center justify-center rounded-[30px]" />
                        )}
                        <OrderList
                            items={items}
                            variant="checkout"
                            onUpdateQuantity={(id, qty, stock) => {
                                const item = items.find(i => i.id === id);
                                if (item) {
                                    const delta = qty - item.qty;
                                    updateQuantity(id, item.qty, delta, stock);
                                }
                            }}
                            onRemove={removeItem}
                            onUpdateNotes={updateNotes}
                        />
                    </div>
                )}
                {removeAllItems && items.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <div className="h-px bg-neutral-base-100/30 my-1" />
                        <div className="flex items-center justify-center">
                            <button
                                onClick={() => setIsConfirmOpen(true)}
                                className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-neutral-base-300 hover:text-red-600 transition-colors group"
                            >
                                <Trash2 className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                Hapus Semua
                            </button>
                        </div>
                    </div>
                )}
                {removeAllItems && (
                    <ConfirmDialog
                        open={isConfirmOpen}
                        onOpenChange={setIsConfirmOpen}
                        title="Hapus Semua Pesanan?"
                        description="Anda akan menghapus seluruh isi keranjang. Tindakan ini tidak dapat dibatalkan."
                        confirmText="Ya, Hapus Semua"
                        cancelText="Batal"
                        variant="destructive"
                        onConfirm={removeAllItems}
                    />
                )}
            </div>
        </section>
    );
}
