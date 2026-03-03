"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Trash2 } from "lucide-react";
import { ASSET_URL } from "@/config/config";
import { WishlistItem } from "@/lib/api/user-api";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface WishlistItemCardProps {
    item: WishlistItem;
    idx: number;
    isRemoving: boolean;
    onRemove: (e: React.MouseEvent, produkId: string) => void;
    formatPriceRange: (min: string | null, max: string | null) => string;
}

const WishlistItemCard = ({ item, idx, isRemoving, onRemove, formatPriceRange }: WishlistItemCardProps) => {
    const parseColors = (colors: string | null) => {
        if (!colors) return [];
        return colors.split(",").map(c => {
            const [name, value] = c.split("|");
            return { name, value };
        });
    };

    const colors = parseColors(item.colors);
    const stock = parseInt(item.total_stock || "0");

    const displayPrice = formatPriceRange(
        (item.final_min_price || item.min_price)?.toString() || null,
        (item.final_max_price || item.max_price)?.toString() || null
    );

    const originalPrice = (item.is_on_flash_sale && item.min_price)
        ? formatPriceRange(item.min_price, item.max_price)
        : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isRemoving ? 0 : 1, scale: isRemoving ? 0.9 : 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, delay: idx * 0.03 }}
        >
            <Link
                href={`/products/${item.produk_id}`}
                className="block group"
            >
                <div className="flex flex-col h-full bg-white transition-all duration-500 ease-out group-hover:-translate-y-1">
                    {/* Image */}
                    <div className="relative aspect-3/4 overflow-hidden bg-neutral-base-50 rounded-sm mb-4 shadow-sm group-hover:shadow-md transition-shadow duration-500">
                        <Image
                            src={item.gambar ? `${ASSET_URL}/img/produk/${item.gambar}` : "/placeholder.jpg"}
                            alt={item.nama_produk}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />

                        {/* Status Badges */}
                        {item.is_on_flash_sale && (
                            <div className="absolute top-2.5 left-2.5 z-1">
                                <span className="bg-red-600/90 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
                                    Flash Sale
                                </span>
                            </div>
                        )}

                        {/* Out of Stock Overlay */}
                        {stock === 0 && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-1">
                                <span className="text-white text-[9px] font-bold uppercase tracking-widest">
                                    Habis
                                </span>
                            </div>
                        )}

                        {/* Remove Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.button
                                    onClick={(e) => onRemove(e, item.produk_id)}
                                    disabled={isRemoving}
                                    className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm z-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    {isRemoving ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-base-400" />
                                    ) : (
                                        <Trash2 className="w-3.5 h-3.5 text-neutral-base-400 hover:text-red-500 transition-colors" />
                                    )}
                                </motion.button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-neutral-base-900 text-white border-none text-[10px] font-bold py-1 px-2 mb-1">
                                Hapus dari Wishlist
                            </TooltipContent>
                        </Tooltip>

                        {/* Subtle Hover Overlay */}
                        <div className="absolute inset-0 bg-neutral-base-900/0 group-hover:bg-neutral-base-900/5 transition-colors duration-500 pointer-events-none" />
                    </div>

                    {/* Info */}
                    <div className="flex justify-between items-start gap-3 px-1">
                        <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-[11px] text-neutral-base-400 font-bold uppercase tracking-wider">
                                {item.kategori}
                            </p>
                            <h3 className="text-[14px] md:text-[15px] font-medium text-neutral-base-900 leading-tight truncate group-hover:text-amber-900 transition-colors duration-300">
                                {item.nama_produk}
                            </h3>
                            <div className="pt-0.5">
                                {originalPrice && (
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-[11px] text-neutral-base-400 line-through">
                                            {originalPrice}
                                        </span>
                                        {!!item.flash_sale_discount && item.flash_sale_discount > 0 && (
                                            <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1 py-0.5 rounded">
                                                -{item.flash_sale_discount}%
                                            </span>
                                        )}
                                    </div>
                                )}
                                <p className="text-[15px] md:text-[16px] font-bold text-neutral-base-900 tracking-tight">
                                    {displayPrice}
                                </p>
                            </div>
                        </div>

                        {/* Color Dots */}
                        {colors.length > 0 && (
                            <div className="flex flex-col items-end pt-8 pb-1 shrink-0">
                                <div className="flex items-center gap-1">
                                    {colors.slice(0, 3).map((color, cIdx) => (
                                        <Tooltip key={cIdx}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-sm"
                                                    style={{ backgroundColor: color.value }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-neutral-base-900 text-white border-none text-[10px] font-bold py-1 px-2 mb-1">
                                                {color.name}
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                    {colors.length > 3 && (
                                        <div className="w-3.5 h-3.5 rounded-full bg-neutral-base-100 ring-2 ring-white flex items-center justify-center text-[6px] font-bold text-neutral-base-500">
                                            +{colors.length - 3}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default WishlistItemCard;
