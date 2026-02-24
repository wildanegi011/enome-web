"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight, ShoppingBag, ArrowLeft, Trash2, Plus, Minus,
    Loader2, ShoppingCart, ShieldCheck, Truck, MessageSquare,
    CheckSquare, Square
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/store/Navbar";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { ASSET_URL } from "@/config/config";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";

export default function CartPage() {
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { refreshCart } = useCart();
    const router = useRouter();

    const fetchCart = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/cart");
            const data = await response.json();
            const items = data.items || [];
            setCartItems(items);
            // Default select all on first load
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

        // Optimistic Update
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
        <div className="min-h-screen bg-[#FDFDFD] text-neutral-base-900 font-sans selection:bg-amber-100 selection:text-amber-900">
            <Navbar />

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-16">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[500px] gap-6"
                        >
                            <Loader2 className="w-10 h-10 animate-spin text-amber-800/20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-base-400">Syncing Selection...</p>
                        </motion.div>
                    ) : cartItems.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border border-neutral-base-100 rounded-[40px] p-12 md:p-20 flex flex-col items-center text-center max-w-2xl mx-auto shadow-sm"
                        >
                            <div className="w-24 h-24 rounded-full bg-neutral-base-50 flex items-center justify-center mb-8 relative">
                                <ShoppingCart className="w-10 h-10 text-neutral-base-200" />
                            </div>
                            <h2 className="font-serif text-[32px] md:text-[42px] text-neutral-base-900 mb-4">Mulai Cerita Baru</h2>
                            <p className="text-neutral-base-400 font-bold text-[14px] leading-relaxed mb-10 max-w-sm">
                                Temukan koleksi terbaik kami dan mulailah mengisi keranjang Anda dengan gaya yang mendefinisikan jati diri.
                            </p>
                            <Link
                                href="/products"
                                className="bg-neutral-base-900 text-white px-10 h-14 rounded-[16px] text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10 active:scale-95"
                            >
                                Jelajahi Produk
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col gap-10">
                            {/* Compact Header Section */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-base-100">
                                <div className="flex flex-col gap-3">
                                    <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-base-400">
                                        <Link href="/" className="hover:text-amber-800 transition-colors">Home</Link>
                                        <ChevronRight className="w-2 h-2" />
                                        <span className="text-neutral-base-900">Keranjang Belanja</span>
                                    </nav>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-neutral-base-100 shadow-sm hover:border-amber-800/20 transition-all group"
                                    >
                                        {selectedIds.length === cartItems.length ? (
                                            <CheckSquare className="w-4 h-4 text-amber-800" />
                                        ) : (
                                            <Square className="w-4 h-4 text-neutral-base-300 group-hover:text-neutral-base-900" />
                                        )}
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-base-900">
                                            {selectedIds.length === cartItems.length ? "Batalkan Pilihan" : "Pilih Semua"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-10 items-start">
                                {/* Product List - More Compact */}
                                <div className="flex-1 w-full flex flex-col gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {cartItems.map((item) => (
                                            <motion.div
                                                layout
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`bg-white border rounded-[28px] p-4 md:p-6 shadow-sm group transition-all duration-300 relative overflow-hidden flex flex-col gap-4 ${selectedIds.includes(item.id) ? "border-amber-800/10 shadow-md" : "border-neutral-base-100 opacity-80"}`}
                                            >
                                                <div className="flex items-start gap-4 md:gap-6">
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={() => toggleSelectItem(item.id)}
                                                        className="mt-1 md:mt-2 shrink-0 group-hover:scale-110 transition-transform"
                                                    >
                                                        {selectedIds.includes(item.id) ? (
                                                            <CheckSquare className="w-5 h-5 text-amber-800" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-neutral-base-200" />
                                                        )}
                                                    </button>

                                                    {/* Image - Smaller */}
                                                    <div className="relative w-24 h-24 md:w-28 md:h-28 overflow-hidden rounded-xl bg-neutral-base-50 border border-neutral-base-100 shrink-0 shadow-inner">
                                                        <Image
                                                            src={`${ASSET_URL}/img/produk/${item.gambar}`}
                                                            alt={item.produkId}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0 flex flex-col h-24 md:h-28 justify-between py-1">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex flex-col gap-1.5 min-w-0">
                                                                <h3 className="text-[14px] md:text-[16px] font-black text-neutral-base-900 tracking-tight leading-tight truncate">
                                                                    {item.produkId}
                                                                </h3>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-base-400 px-2 py-0.5 bg-neutral-base-50 rounded-md">
                                                                        {item.warnaName || item.warnaId}
                                                                    </span>
                                                                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-base-400 px-2 py-0.5 bg-neutral-base-50 rounded-md">
                                                                        Size: {item.size}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-base-200 hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center bg-neutral-base-50/50 border border-neutral-base-100 rounded-xl p-1 gap-1">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.qty - 1, item.stock); }}
                                                                    disabled={item.qty <= 1}
                                                                    className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent active:scale-95"
                                                                >
                                                                    <Minus className="w-3 h-3 text-neutral-base-600" />
                                                                </button>
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
                                                                    className="w-8 bg-transparent text-center text-[12px] font-black text-neutral-base-900 tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.qty + 1, item.stock); }}
                                                                    disabled={item.qty >= item.stock}
                                                                    className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent active:scale-95"
                                                                >
                                                                    <Plus className="w-3 h-3 text-neutral-base-600" />
                                                                </button>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[16px] font-black text-neutral-base-900 tracking-tighter">
                                                                    {formatPrice(Number(item.harga || 0) * Number(item.qty || 0))}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Compact Note Section */}
                                                <div className="pt-4 border-t border-neutral-base-50 flex items-center gap-3">
                                                    <div className="shrink-0 p-2 bg-neutral-base-50 rounded-lg">
                                                        <MessageSquare className="w-3 h-3 text-neutral-base-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.keterangan || ""}
                                                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                                        placeholder="Tambahkan catatan khusus item ini..."
                                                        className="flex-1 bg-transparent text-[11px] font-medium outline-none placeholder:text-neutral-base-300"
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Compact Summary Sidebar */}
                                <aside className="w-full lg:w-[400px] lg:sticky lg:top-28 shrink-0">
                                    <div className="bg-white border border-neutral-base-100 rounded-[32px] p-8 shadow-xl shadow-neutral-base-400/5">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                                                <ShoppingBag className="w-4 h-4 text-amber-800" />
                                            </div>
                                            <h3 className="font-serif text-[24px] text-neutral-base-900 tracking-tight">Ringkasan</h3>
                                        </div>

                                        <div className="flex flex-col gap-5 mb-8">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-base-400 uppercase tracking-[0.2em]">
                                                <span>Subtotal ({selectedIds.length} item)</span>
                                                <span className="text-neutral-base-900 tabular-nums">{formatPrice(totalAmount)}</span>
                                            </div>
                                            {/* <div className="flex justify-between items-center text-[10px] font-bold text-neutral-base-400 uppercase tracking-[0.2em]">
                                                <span>Estimated Tax</span>
                                                <span className="text-emerald-600">Included</span>
                                            </div> */}
                                            <div className="h-px bg-neutral-base-50" />
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-base-900">Total Tagihan</span>
                                                    <span className="text-[28px] font-black text-neutral-base-900 tracking-tighter leading-none tabular-nums">
                                                        {formatPrice(totalAmount)}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] text-neutral-base-400 font-bold italic text-right">*Belum termasuk ongkir</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={handleCheckout}
                                                disabled={selectedIds.length === 0}
                                                className="w-full bg-neutral-base-900 text-white h-16 rounded-[20px] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10 active:scale-[0.98] group disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                            >
                                                Checkout Sekarang
                                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </button>

                                            <Link href="/products" className="flex items-center justify-center gap-2 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-neutral-base-300 hover:text-neutral-base-900 transition-all">
                                                <ArrowLeft className="w-3.5 h-3.5" />
                                                Lanjut Belanja
                                            </Link>
                                        </div>

                                    </div>
                                </aside>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
