"use client";

import { useState } from "react";
import { Package, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import FallbackImage from "@/components/store/shared/FallbackImage";
import { ASSET_URL } from "@/config/config";
import { formatCurrency, toTitleCase } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface OrderItem {
    id: number;
    namaProduk: string;
    harga: number;
    qty: number;
    gambar: string | null;
    ukuran?: string;
    warna?: string;
    variant?: string;
    catatan?: string | null;
}

interface OrderItemsCardProps {
    items: OrderItem[];
    orderNotes?: string | null;
}

export default function OrderItemsCard({ items, orderNotes }: OrderItemsCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Show first 3 items by default
    const INITIAL_DISPLAY_COUNT = 3;
    const hasMore = items.length > INITIAL_DISPLAY_COUNT;
    const displayedItems = isExpanded ? items : items.slice(0, INITIAL_DISPLAY_COUNT);

    return (
        <div className="bg-white border border-neutral-base-100 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-5 md:px-10 py-5 md:py-8 flex items-center justify-between border-b border-neutral-base-50">
                <div className="flex items-center gap-4 md:gap-5">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-[14px] md:rounded-[18px] bg-neutral-base-900 flex items-center justify-center shadow-lg shadow-neutral-base-900/10 shrink-0">
                        <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h2 className="text-[16px] md:text-[18px] font-bold text-neutral-base-900 tracking-tight font-montserrat">
                        Rincian Barang
                    </h2>
                </div>
                <span className="text-[10px] md:text-[12px] font-bold text-neutral-base-400 uppercase tracking-widest font-montserrat">
                    {items.length} Barang
                </span>
            </div>

            <div className="divide-y divide-neutral-base-50">
                {displayedItems.map((item) => (
                    <div
                        key={item.id}
                        className="p-5 md:p-10 md:pt-2 flex flex-col group"
                    >
                        <div className="flex items-start gap-4 md:gap-10">
                            {/* Product Image */}
                            <div className="aspect-square w-20 md:w-24 bg-white rounded-[14px] md:rounded-[16px] overflow-hidden relative border border-neutral-base-50 shadow-sm shrink-0">
                                <FallbackImage
                                    src={
                                        item.gambar
                                            ? `${ASSET_URL}/img/${item.gambar}`
                                            : "/placeholder-product.jpg"
                                    }
                                    alt={item.namaProduk}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0 pt-2">
                                <h3 className="text-[14px] md:text-[16px] font-bold text-neutral-base-900 mb-3 md:mb-4 leading-tight font-montserrat tracking-tight">
                                    {toTitleCase(item.namaProduk || "")}
                                </h3>

                                {/* Attributes Row 1: Variant & Warna */}
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {(item.variant || item.warna) && (
                                        <div className="bg-neutral-base-50 rounded-full flex items-center gap-2 border border-neutral-base-100/30">
                                            {item.variant && (
                                                <>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] md:text-[12px] font-medium text-neutral-base-400 font-montserrat">Motif:</span>
                                                        <span className="text-[11px] md:text-[12px] font-bold text-neutral-base-900 font-montserrat">{toTitleCase(item.variant || "")}</span>
                                                    </div>
                                                </>
                                            )}
                                            {item.variant && item.warna && (
                                                <div className="w-px h-3 bg-neutral-base-200 mx-1" />
                                            )}
                                            {item.warna && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] md:text-[12px] font-medium text-neutral-base-400 font-montserrat">Warna:</span>
                                                    <span className="text-[11px] md:text-[12px] font-bold text-neutral-base-900 font-montserrat">{toTitleCase(item.warna || "")}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Attributes Row 2: Size & Qty */}
                                <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
                                    <div className="bg-neutral-base-50 rounded-full flex items-center gap-2 border border-neutral-base-100/30">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] md:text-[12px] font-medium text-neutral-base-400 font-montserrat">Ukuran:</span>
                                            <span className="text-[11px] md:text-[12px] font-bold text-neutral-base-900 font-montserrat uppercase">{item.ukuran || 'N/A'}</span>
                                        </div>
                                        <div className="w-px h-3 bg-neutral-base-200 mx-0.5 md:mx-1" />
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] md:text-[12px] font-medium text-neutral-base-400 font-montserrat">Qty:</span>
                                            <span className="text-[11px] md:text-[12px] font-bold text-neutral-base-900 font-montserrat">{item.qty}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Price Row */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] md:text-[16px] font-bold text-neutral-base-900 font-montserrat tracking-tight">
                                            {formatCurrency(item.harga)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Catatan Produk - Full Width below image/info */}
                        {item.catatan && (
                            <div className="mt-4 p-3 md:p-4 bg-neutral-base-50/50 rounded-[20px] border border-neutral-base-100/30 flex items-start gap-3 md:gap-4 ring-1 ring-neutral-base-900/5">
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white flex items-center justify-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] shrink-0 border border-neutral-base-100/50">
                                    <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-base-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[9px] md:text-[10px] font-black text-neutral-base-400 uppercase tracking-widest block mb-1 font-montserrat">
                                        Catatan Produk
                                    </span>
                                    <p className="text-[11px] md:text-[13px] text-neutral-base-600 font-medium font-montserrat leading-relaxed italic wrap-break-word">
                                        "{item.catatan}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="p-6 md:p-8 bg-white border-t border-neutral-base-50">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full h-12 flex items-center justify-center gap-3 px-8 rounded-full bg-neutral-base-50 text-[13px] md:text-[14px] font-semibold text-neutral-base-900 hover:bg-neutral-base-100 transition-all active:scale-[0.98] select-none shadow-sm"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-5 h-5" />
                                <span>Sembunyikan Barang</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-5 h-5" />
                                <span>Lihat {items.length - INITIAL_DISPLAY_COUNT} Barang Lainnya</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
