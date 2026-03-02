"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight, ShoppingBag, ArrowLeft, Trash2, Plus, Minus,
    Loader2, ShoppingCart, ShieldCheck, Truck, MessageSquare,
    CheckSquare, Square, Zap
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/store/Navbar";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import Breadcrumb from "@/components/store/Breadcrumb";
import ConfirmDialog from "@/components/store/ConfirmDialog";
import { ASSET_URL } from "@/config/config";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function CartPage() {
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
    const { refreshCart } = useCart();
    const router = useRouter();

    const fetchCart = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/cart");
            const data = await response.json();
            const items = data.items || [];
            setCartItems(items);
            setSelectedIds(items.map((i: any) => i.id));
        } catch (error) {
            toast.error("Gagal mengambil data keranjang");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const selectedItems = useMemo(() => {
        return cartItems.filter(item => selectedIds.includes(item.id));
    }, [cartItems, selectedIds]);

    const totalAmount = useMemo(() => {
        return selectedItems.reduce((acc, item) => acc + (Number(item.harga || 0) * Number(item.qty || 0)), 0);
    }, [selectedItems]);

    const toggleSelectAll = () => {
        if (selectedIds.length === cartItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(cartItems.map(i => i.id));
        }
    };

    const toggleSelectItem = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const updateQuantity = async (id: number, newQty: number, stock: number) => {
        if (newQty < 1) return;
        if (newQty > (stock || 999)) {
            toast.error(`Stok tidak mencukupi (Maks. ${stock})`);
            return;
        }

        const previousItems = [...cartItems];
        setCartItems(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));

        try {
            const response = await fetch(`/api/cart/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qty: newQty })
            });
            if (!response.ok) {
                throw new Error("Failed to update");
            }
            refreshCart();
        } catch (error) {
            setCartItems(previousItems);
            toast.error("Gagal update quantity");
        }
    };

    const updateNotes = useCallback(
        debounce(async (id: number, notes: string) => {
            try {
                const response = await fetch(`/api/cart/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notes })
                });
                if (response.ok) {
                    toast.success("Catatan disimpan", { duration: 1000 });
                }
            } catch (error) {
                toast.error("Gagal menyimpan catatan");
            }
        }, 1000),
        []
    );

    const handleNoteChange = (id: number, val: string) => {
        setCartItems(prev => prev.map(item => item.id === id ? { ...item, keterangan: val } : item));
        updateNotes(id, val);
    };

    const removeItem = async (id: number) => {
        try {
            const response = await fetch(`/api/cart/${id}`, {
                method: "DELETE"
            });
            if (response.ok) {
                setCartItems(prev => prev.filter(i => i.id !== id));
                setSelectedIds(prev => prev.filter(i => i !== id));
                refreshCart();
                toast.success("Produk dihapus");
            }
        } catch (error) {
            toast.error("Gagal menghapus produk");
        }
    };

    const removeAllItems = async () => {
        if (cartItems.length === 0) return;

        try {
            const response = await fetch("/api/cart", {
                method: "DELETE"
            });
            if (response.ok) {
                setCartItems([]);
                setSelectedIds([]);
                refreshCart();
                toast.success("Semua produk dihapus dari keranjang");
            }
        } catch (error) {
            toast.error("Gagal mengosongkan keranjang");
        }
    };

    const handleCheckout = () => {
        if (selectedIds.length === 0) {
            toast.error("Pilih minimal satu produk untuk checkout");
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
                                        {selectedIds.length === cartItems.length ? (
                                            <CheckSquare className="w-4 h-4 text-neutral-base-900" />
                                        ) : (
                                            <Square className="w-4 h-4 text-neutral-base-300 group-hover:text-neutral-base-900" />
                                        )}
                                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-neutral-base-900">
                                            {selectedIds.length === cartItems.length ? "Batalkan Pilihan" : "Pilih Semua"}
                                        </span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>{selectedIds.length === cartItems.length ? "Batalkan Pilihan" : "Pilih Semua"}</p>
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
                onConfirm={removeAllItems}
            />

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-20">
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
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border border-neutral-base-100 rounded-2xl md:rounded-[40px] p-8 md:p-20 flex flex-col items-center text-center max-w-2xl mx-auto shadow-sm"
                        >
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-neutral-base-50 flex items-center justify-center mb-6 md:mb-8">
                                <ShoppingCart className="w-8 h-8 md:w-10 md:h-10 text-neutral-base-200" />
                            </div>
                            <h2 className="font-serif text-[24px] md:text-[42px] text-neutral-base-900 mb-3 md:mb-4">Mulai Cerita Baru</h2>
                            <p className="text-neutral-base-400 font-bold text-[13px] md:text-[14px] leading-relaxed mb-8 md:mb-10 max-w-sm">
                                Temukan koleksi terbaik kami dan mulailah mengisi keranjang Anda dengan gaya yang mendefinisikan jati diri.
                            </p>
                            <Link
                                href="/products"
                                className="bg-neutral-base-900 text-white px-8 md:px-10 h-12 md:h-14 rounded-xl md:rounded-[16px] text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] flex items-center justify-center hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10 active:scale-95"
                            >
                                Jelajahi Produk
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col gap-6 md:gap-10">
                            <div className="flex flex-col lg:flex-row gap-6 md:gap-10 items-start">
                                {/* Product List */}
                                <div className="flex-1 w-full flex flex-col gap-3 md:gap-4 min-w-0">
                                    <AnimatePresence mode="popLayout">
                                        {cartItems.map((item) => (
                                            <motion.div
                                                layout
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`bg-white border rounded-xl md:rounded-[28px] p-3 md:p-6 shadow-sm group transition-all duration-300 relative overflow-hidden ${selectedIds.includes(item.id) ? "border-amber-800/10 shadow-md" : "border-neutral-base-100 opacity-80"}`}
                                            >
                                                <div className="flex items-start gap-3 md:gap-6">
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={() => toggleSelectItem(item.id)}
                                                        className="mt-1 shrink-0"
                                                    >
                                                        {selectedIds.includes(item.id) ? (
                                                            <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-amber-800" />
                                                        ) : (
                                                            <Square className="w-4 h-4 md:w-5 md:h-5 text-neutral-base-200" />
                                                        )}
                                                    </button>

                                                    {/* Image */}
                                                    <div className="w-24 h-32 md:w-32 md:h-40 bg-neutral-base-50 rounded-xl md:rounded-3xl overflow-hidden relative shrink-0 border border-neutral-base-100 shadow-sm group-hover:shadow-md transition-all">
                                                        <Image
                                                            src={item.gambar ? `${ASSET_URL}/img/produk/${item.gambar}` : "/placeholder-product.jpg"}
                                                            alt={item.namaProduk}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                            sizes="(max-width: 768px) 100px, 150px"
                                                        />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                        {/* Top row: name + delete */}
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex flex-col gap-1 min-w-0">
                                                                <h3 className="text-[14px] md:text-[17px] font-bold text-neutral-base-900 tracking-tight leading-snug wrap-break-word line-clamp-2">
                                                                    {item.namaProduk}
                                                                </h3>
                                                                {item.isFlashsale === 1 && (
                                                                    <div className="flex items-center gap-1.5 text-red-600 my-1">
                                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 border border-red-100 rounded-md">
                                                                            <Zap className="w-2.5 h-2.5 fill-red-600" />
                                                                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">Flash Sale</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-base-400 px-1.5 py-0.5 bg-neutral-base-50 rounded">
                                                                        {item.warnaName || item.warna}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-base-400 px-1.5 py-0.5 bg-neutral-base-50 rounded">
                                                                        {item.size}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => removeItem(item.id)}
                                                                        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-red-500 hover:text-red-800 hover:bg-red-50 transition-all shrink-0"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    <p className="text-[10px] font-bold">Hapus</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>

                                                        {/* Bottom row: qty + price */}
                                                        <div className="flex items-center justify-between gap-2 mt-2 md:mt-3">
                                                            <div className="flex items-center bg-neutral-base-50/50 border border-neutral-base-100 rounded-lg p-0.5 md:p-1 gap-0.5 md:gap-1">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.qty - 1, item.stock); }}
                                                                            disabled={item.qty <= 1}
                                                                            className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center hover:bg-white rounded-md transition-all disabled:opacity-30 active:scale-95"
                                                                        >
                                                                            <Minus className="w-2.5 h-2.5 md:w-3 md:h-3 text-neutral-base-600" />
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">
                                                                        <p className="text-[10px] font-bold">Kurangi</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <input
                                                                    type="number"
                                                                    value={item.qty}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 1;
                                                                        if (val > item.stock) {
                                                                            updateQuantity(item.id, item.stock, item.stock);
                                                                            toast.error(`Stok tidak mencukupi (Maks. ${item.stock})`);
                                                                        } else {
                                                                            updateQuantity(item.id, Math.max(1, val), item.stock);
                                                                        }
                                                                    }}
                                                                    className="w-7 md:w-8 bg-transparent text-center text-[11px] md:text-[12px] font-black text-neutral-base-900 tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.qty + 1, item.stock); }}
                                                                            disabled={item.qty >= item.stock}
                                                                            className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center hover:bg-white rounded-md transition-all disabled:opacity-30 active:scale-95"
                                                                        >
                                                                            <Plus className="w-2.5 h-2.5 md:w-3 md:h-3 text-neutral-base-600" />
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">
                                                                        <p className="text-[10px] font-bold">Tambah</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                            <span className="text-[13px] md:text-[16px] font-black text-neutral-base-900 tracking-tighter tabular-nums">
                                                                {formatPrice(Number(item.harga || 0) * Number(item.qty || 0))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Note Section */}
                                                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-neutral-base-50 flex items-center gap-2 md:gap-3">
                                                    <div className="shrink-0 p-1.5 md:p-2 bg-neutral-base-50 rounded-md md:rounded-lg">
                                                        <MessageSquare className="w-2.5 h-2.5 md:w-3 md:h-3 text-neutral-base-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.keterangan || ""}
                                                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                                        placeholder="Catatan khusus..."
                                                        className="flex-1 bg-transparent text-[11px] font-medium outline-none placeholder:text-neutral-base-300 min-w-0"
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Summary Sidebar */}
                                <aside className="w-full lg:w-[380px] lg:sticky lg:top-28 shrink-0">
                                    <div className="bg-white border border-neutral-base-100 rounded-xl md:rounded-[32px] p-5 md:p-8 shadow-xl shadow-neutral-base-400/5">
                                        <div className="flex items-center gap-3 mb-5 md:mb-8">
                                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-amber-50 flex items-center justify-center">
                                                <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-800" />
                                            </div>
                                            <h3 className="font-heading text-[20px] md:text-[24px] font-bold text-neutral-base-900 tracking-tight">Ringkasan</h3>
                                        </div>

                                        <div className="flex flex-col gap-4 md:gap-5 mb-5 md:mb-8">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-base-400 uppercase tracking-[0.2em]">
                                                <span>Subtotal ({selectedIds.length} item)</span>
                                                <span className="text-neutral-base-900 tabular-nums">{formatPrice(totalAmount)}</span>
                                            </div>
                                            <div className="h-px bg-neutral-base-50" />
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-base-900">Total Tagihan</span>
                                                    <span className="text-[22px] md:text-[28px] font-black text-neutral-base-900 tracking-tighter leading-none tabular-nums">
                                                        {formatPrice(totalAmount)}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] text-neutral-base-400 font-bold italic text-right">*Belum termasuk ongkir</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCheckout}
                                            disabled={selectedIds.length === 0}
                                            className="w-full bg-neutral-base-900 text-white h-14 md:h-16 rounded-xl md:rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            Checkout Sekarang
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>

                                        <div className="mt-6 pt-6 border-t border-neutral-base-50 flex items-center justify-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-base-400">Secure Payment</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-amber-600" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-base-400">Fast Delivery</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href="/products"
                                        className="mt-6 flex items-center justify-center gap-2 text-neutral-base-400 hover:text-neutral-base-900 transition-all"
                                    >
                                        <ArrowLeft className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Lanjut Belanja</span>
                                    </Link>
                                </aside>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
