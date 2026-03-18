"use client";

import React, { useState, useEffect } from "react";
import FallbackImage from "@/components/store/shared/FallbackImage";
import { Minus, Plus, Trash2, Zap, MessageSquare, ChevronRight } from "lucide-react";
import { ASSET_URL } from "@/config/config";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
    const [isVariationsExpanded, setIsVariationsExpanded] = useState(false);

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
                "group relative transition-all duration-500 rounded-[20px] md:rounded-[32px] overflow-hidden",
                isCheckout ? "p-3 md:p-6" : "p-5 md:p-7 bg-white border border-neutral-base-100 hover:border-neutral-base-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-neutral-base-900/5",
                (isOffline || isStockInsufficient) && "border-red-100 bg-red-50/10 ring-1 ring-red-100/50"
            )}
        >
            {/* Top Layout Part: Image & Info */}
            <div className="flex items-start gap-4 md:gap-8">
                {/* 1. Checkbox (Cart Only) */}
                {showCheckbox && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onToggleSelect && onToggleSelect(item.id)}
                        disabled={isOffline}
                        className={cn(
                            "mt-9 md:mt-12 shrink-0",
                            isOffline && "cursor-not-allowed opacity-30"
                        )}
                    >
                        <div className={cn(
                            "w-4 h-4 md:w-6 md:h-6 rounded-sm border flex items-center justify-center transition-all shadow-sm",
                            isSelected
                                ? "bg-amber-800 border-amber-800 text-white shadow-amber-800/20"
                                : "bg-white border-neutral-base-200 text-transparent"
                        )}>
                            <svg className="w-3.5 md:w-4 h-3.5 md:h-4 fill-none stroke-current stroke-4" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                    </motion.button>
                )}

                {/* 2. Product Image */}
                <div className={cn(
                    "bg-neutral-base-50 overflow-hidden relative shrink-0 border border-neutral-base-100 shadow-md rounded-2xl transition-all",
                    isCheckout ? "w-16 h-18 md:w-24 md:h-32" : "w-24 h-24 md:w-32 md:h-32",
                    isOffline && "opacity-40 grayscale-[0.5]"
                )}>
                    <FallbackImage
                        src={item.gambar ? `${ASSET_URL}/img/${item.gambar}` : "/placeholder-product.jpg"}
                        alt={item.namaProduk}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 96px, 150px"
                    />
                </div>

                {/* 3. Info Section */}
                <div className={cn(
                    "flex-1 min-w-0 flex flex-col self-stretch",
                    isOffline && "opacity-60"
                )}>
                    {/* --- DESKTOP VIEW (md+) --- */}
                    <div className="hidden md:flex flex-col flex-1">
                        {/* TOP ROW: Title & Trash */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h3 className={cn(
                                    "font-bold text-neutral-base-900 tracking-tight leading-[1.2] wrap-break-word font-montserrat",
                                    isCheckout ? "text-[15px]" : "text-[18px] line-clamp-2",
                                    isOffline && "line-through text-neutral-base-400 font-medium"
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
                                            "w-2.5 h-2.5",
                                            item.isFlashsaleExpired === 1 ? "fill-neutral-base-400" : "fill-red-600"
                                        )} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                                            {item.isFlashsaleExpired === 1 ? "Promo Berakhir" : "Flash Sale"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {!isCheckout && (
                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="p-2 text-neutral-base-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* MIDDLE ROW: Attributes */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                            {item.variant && (
                                <div className="flex items-center gap-1 font-montserrat">
                                    <span className="text-[12px] font-bold text-neutral-base-400">Motif:</span>
                                    <span className="text-[12px] font-bold text-neutral-base-900">{item.variant}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1 font-montserrat">
                                <span className="text-[12px] font-bold text-neutral-base-400">Ukuran:</span>
                                <span className="text-[12px] font-bold text-neutral-base-900">{item.size}</span>
                            </div>
                            {(item.warnaName || item.warna) && (
                                <div className="flex items-center gap-1 font-montserrat">
                                    <span className="text-[12px] font-bold text-neutral-base-400">Warna:</span>
                                    <span className="text-[12px] font-bold text-neutral-base-900">{item.warnaName || item.warna}</span>
                                </div>
                            )}
                        </div>

                        {/* BOTTOM ROW: Price & Qty */}
                        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                            <span className={cn(
                                "font-bold text-neutral-base-900 font-montserrat tracking-tight tabular-nums leading-none",
                                isCheckout ? "text-[20px]" : "text-[24px]",
                                isOffline && "text-neutral-base-300 line-through font-medium"
                            )}>
                                {formatCurrency(Number(item.harga || 0) * Number(item.qty || 0))}
                            </span>

                            <div className="flex items-center bg-white border border-neutral-base-100 shadow-sm rounded-xl p-1 gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, Number(item.qty) - 1, item.stock ?? 99); }}
                                    disabled={Number(item.qty) <= 1 || isOffline}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-neutral-base-50 rounded-lg transition-all disabled:opacity-30 active:scale-90"
                                >
                                    <Minus className="w-4 h-4 text-neutral-base-600" />
                                </button>
                                <input
                                    type="number"
                                    value={item.qty}
                                    readOnly
                                    className="w-8 bg-transparent text-center font-bold text-neutral-base-900 tabular-nums text-[14px] outline-none"
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, Number(item.qty) + 1, item.stock ?? 99); }}
                                    disabled={Number(item.qty) >= (item.stock || 99) || isOffline}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-neutral-base-50 rounded-lg transition-all disabled:opacity-30 active:scale-90"
                                >
                                    <Plus className="w-4 h-4 text-neutral-base-600" />
                                </button>
                            </div>
                        </div>

                        {/* DESKTOP NOTE */}
                        {showNotes && (
                            <div className="mt-4 pt-4 border-t border-dashed border-neutral-base-100 flex flex-col gap-2">
                                <div className="flex items-center gap-2 px-1">
                                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.12em] text-neutral-base-400 font-montserrat">
                                        Catatan
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={localNotes}
                                    onChange={(e) => setLocalNotes(e.target.value)}
                                    onBlur={handleNotesBlur}
                                    placeholder="Tambahkan catatan..."
                                    className="w-full bg-neutral-base-50/50 hover:bg-neutral-base-50 focus:bg-white border border-transparent focus:border-neutral-base-200 rounded-xl px-4 py-3 text-[13px] font-medium outline-none transition-all placeholder:text-neutral-300"
                                />
                            </div>
                        )}
                    </div>

                    {/* --- MOBILE VIEW (Top Info Area) --- */}
                    <div className="flex md:hidden flex-col flex-1">
                        {/* Top Row: Info & Trash */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h3 className={cn(
                                    "font-bold text-neutral-base-900 tracking-tight leading-[1.3] line-clamp-2 text-[15px] font-montserrat",
                                    isOffline && "line-through text-neutral-base-400 font-medium"
                                )}>
                                    {item.namaProduk}
                                </h3>

                                {/* Attributes List (Mobile Collapsible - Shopee Style) */}
                                <div className="mt-2 text-neutral-base-900">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsVariationsExpanded(!isVariationsExpanded);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-base-50/80 border border-neutral-base-100 rounded-lg hover:bg-neutral-base-100 transition-all group active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-[9px] font-bold text-neutral-base-400 uppercase tracking-[0.12em] whitespace-nowrap font-montserrat">Variasi:</span>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <span className="text-[9px] font-bold text-neutral-base-900 truncate font-montserrat uppercase tracking-[0.05em]">
                                                    {[item.variant, item.size, item.warnaName || item.warna].filter(Boolean)[0]}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className={cn(
                                            "w-3 h-3 text-neutral-base-400 transition-transform duration-300 shrink-0",
                                            isVariationsExpanded ? "rotate-90" : "rotate-0"
                                        )} />
                                    </button>

                                    <AnimatePresence>
                                        {isVariationsExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "circOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-2.5 flex flex-wrap gap-1.5">
                                                    {item.variant && (
                                                        <div className="inline-flex items-center px-2 py-0.5 bg-white border border-neutral-base-100 rounded-lg shadow-sm">
                                                            <span className="text-[9px] font-bold text-neutral-base-400 uppercase tracking-[0.12em] mr-1 font-montserrat">Motif:</span>
                                                            <span className="text-[9px] font-bold text-neutral-base-900 uppercase tracking-[0.12em] font-montserrat">{item.variant}</span>
                                                        </div>
                                                    )}
                                                    <div className="inline-flex items-center px-2 py-0.5 bg-white border border-neutral-base-100 rounded-lg shadow-sm">
                                                        <span className="text-[9px] font-bold text-neutral-base-400 uppercase tracking-[0.12em] mr-1 font-montserrat">Ukuran:</span>
                                                        <span className="text-[9px] font-bold text-neutral-base-900 uppercase tracking-[0.12em] font-montserrat">{item.size}</span>
                                                    </div>
                                                    {(item.warnaName || item.warna) && (
                                                        <div className="inline-flex items-center px-2 py-0.5 bg-white border border-neutral-base-100 rounded-lg shadow-sm">
                                                            <span className="text-[9px] font-bold text-neutral-base-400 uppercase tracking-[0.12em] mr-1 font-montserrat">Warna:</span>
                                                            <span className="text-[9px] font-bold text-neutral-base-900 uppercase tracking-[0.12em] font-montserrat">{item.warnaName || item.warna}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Mobile Price: Below Attributes */}
                                <div className="mt-3">
                                    <span className={cn(
                                        "font-bold text-neutral-base-900 font-montserrat tracking-tight tabular-nums leading-none text-[18px]",
                                        isOffline && "text-neutral-base-300 line-through font-medium"
                                    )}>
                                        {formatCurrency(Number(item.harga || 0) * Number(item.qty || 0))}
                                    </span>
                                </div>
                            </div>

                            {!isCheckout && (
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onRemove(item.id)}
                                    className="p-2 -mr-2 text-neutral-base-300 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MOBILE VIEW: Bottom Interaction Bar (Full Width) --- */}
            <div className="flex md:hidden flex-col mt-5 pt-4 border-t border-dashed border-neutral-base-100">
                {/* Note Label (Separate Row) */}
                {showNotes && (
                    <div className="flex items-center gap-1.5 px-1 mb-2.5">
                        <MessageSquare className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-base-400 font-montserrat">
                            Catatan
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3">
                    {/* Note Input */}
                    {showNotes && (
                        <input
                            type="text"
                            value={localNotes}
                            onChange={(e) => setLocalNotes(e.target.value)}
                            onBlur={handleNotesBlur}
                            placeholder="Tulis catatan..."
                            className="flex-1 bg-neutral-base-50/50 focus:bg-white border border-transparent focus:border-neutral-base-200 rounded-xl px-3 h-9 text-[12px] font-medium outline-none transition-all placeholder:text-neutral-300 min-w-0"
                        />
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Qty Controls */}
                        <div className="flex items-center bg-white border border-neutral-base-100 shadow-sm rounded-xl p-0.5 gap-0.5 h-9">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, Number(item.qty) - 1, item.stock ?? 99); }}
                                disabled={Number(item.qty) <= 1 || isOffline}
                                className="w-7 h-7 flex items-center justify-center hover:bg-neutral-base-50 rounded-lg transition-all disabled:opacity-30"
                            >
                                <Minus className="w-3.5 h-3.5 text-neutral-base-600" />
                            </motion.button>
                            <input
                                type="number"
                                value={item.qty}
                                readOnly
                                className="w-6 bg-transparent text-center font-bold text-neutral-base-900 tabular-nums text-[13px] outline-none"
                            />
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, Number(item.qty) + 1, item.stock ?? 99); }}
                                disabled={Number(item.qty) >= (item.stock || 99) || isOffline}
                                className="w-7 h-7 flex items-center justify-center hover:bg-neutral-base-50 rounded-lg transition-all disabled:opacity-30"
                            >
                                <Plus className="w-3.5 h-3.5 text-neutral-base-600" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
