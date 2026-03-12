"use client";

import React, { useState, useEffect } from "react";
import FallbackImage from "@/components/store/shared/FallbackImage";
import { Minus, Plus, Trash2, Zap, MessageSquare } from "lucide-react";
import { ASSET_URL } from "@/config/config";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

export interface OrderItemType {
    id: number;
    produkId: string;
    namaProduk: string;
    gambar: string;
    warnaName?: string;
    warna?: string;
    size: string;
    harga: number;
    qty: number;
    stock?: number; // This is already optional, so no change needed here.
    isOnline?: number;
    isFlashsale?: number;
    isFlashsaleExpired?: number;
    keterangan?: string;
    variant?: string;
}

interface OrderItemProps {
    item: OrderItemType;
    variant?: "cart" | "checkout";
    isSelected?: boolean;
    onToggleSelect?: (id: number) => void;
    onUpdateQuantity: (id: number, qty: number, stock: number) => void;
    onUpdateNotes?: (id: number, notes: string) => void;
    onRemove: (id: number) => void;
}

export default function OrderItem({
    item,
    variant = "cart",
    isSelected,
    onToggleSelect,
    onUpdateQuantity,
    onUpdateNotes,
    onRemove
}: OrderItemProps) {
    const isOffline = item.isOnline === 0 || item.stock === 0;
    const isStockInsufficient = (item.stock || 0) < item.qty && item.stock !== 0;

    const [localNotes, setLocalNotes] = useState(item.keterangan || "");

    // Sync local state with item data (e.g., when refetching)
    useEffect(() => {
        setLocalNotes(item.keterangan || "");
    }, [item.keterangan]);

    const handleNotesBlur = () => {
        // Only trigger update if notes actually changed
        if (onUpdateNotes && localNotes !== (item.keterangan || "")) {
            onUpdateNotes(item.id, localNotes);
        }
    };

    // Cart-specific logic
    const showCheckbox = variant === "cart" && onToggleSelect;
    const showNotes = onUpdateNotes && !isOffline;

    // Checkout-specific logic
    const isCheckout = variant === "checkout";

    return (
        <div
            key={item.id}
            className={cn(
                "flex items-start gap-3 md:gap-5 group relative transition-all duration-500 rounded-[24px] md:rounded-[30px]",
                isCheckout ? "p-3 md:p-4" : "p-4 md:p-6 bg-white border border-neutral-base-100 hover:border-neutral-base-900 shadow-sm hover:shadow-xl hover:shadow-neutral-base-900/5",
                (isOffline || isStockInsufficient) && "border-red-100 bg-red-50/10 ring-1 ring-red-100/50"
            )}
        >
            {/* 1. Checkbox (Cart Only) */}
            {showCheckbox && (
                <button
                    onClick={() => onToggleSelect && onToggleSelect(item.id)}
                    disabled={isOffline}
                    className={cn(
                        "mt-8 md:mt-10 shrink-0",
                        isOffline && "cursor-not-allowed opacity-30"
                    )}
                >
                    <div className={cn(
                        "w-5 h-5 md:w-6 md:h-6 rounded border flex items-center justify-center transition-colors",
                        isSelected
                            ? "bg-amber-800 border-amber-800 text-white"
                            : "bg-white border-neutral-base-200 text-transparent"
                    )}>
                        <svg className="w-3.5 md:w-4 h-3.5 md:h-4 fill-none stroke-current stroke-3" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                </button>
            )}

            {/* 2. Product Image */}
            <div className={cn(
                "bg-neutral-base-50 overflow-hidden relative shrink-0 border border-neutral-base-100 shadow-sm rounded-xl md:rounded-2xl transition-all",
                isCheckout ? "w-16 h-20 md:w-20 md:h-24" : "w-18 h-18 md:w-32 md:h-32",
                isOffline && "opacity-40 grayscale-[0.5]"
            )}>
                <FallbackImage
                    src={item.gambar ? `${ASSET_URL}/img/${item.gambar}` : "/placeholder-product.jpg"}
                    alt={item.namaProduk}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 80px, 150px"
                />


            </div>

            {/* 3. Info Section */}
            <div className={cn(
                "flex-1 min-w-0 flex flex-col self-stretch",
                isOffline && "opacity-60"
            )}>
                {/* TOP ROW: Title & Trash */}
                <div className="flex items-start justify-between gap-2 md:gap-3">
                    <div className="min-w-0 flex-1">
                        <h3 className={cn(
                            "font-bold text-neutral-base-900 tracking-tight leading-snug wrap-break-word",
                            isCheckout ? "text-[13px] md:text-[15px] line-clamp-1" : "text-[14px] md:text-[18px] line-clamp-2",
                            isOffline && "line-through text-neutral-base-400"
                        )}>
                            {item.namaProduk}
                        </h3>

                        {/* Flash Sale Badge */}
                        {item.isFlashsale === 1 && (
                            <div className={cn(
                                "mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 border rounded transition-colors",
                                item.isFlashsaleExpired === 1
                                    ? "bg-neutral-base-50 border-neutral-base-100 text-neutral-base-400"
                                    : "bg-red-50 border-red-100 text-red-600"
                            )}>
                                <Zap className={cn(
                                    "w-2 md:w-2.5 h-2 md:h-2.5",
                                    item.isFlashsaleExpired === 1 ? "fill-neutral-base-400" : "fill-red-600"
                                )} />
                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest leading-none">
                                    {item.isFlashsaleExpired === 1 ? "Promo Berakhir" : "Flash Sale"}
                                </span>
                            </div>
                        )}
                    </div>

                    {!isCheckout && (
                        <button
                            onClick={() => onRemove(item.id)}
                            className="p-1 text-neutral-base-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    )}
                    {isCheckout && (
                        <button
                            onClick={() => onRemove(item.id)}
                            className="p-2 md:p-2.5 text-neutral-base-300 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all shrink-0 -mt-1 -mr-1"
                        >
                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    )}
                </div>

                {/* MIDDLE ROW: Attributes & Status */}
                <div className="flex flex-col gap-0.5 mt-0.5 md:mt-1">
                    <p className="text-[10px] md:text-[13px] font-medium text-neutral-base-400 flex flex-wrap items-center gap-1.5">
                        {item.variant && (
                            <>
                                <span className="truncate">Motif: <span className="text-neutral-base-900 font-bold">{item.variant}</span></span>
                                <span className="w-px h-2.5 bg-neutral-base-100" />
                            </>
                        )}
                        <span className="truncate">Ukuran: <span className="text-neutral-base-900 font-bold">{item.size}</span></span>
                        <span className="w-px h-2.5 bg-neutral-base-100" />
                        <span className="truncate">Warna: <span className="text-neutral-base-900 font-bold">{item.warnaName || item.warna}</span></span>
                    </p>

                    {/* Status Badges (Stock / Offline) */}
                    {(isOffline || isStockInsufficient) && (
                        <div className="flex flex-wrap gap-1 items-center mt-1">
                            {isOffline ? (
                                <span className="px-1 py-0.5 bg-red-50 text-red-600 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded border border-red-100">
                                    {item.isOnline === 0 ? "Tidak Tersedia" : "Stok Habis"}
                                </span>
                            ) : isStockInsufficient && (
                                <div className="flex items-center gap-1">
                                    <span className="px-1 py-0.5 bg-red-50 text-red-600 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded border border-red-100">
                                        Stok: {item.stock}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, item.stock ?? 1, item.stock ?? 1); }}
                                        className="text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-white text-neutral-base-900 px-2 py-1 rounded border border-neutral-base-200 hover:bg-neutral-base-900 hover:text-white transition-all shadow-sm"
                                    >
                                        Sesuaikan
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* BOTTOM ROW: Qty & Price */}
                <div className="mt-auto pt-2 flex items-end justify-between">
                    {/* Qty Controls */}
                    <div className="flex items-center bg-white border border-neutral-base-200 shadow-sm rounded-lg p-0.5 gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, Number(item.qty) - 1, item.stock ?? 99); }}
                            disabled={Number(item.qty) <= 1 || isOffline}
                            className="w-5.5 h-5.5 md:w-8 md:h-8 flex items-center justify-center hover:bg-neutral-base-50 rounded-md transition-all disabled:opacity-30 active:scale-90"
                        >
                            <Minus className="w-2.5 h-2.5 md:w-4 md:h-4 text-neutral-base-600" />
                        </button>
                        <input
                            type="number"
                            value={item.qty}
                            readOnly
                            className="w-5 md:w-8 bg-transparent text-center font-black text-neutral-base-900 tabular-nums text-[11px] md:text-[14px] outline-none"
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, Number(item.qty) + 1, item.stock ?? 99); }}
                            disabled={Number(item.qty) >= (item.stock || 99) || isOffline}
                            className="w-5.5 h-5.5 md:w-8 md:h-8 flex items-center justify-center hover:bg-neutral-base-50 rounded-md transition-all disabled:opacity-30 active:scale-90"
                        >
                            <Plus className="w-2.5 h-2.5 md:w-4 md:h-4 text-neutral-base-600" />
                        </button>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col items-end">
                        <span className={cn(
                            "font-medium text-neutral-base-900 tracking-tighter tabular-nums leading-none",
                            isCheckout ? "text-[15px] md:text-[20px]" : "text-[16px] md:text-[24px]",
                            isOffline && "text-neutral-base-300 line-through"
                        )}>
                            {formatCurrency(Number(item.harga || 0) * Number(item.qty || 0))}
                        </span>
                    </div>
                </div>

                {/* Note Section */}
                {showNotes && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 pt-4 border-t border-dashed border-neutral-base-100 flex flex-col gap-2"
                    >
                        <div className="flex items-center gap-2 px-1">
                            <div className="shrink-0 p-1 bg-amber-50 rounded-md">
                                <MessageSquare className="w-2.5 h-2.5 text-amber-600" />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-base-400">
                                Catatan Item
                            </span>
                        </div>
                        <div className="relative group/note">
                            <input
                                type="text"
                                value={localNotes}
                                onChange={(e) => setLocalNotes(e.target.value)}
                                onBlur={handleNotesBlur}
                                placeholder="Tambahkan catatan (ukuran, warna, dll)..."
                                className="w-full bg-neutral-base-50/50 hover:bg-neutral-base-50 focus:bg-white border border-transparent focus:border-neutral-base-200 rounded-xl px-3 py-2 text-[11px] md:text-[13px] font-medium outline-none placeholder:text-neutral-base-200 transition-all"
                            />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-amber-500 group-focus-within/note:w-full transition-all duration-300 rounded-full" />
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

