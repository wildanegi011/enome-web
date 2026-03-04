"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight, ShoppingBag, ArrowLeft, Trash2,
    Loader2, ShoppingCart, ShieldCheck, Truck,
    CheckSquare, Square
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/store/layout/Navbar";
import { toast } from "sonner";
import Breadcrumb from "@/components/store/shared/Breadcrumb";
import ConfirmDialog from "@/components/store/shared/ConfirmDialog";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCartItems } from "@/hooks/use-cart-items";
import CartList from "@/components/store/cart/CartList";
import CartSummary from "@/components/store/cart/CartSummary";
import EmptyState from "@/components/store/shared/EmptyState";

export default function CartPage() {
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-white text-neutral-base-900 font-sans selection:bg-amber-100 selection:text-amber-900">
            <Navbar />

            {/* Sticky Header with Breadcrumb and Actions */}
            <div className="sticky top-[70px] md:top-[80px] z-30 bg-white/95 backdrop-blur-md border-b border-neutral-base-50">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-4 md:py-6 flex items-center justify-between gap-4">
                    <Breadcrumb
                        className="truncate min-w-0"
                        items={[
                            { label: "Beranda", href: "/" },
                            { label: "Keranjang" }
                        ]}
                    />

                    {!isLoading && cartItems.length > 0 && (
                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={toggleSelectAll}
                                        className="flex items-center gap-2 bg-white px-3 md:px-4 py-2 rounded-lg border border-neutral-base-100 shadow-sm hover:border-neutral-base-300 transition-all group"
                                    >
                                        {selectedIds.length === cartItems.filter(i => i.isOnline !== 0).length && cartItems.filter(i => i.isOnline !== 0).length > 0 ? (
                                            <CheckSquare className="w-4 h-4 text-neutral-base-900" />
                                        ) : (
                                            <Square className="w-4 h-4 text-neutral-base-300 group-hover:text-neutral-base-900" />
                                        )}
                                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-neutral-base-900">
                                            {selectedIds.length === cartItems.filter(i => i.isOnline !== 0).length && cartItems.filter(i => i.isOnline !== 0).length > 0 ? "Batalkan Pilihan" : "Pilih Semua"}
                                        </span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>{selectedIds.length === cartItems.filter(i => i.isOnline !== 0).length && cartItems.filter(i => i.isOnline !== 0).length > 0 ? "Batalkan Pilihan" : "Pilih Semua"}</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setIsConfirmDeleteAllOpen(true)}
                                        className="flex items-center gap-2 bg-white px-3 md:px-4 py-2 rounded-lg border border-red-100 shadow-sm hover:bg-red-50 hover:border-red-200 transition-all group"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-red-600">
                                            Hapus Semua
                                        </span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>Hapus Semua</p>
                                </TooltipContent>
                            </Tooltip>
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

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-16 pb-28 md:pb-16">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] gap-6"
                        >
                            <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-amber-800/20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-base-400">Syncing Selection...</p>
                        </motion.div>
                    ) : cartItems.length === 0 ? (
                        <div className="max-w-2xl mx-auto">
                            <EmptyState
                                icon={ShoppingCart}
                                title="Mulai Cerita Baru"
                                description="Temukan koleksi terbaik kami dan mulailah mengisi keranjang Anda dengan gaya yang mendefinisikan jati diri."
                                actionLabel="Jelajahi Produk"
                                actionHref="/products"
                                className="md:rounded-[40px]"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 md:gap-10">
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

                            <Link
                                href="/products"
                                className="mt-6 flex items-center justify-center gap-2 text-neutral-base-400 hover:text-neutral-base-900 transition-all"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Lanjut Belanja</span>
                            </Link>
                        </div>
                    )}
                </AnimatePresence>
            </main>

            {/* Mobile Sticky Footer */}
            <AnimatePresence>
                {!isLoading && cartItems.length > 0 && !isSummaryInView && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-base-100 p-4 pb-safe-offset-4 lg:hidden"
                    >
                        <CartSummary
                            selectedCount={selectedIds.length}
                            totalAmount={totalAmount}
                            onCheckout={handleCheckout}
                            isMobileFooter={true}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
