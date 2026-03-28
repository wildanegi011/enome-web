"use client";

import React, { useState, useEffect } from "react";
import { m } from "framer-motion";
import { CheckSquare, Square, Zap, Minus, Plus, MessageSquare, Trash2 } from "lucide-react";
import FallbackImage from "@/components/store/shared/FallbackImage";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CartItem as CartItemType } from "@/lib/api/cart-api";
import { ASSET_URL } from "@/config/config";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";

interface CartItemProps {
    item: CartItemType;
    isSelected: boolean;
    onToggleSelect: (id: number) => void;
    onUpdateQuantity: (id: number, qty: number, stock: number) => void;
    onUpdateNotes: (id: number, notes: string) => void;
    onRemove: (id: number) => void;
}

export default function CartItem({
    item,
    isSelected,
    onToggleSelect,
    onUpdateQuantity,
    onUpdateNotes,
    onRemove
}: CartItemProps) {
    const isOffline = item.isOnline === 0;
    const [localNotes, setLocalNotes] = useState(item.keterangan || "");

    // Sync local state with item data (e.g., when refetching)
    useEffect(() => {
        setLocalNotes(item.keterangan || "");
    }, [item.keterangan]);

    const handleNotesBlur = () => {
        // Only trigger update if notes actually changed
        if (localNotes !== (item.keterangan || "")) {
            onUpdateNotes(item.id, localNotes);
        }
    };

    return (
        <m.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white border rounded-2xl md:rounded-[32px] p-3 md:p-4 shadow-sm group transition-all duration-300 relative overflow-hidden ${isSelected ? "border-amber-800/10 shadow-md bg-amber-50/5" : "border-neutral-base-100"}`}
        >
            <div className="flex items-start gap-3 md:gap-5">
                {/* Checkbox */}
                <button
                    onClick={() => onToggleSelect(item.id)}
                    disabled={isOffline}
                    className={`mt-6 xs:mt-8 md:mt-10 shrink-0 ${isOffline ? "cursor-not-allowed opacity-30" : ""}`}
                >
                    {isSelected ? (
                        <CheckSquare className="w-5 h-5 md:w-6 md:h-6 text-amber-800" />
                    ) : (
                        <Square className="w-5 h-5 md:w-6 md:h-6 text-neutral-base-200" />
                    )}
                </button>

                {/* Image */}
                <Link
                    href={`/products/${item.produkId}`}
                    className={`w-20 h-20 xs:w-24 xs:h-24 md:w-32 md:h-32 bg-neutral-base-50 rounded-xl md:rounded-3xl overflow-hidden relative shrink-0 border border-neutral-base-100 shadow-sm group-hover:shadow-md transition-all ${isOffline ? "opacity-40 grayscale-[0.5] pointer-events-none" : "hover:border-amber-800/20"}`}
                >
                    <FallbackImage
                        src={item.gambar ? `${ASSET_URL}/img/${item.gambar}` : "/placeholder-product.jpg"}
                        alt={item.namaProduk}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 768px) 80px, 150px"
                    />
                </Link>

                {/* Info */}
                <div className={`flex-1 min-w-0 flex flex-col pt-0.5 ${isOffline ? "opacity-60" : ""}`}>
                    {/* Offline Badge */}
                    {isOffline && (
                        <div className="mb-1.5">
                            <span className="inline-flex px-1.5 py-0.5 bg-red-50 text-red-600 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded border border-red-100 shadow-sm">
                                Barang tidak tersedia
                            </span>
                        </div>
                    )}

                    {/* Top row: name */}
                    <div className="flex items-start justify-between gap-2 md:gap-4 mb-1.5">
                        <div className="flex flex-col gap-1 md:gap-1.5 min-w-0">
                            <Link
                                href={`/products/${item.produkId}`}
                                className={cn(
                                    "block group/title",
                                    isOffline && "pointer-events-none"
                                )}
                            >
                                <h3 className="text-[14px] md:text-[16px] font-bold text-neutral-base-900 tracking-tight leading-snug wrap-break-word line-clamp-2 pr-6 md:pr-8 group-hover/title:text-amber-900 transition-colors">
                                    {item.namaProduk}
                                </h3>
                            </Link>

                            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap mt-0.5">
                                {item.isFlashsale === 1 && (
                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 border rounded ${item.isFlashsaleExpired === 1 ? "bg-neutral-base-50 border-neutral-base-100" : "bg-red-50 border-red-100"}`}>
                                        <Zap className={`w-2 h-2 md:w-2.5 md:h-2.5 ${item.isFlashsaleExpired === 1 ? "fill-neutral-base-400 text-neutral-base-400" : "fill-red-600 text-red-600"}`} />
                                        <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest leading-none ${item.isFlashsaleExpired === 1 ? "text-neutral-base-400" : "text-red-600"}`}>
                                            {item.isFlashsaleExpired === 1 ? "Promo Berakhir" : "Flash Sales"}
                                        </span>
                                    </div>
                                )}
                                {item.isHighlighted === 1 && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 border border-indigo-100 bg-indigo-50 rounded">
                                        <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest leading-none text-indigo-600">
                                            Spesial
                                        </span>
                                    </div>
                                )}
                                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-neutral-base-400 px-1.5 md:px-2 py-1 bg-neutral-base-50 border border-neutral-base-100 rounded-full leading-none">
                                    {item.warnaName || item.warna}
                                </span>
                                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-neutral-base-400 px-1.5 md:px-2 py-1 bg-neutral-base-50 border border-neutral-base-100 rounded-full leading-none">
                                    {item.size}
                                </span>
                            </div>

                            {item.isPriceChanged && (
                                <div className="mt-1 flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200/50 rounded-md w-fit">
                                    <span className="text-[10px] md:text-[11px] font-medium text-amber-700">
                                        ⚠️ Harga telah diperbarui
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom row: qty control + price */}
                    <div className="mt-2 md:mt-3 flex flex-row items-center justify-between gap-2 border-t border-neutral-base-50/50 pt-2.5 md:pt-0 md:border-t-0">
                        <div className="flex items-center gap-2 relative z-10">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-base-300 hidden sm:inline">Qty</span>
                            <div className="flex items-center bg-white border border-neutral-base-100 rounded-lg md:rounded-xl p-0.5 md:p-1 gap-1 md:gap-1.5 shadow-sm w-fit">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, Number(item.qty) - 1, item.stock || 99); }}
                                    disabled={Number(item.qty) <= 1 || isOffline}
                                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center hover:bg-neutral-base-50 rounded-lg transition-all disabled:opacity-30 active:scale-90"
                                >
                                    <Minus className="w-3 h-3 md:w-4 md:h-4 text-neutral-base-600" />
                                </button>
                                <input
                                    type="number"
                                    value={item.qty}
                                    readOnly={isOffline}
                                    onChange={(e) => {
                                        if (isOffline) return;
                                        const val = parseInt(e.target.value) || 1;
                                        onUpdateQuantity(item.id, val, item.stock || 99);
                                    }}
                                    className={`w-8 md:w-11 bg-transparent text-center text-[14px] md:text-[16px] font-black text-neutral-base-900 tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isOffline ? "text-neutral-base-300" : ""}`}
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, Number(item.qty) + 1, item.stock || 99); }}
                                    disabled={Number(item.qty) >= (item.stock || 99) || isOffline}
                                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center hover:bg-neutral-base-50 rounded-lg transition-all disabled:opacity-30 active:scale-90"
                                >
                                    <Plus className="w-3 h-3 md:w-4 md:h-4 text-neutral-base-600" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-0.5">
                            <span className={`text-[18px] md:text-[24px] font-medium text-neutral-base-900 tracking-tighter tabular-nums leading-none ${isOffline ? "text-neutral-base-300 line-through" : ""}`}>
                                {formatCurrency(Number(item.harga || 0) * Number(item.qty || 0))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Note Section */}
            {!isOffline && (
                <div className="mt-3 pt-2.5 border-t border-neutral-base-50/50 flex items-center gap-2.5">
                    <div className="shrink-0 p-1.5 bg-neutral-base-50 rounded-lg">
                        <MessageSquare className="w-3 h-3 text-neutral-base-400" />
                    </div>
                    <input
                        type="text"
                        value={localNotes}
                        onChange={(e) => setLocalNotes(e.target.value)}
                        onBlur={handleNotesBlur}
                        placeholder="Tambahkan catatan..."
                        className="flex-1 bg-transparent text-[11px] md:text-[12px] font-medium outline-none placeholder:text-neutral-base-300 min-w-0"
                    />
                </div>
            )}

            {/* Absolute Delete Button - Integrated better */}
            <div className="absolute top-2.5 right-2.5 pointer-events-none">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => onRemove(item.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-base-400 bg-neutral-base-50/50 border border-neutral-base-100 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all z-20 pointer-events-auto"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p className="text-[10px] font-bold">Hapus Produk</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </m.div>
    );
}
