"use client";

import { useState } from "react";
import { ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import FallbackImage from "@/components/store/shared/FallbackImage";
import { ASSET_URL } from "@/config/config";
import { formatCurrency } from "@/lib/utils";
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
        <div className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-[32px] overflow-hidden shadow-sm">
            <div className="px-6 md:px-8 py-5 md:py-6 border-b border-neutral-base-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-base-900 flex items-center justify-center shadow-lg shadow-neutral-base-900/10">
                        <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-[16px] font-bold text-neutral-base-900">
                        Rincian Barang
                    </h2>
                </div>
                <span className="text-[12px] font-bold text-neutral-base-400 tracking-wider">
                    {items.length} Barang
                </span>
            </div>

            <ScrollArea className={items.length > 6 && isExpanded ? "h-[500px] w-full" : "w-full"}>
                <div className="divide-y divide-neutral-base-50">
                    {displayedItems.map((item) => (
                        <div
                            key={item.id}
                            className="p-6 md:p-8 flex items-start md:items-center gap-4 md:gap-6 group"
                        >
                            <div className="w-20 h-24 md:w-24 md:h-32 bg-neutral-base-50 rounded-xl md:rounded-2xl overflow-hidden relative border border-neutral-base-50 shrink-0">
                                <FallbackImage
                                    src={
                                        item.gambar
                                            ? `${ASSET_URL}/img/${item.gambar}`
                                            : "/placeholder-product.jpg"
                                    }

                                    alt={item.namaProduk}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[14px] md:text-[16px] font-bold text-neutral-base-900 mb-1 md:mb-2 line-clamp-1">
                                    {item.namaProduk}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] md:text-[13px] font-medium text-neutral-base-400">
                                    {item.ukuran && (
                                        <span>
                                            <span className="text-neutral-base-500 font-medium">Ukuran:</span> <b className="text-neutral-base-900 font-bold">{item.ukuran}</b>
                                        </span>
                                    )}
                                    {item.variant && (
                                        <span>
                                            <span className="text-neutral-base-500 font-medium">Varian:</span> <b className="text-neutral-base-900 font-bold">{item.variant}</b>
                                        </span>
                                    )}
                                    {item.warna && (
                                        <span>
                                            <span className="text-neutral-base-500 font-medium">Warna:</span> <b className="text-neutral-base-900 font-bold">{item.warna}</b>
                                        </span>
                                    )}
                                    <span>
                                        <span className="text-neutral-base-500 font-medium">Qty:</span> <b className="text-neutral-base-900 font-bold">{item.qty}</b>
                                    </span>
                                </div>
                                {item.catatan && (
                                    <div className="mt-2.5 p-3 md:p-4 bg-neutral-base-50 rounded-xl border border-neutral-base-100">
                                        <p className="text-[11px] md:text-[12px] font-medium text-neutral-base-500 flex flex-col items-start gap-1 md:gap-2">
                                            <span className="w-1 h-1 rounded-full bg-neutral-base-400" />
                                            Catatan: <span className="text-neutral-base-800 not-italic ml-0 font-bold">{item.catatan}</span>
                                        </p>
                                    </div>
                                )}
                                <p className="text-[14px] md:text-[16px] font-semibold text-neutral-base-900 mt-2 md:mt-4">
                                    {formatCurrency(item.harga)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {hasMore && (
                <div className="p-4 md:p-6 border-t border-neutral-base-50 bg-neutral-base-50/30">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-neutral-base-200 bg-white text-[12px] font-bold text-neutral-base-600 hover:bg-neutral-base-100/50 hover:text-neutral-base-900 transition-all active:scale-[0.98] shadow-sm select-none"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                <span>Sembunyikan Barang</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                <span>Lihat {items.length - INITIAL_DISPLAY_COUNT} Barang Lainnya</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
