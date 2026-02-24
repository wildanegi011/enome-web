"use client";

import Image from "next/image";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { ASSET_URL } from "@/config/config";

interface CartItem {
    id: number;
    produkId: string;
    namaProduk: string;
    gambar: string;
    warnaName?: string;
    warnaId?: string;
    size: string;
    harga: number;
    qty: number;
    stock: number;
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
        <section className="flex flex-col gap-6 bg-white border border-neutral-base-100 p-6 md:p-8 rounded-[32px] shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-base-50 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center font-black text-amber-800 text-[18px]">1</div>
                    <h2 className="text-[16px] font-black uppercase tracking-[0.15em] text-neutral-base-900">
                        Review Keranjang
                    </h2>
                </div>
                <span className="text-[10px] font-black text-neutral-base-300 uppercase tracking-widest bg-neutral-base-50 px-3 py-1 rounded-full border border-neutral-base-100">{items.length} Items</span>
            </div>

            {isLoading ? (
                <div className="py-12 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-base-200" />
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white border border-neutral-base-100 p-8 rounded-2xl text-center shadow-sm">
                    <p className="text-neutral-base-400 text-sm">Keranjang Anda kosong.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="group bg-white border border-neutral-base-100 p-4 md:p-5 rounded-[24px] flex items-center gap-5 hover:shadow-md transition-all duration-300">
                            <div className="w-20 h-24 bg-neutral-base-50 rounded-2xl overflow-hidden relative shrink-0 border border-neutral-base-100 shadow-inner">
                                <Image
                                    src={item.gambar ? `${ASSET_URL}/img/produk/${item.gambar}` : "/placeholder-product.jpg"}
                                    alt={item.namaProduk}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="80px"
                                />
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                                <h4 className="text-[15px] font-bold text-neutral-base-900 tracking-tight leading-tight">{item.namaProduk}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-base-400 px-2 py-0.5 bg-neutral-base-50 rounded-md border border-neutral-base-100">
                                        {item.warnaName || item.warnaId}
                                    </span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-base-400 px-2 py-0.5 bg-neutral-base-50 rounded-md border border-neutral-base-100">
                                        Size {item.size}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.qty, -1, item.stock)}
                                            className="w-6 h-6 flex items-center justify-center border border-neutral-base-100 rounded-full text-neutral-base-400 hover:text-neutral-base-900"
                                            disabled={item.qty <= 1}
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <input
                                            type="number"
                                            value={item.qty}
                                            readOnly
                                            className="text-[12px] font-black w-8 text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                            onClick={() => updateQuantity(item.id, item.qty, 1, item.stock)}
                                            className="w-6 h-6 flex items-center justify-center border border-neutral-base-100 rounded-full text-neutral-base-400 hover:text-neutral-base-900 disabled:opacity-30"
                                            disabled={item.qty >= (item.stock || 999)}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <p className="text-[14px] font-black text-neutral-base-900">{formatPrice(item.harga * item.qty)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeItem(item.id)}
                                className="p-2 text-neutral-base-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
