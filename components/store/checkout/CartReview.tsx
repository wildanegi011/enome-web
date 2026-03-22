"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trash2, AlertCircle, RefreshCw, XCircle, ShoppingBag } from "lucide-react";
import ConfirmDialog from "@/components/store/shared/ConfirmDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import OrderList from "@/components/store/shared/OrderList";
import CartStockAlert from "@/components/store/shared/CartStockAlert";
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


                <CartStockAlert
                    items={items}
                    onFixQuantities={async (insufficientItems) => {
                        setIsFixing(true);
                        try {
                            for (const item of insufficientItems) {
                                const delta = (item.stock || 0) - item.qty;
                                await updateQuantity(item.id, item.qty, delta, item.stock || 0);
                            }
                        } finally {
                            setIsFixing(false);
                        }
                    }}
                    onClearUnavailable={async (unavailableItems) => {
                        setIsFixing(true);
                        try {
                            for (const item of unavailableItems) {
                                await removeItem(item.id);
                            }
                        } finally {
                            setIsFixing(false);
                        }
                    }}
                    isLoading={isLoading}
                />

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
