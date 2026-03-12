"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trash2, AlertCircle, RefreshCw, XCircle } from "lucide-react";
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
        <section className="flex flex-col gap-4 md:gap-6 bg-white/80 backdrop-blur-sm border border-neutral-base-100/50 p-4 md:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full">
            <div className="flex items-center justify-between border-b border-neutral-base-50 pb-3 md:pb-6">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center font-black text-amber-800 text-[14px] md:text-[18px]">1</div>
                    <h2 className="text-[14px] md:text-[16px] font-black uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900">
                        Review Keranjang
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-widest bg-neutral-base-50 px-3 py-1.5 rounded-full border border-neutral-base-100">{items.length} Barang</span>
                </div>
            </div>

            <AnimatePresence>
                {hasProblems && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-red-50 border border-red-100/50 rounded-[28px] p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
                            <div className="flex items-start gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 shadow-sm shadow-red-500/10">
                                    <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[13px] md:text-[15px] font-black text-red-900 border-b border-red-200/50 pb-1 mb-1.5 inline-block">Beberapa barang bermasalah</h4>
                                    <p className="text-[11px] md:text-[12px] font-bold text-red-600/80 leading-relaxed max-w-md">
                                        Ada {unavailableItems.length + insufficientStockItems.length} produk yang stoknya habis atau offline. Bereskan dulu ya sebelum bayar.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                                {unavailableItems.length > 0 && (
                                    <button
                                        disabled={isFixing}
                                        onClick={handleClearUnavailable}
                                        className="h-11 md:h-12 bg-red-600 hover:bg-red-700 text-white px-6 rounded-2xl md:rounded-full font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isFixing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Hapus Item
                                    </button>
                                )}
                                {insufficientStockItems.length > 0 && (
                                    <button
                                        disabled={isFixing}
                                        onClick={handleFixQuantities}
                                        className="h-11 md:h-12 bg-neutral-base-900 hover:bg-neutral-base-800 text-white px-6 rounded-2xl md:rounded-full font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-neutral-base-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isFixing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                        Sesuaikan Stok
                                    </button>
                                )}
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
            )}            {removeAllItems && items.length > 0 && (
                <div className="flex justify-center pt-0.5 md:pt-4 pb-2">
                    <button
                        onClick={() => setIsConfirmOpen(true)}
                        className="flex items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-300 hover:text-red-600 transition-colors group"
                    >
                        <Trash2 className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                        Hapus Semua
                    </button>
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
        </section>
    );
}
