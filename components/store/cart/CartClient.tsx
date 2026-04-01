"use client";

import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    Trash2, Info,
    Loader2, ShoppingCart,
    CheckSquare, Square
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Breadcrumb from "@/components/store/shared/Breadcrumb";
import ConfirmDialog from "@/components/store/shared/ConfirmDialog";
import { useRouter } from "next/navigation";
import { useCartItems } from "@/hooks/use-cart-items";
import CartList from "@/components/store/cart/CartList";
import CartSummary from "@/components/store/cart/CartSummary";
import EmptyState from "@/components/store/shared/EmptyState";
import CartStockAlert from "@/components/store/shared/CartStockAlert";
import { cn } from "@/lib/utils";

export default function CartClient() {
    const {
        cartItems,
        isLoading,
        selectedIds,
        totalAmount,
        toggleSelectAll,
        toggleSelectItem,
        updateQuantity,
        updateNotes,
        removeItem,
        removeAll,
        selectedItems,
        fixQuantities,
        clearUnavailable
    } = useCartItems();

    const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
    const [isSummaryInView, setIsSummaryInView] = useState(false);
    const summaryRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsSummaryInView(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (summaryRef.current) {
            observer.observe(summaryRef.current);
        }

        return () => {
            if (summaryRef.current) {
                observer.unobserve(summaryRef.current);
            }
        };
    }, [isLoading, cartItems.length]);

    const handleCheckout = () => {
        if (selectedIds.length === 0) {
            toast.error("Pilih minimal satu produk untuk checkout");
            return;
        }

        // Check for insufficient stock
        const insufficientItems = selectedItems.filter(item => (item.stock || 0) < Number(item.qty));
        if (insufficientItems.length > 0) {
            toast.error(`Beberapa produk memiliki stok tidak cukup. Silakan sesuaikan jumlah pesanan Anda.`);
            return;
        }

        router.push(`/checkout?ids=${selectedIds.join(",")}`);
    };

    return (
        <div className="selection:bg-amber-100 selection:text-amber-900">
            {/* Sticky Header with Breadcrumb and Actions */}
            <div className="sticky top-[70px] md:top-[80px] z-30 bg-white/95 backdrop-blur-md border-b border-neutral-base-100">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-3 md:py-4 flex items-center justify-between gap-4">
                    <Breadcrumb
                        className="truncate min-w-0 flex-1 py-1"
                        items={[
                            { label: "Beranda", href: "/" },
                            { label: "Keranjang" }
                        ]}
                    />

                    {!isLoading && cartItems.length > 0 && (
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={toggleSelectAll}
                                className="flex items-center justify-center bg-white px-3 md:px-5 h-9 md:h-11 rounded-xl border border-neutral-base-100 shadow-sm hover:border-neutral-base-900 transition-all group active:scale-95"
                            >
                                {(() => {
                                    const selectableItems = cartItems.filter(i => i.isOnline !== 0 && (i.stock || 0) > 0);
                                    const isAllSelected = selectableItems.length > 0 && selectedIds.length === selectableItems.length;
                                    return isAllSelected ? (
                                        <CheckSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-base-900" />
                                    ) : (
                                        <Square className="w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-base-300 group-hover:text-neutral-base-900" />
                                    );
                                })()}
                                <span className={cn(
                                    "ml-1.5 md:ml-2.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors",
                                    selectedIds.length > 0 ? "text-neutral-base-900" : "text-neutral-base-400 group-hover:text-neutral-base-900"
                                )}>
                                    <span className="md:hidden">Semua</span>
                                    <span className="hidden md:inline">
                                        {(() => {
                                            const selectableItems = cartItems.filter(i => i.isOnline !== 0 && (i.stock || 0) > 0);
                                            return selectableItems.length > 0 && selectedIds.length === selectableItems.length ? "Batalkan Pilihan" : "Pilih Semua";
                                        })()}
                                    </span>
                                </span>
                            </button>

                            <button
                                onClick={() => setIsConfirmDeleteAllOpen(true)}
                                className="flex items-center justify-center bg-white px-3 md:px-5 h-9 md:h-11 rounded-xl border border-red-50 hover:bg-red-50 hover:border-red-100 transition-all group active:scale-95 shadow-sm"
                            >
                                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                                <span className="ml-1.5 md:ml-2.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-red-600">
                                    <span className="md:hidden">Hapus</span>
                                    <span className="hidden md:inline">Hapus Semua</span>
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={isConfirmDeleteAllOpen}
                onOpenChange={setIsConfirmDeleteAllOpen}
                title="Hapus Semua Pesanan?"
                description="Tindakan ini akan mengosongkan seluruh isi keranjang Anda. Apakah Anda yakin?"
                confirmText="Ya, Hapus Semua"
                cancelText="Batal"
                variant="destructive"
                onConfirm={removeAll}
            />

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-16 pb-32 md:pb-16 min-h-[60vh]">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <m.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] gap-6"
                        >
                            <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-amber-800/20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-base-400">Syncing Selection...</p>
                        </m.div>
                    ) : cartItems.length === 0 ? (
                        <div className="max-w-2xl mx-auto">
                            <EmptyState
                                icon={ShoppingCart}
                                title="Tambah Produk Baru"
                                description="Temukan koleksi terbaik kami dan mulailah mengisi keranjang Anda dengan gaya yang mendefinisikan jati diri."
                                actionLabel="Jelajahi Produk"
                                actionHref="/products"
                                className="md:rounded-[40px]"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 md:gap-10">
                            {/* Mobile Swipe Hint Alert */}
                            <m.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="lg:hidden bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Info className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-blue-900 leading-tight">Geser produk ke kiri untuk menghapusnya dari keranjang.</p>
                                </div>
                            </m.div>

                            <CartStockAlert
                                items={cartItems}
                                onFixQuantities={fixQuantities}
                                onClearUnavailable={clearUnavailable}
                                isLoading={isLoading}
                            />
                            <div className="flex flex-col lg:flex-row gap-6 md:gap-10 items-start">
                                <CartList
                                    items={cartItems}
                                    selectedIds={selectedIds}
                                    onToggleSelect={toggleSelectItem}
                                    onUpdateQuantity={updateQuantity}
                                    onUpdateNotes={updateNotes}
                                    onRemove={removeItem}
                                />
                                <div
                                    ref={summaryRef}
                                    className="w-full lg:w-auto lg:sticky lg:top-28"
                                >
                                    <CartSummary
                                        selectedCount={selectedIds.length}
                                        totalAmount={totalAmount}
                                        onCheckout={handleCheckout}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
