"use client";

import Image from "next/image";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { ASSET_URL } from "@/config/config";
import { cn } from "@/lib/utils";

interface CartItem {
    id: number;
    produkId: string;
    namaProduk: string;
    gambar: string;
    warnaName?: string;
    warna?: string;
    size: string;
    harga: number;
    qty: number;
    stock: number;
    isOnline?: number;
}

interface CartReviewProps {
    items: CartItem[];
    isLoading: boolean;
    updateQuantity: (id: number, currentQty: number, delta: number, stock: number) => Promise<void>;
    removeItem: (id: number) => Promise<void>;
    formatPrice: (price: number) => string;
}

export default function CartReview({ items, isLoading, updateQuantity, removeItem, formatPrice }: CartReviewProps) {
    return (
        <section className="flex flex-col gap-4 md:gap-6 bg-white border border-neutral-base-100 p-4 md:p-8 rounded-xl md:rounded-[32px] shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-base-50 pb-4 md:pb-6">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center font-black text-amber-800 text-[14px] md:text-[18px]">1</div>
                    <h2 className="text-[13px] md:text-[16px] font-black uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900">
                        Review Keranjang
                    </h2>
                </div>
                <span className="text-[9px] md:text-[10px] font-black text-neutral-base-300 uppercase tracking-widest bg-neutral-base-50 px-2 md:px-3 py-1 rounded-full border border-neutral-base-100">{items.length} Items</span>
            </div>

            {isLoading ? (
                <div className="py-8 md:py-12 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-base-200" />
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white border border-neutral-base-100 p-6 md:p-8 rounded-xl md:rounded-2xl text-center shadow-sm">
                    <p className="text-neutral-base-400 text-sm">Keranjang Anda kosong.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3 md:gap-4">
                    {items.map((item) => {
                        const isOffline = item.isOnline === 0;
                        const isStockInsufficient = (item.stock || 0) < item.qty;

                        return (
                            <div key={item.id} className={cn(
                                "group bg-white border p-3 md:p-5 rounded-xl md:rounded-[24px] flex items-start gap-3 md:gap-5 hover:shadow-md transition-all duration-300",
                                isOffline ? "opacity-60 grayscale-[0.5] border-neutral-base-100" :
                                    isStockInsufficient ? "border-red-100 bg-red-50/10 shadow-sm" : "border-neutral-base-100"
                            )}>
                                <div className="w-16 h-20 md:w-20 md:h-24 bg-neutral-base-50 rounded-lg md:rounded-2xl overflow-hidden relative shrink-0 border border-neutral-base-100">
                                    <Image
                                        src={item.gambar ? `${ASSET_URL}/img/produk/${item.gambar}` : "/placeholder-product.jpg"}
                                        alt={item.namaProduk}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="80px"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className={cn(
                                            "text-[13px] md:text-[15px] font-bold text-neutral-base-900 tracking-tight leading-tight truncate",
                                            isOffline && "line-through text-neutral-base-400"
                                        )}>
                                            {item.namaProduk}
                                        </h4>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-1.5 text-neutral-base-300 hover:text-red-500 transition-colors shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-neutral-base-400 px-1.5 md:px-2 py-0.5 bg-neutral-base-50 rounded border border-neutral-base-100">
                                            {item.warnaName || item.warna}
                                        </span>
                                        <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-neutral-base-400 px-1.5 md:px-2 py-0.5 bg-neutral-base-50 rounded border border-neutral-base-100">
                                            Size {item.size}
                                        </span>
                                        {isOffline && (
                                            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white px-1.5 md:px-2 py-0.5 bg-red-500 rounded border border-red-600 animate-pulse">
                                                Offline
                                            </span>
                                        )}
                                    </div>

                                    {!isOffline && isStockInsufficient && (
                                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-red-50 border border-red-100 p-2 md:p-3 rounded-lg md:rounded-2xl">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                                                <p className="text-[10px] md:text-[11px] font-bold text-red-700 leading-none">
                                                    Stok tidak cukup (Sisa: <span className="underline">{item.stock || 0}</span>)
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.qty, (item.stock || 0) - item.qty, item.stock)}
                                                className="text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-white text-red-600 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 text-center whitespace-nowrap"
                                            >
                                                Sesuaikan Stok
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.qty, -1, item.stock)}
                                                className="w-6 h-6 flex items-center justify-center border border-neutral-base-100 rounded-full text-neutral-base-400 hover:text-neutral-base-900 disabled:opacity-30"
                                                disabled={item.qty <= 1 || isOffline}
                                            >
                                                <Minus className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                            </button>
                                            <input
                                                type="number"
                                                value={item.qty}
                                                readOnly
                                                className={cn(
                                                    "text-[11px] md:text-[12px] font-black w-7 md:w-8 text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                    isOffline && "text-neutral-base-300"
                                                )}
                                            />
                                            <button
                                                onClick={() => updateQuantity(item.id, item.qty, 1, item.stock)}
                                                className="w-6 h-6 flex items-center justify-center border border-neutral-base-100 rounded-full text-neutral-base-400 hover:text-neutral-base-900 disabled:opacity-30"
                                                disabled={item.qty >= (item.stock || 0) || isOffline}
                                            >
                                                <Plus className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                            </button>
                                        </div>
                                        <p className={cn(
                                            "text-[13px] md:text-[14px] font-black text-neutral-base-900 tabular-nums",
                                            isOffline && "text-neutral-base-300"
                                        )}>{formatPrice(item.harga * item.qty)}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
