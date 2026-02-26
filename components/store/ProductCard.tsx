"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from 'next/link';

interface Color {
    name: string;
    value: string;
}

interface Product {
    id?: string;
    name: string;
    image: string;
    category?: string;
    colors?: Color[];
    price?: string;
    originalPrice?: string;
    designer?: string;
    totalStock?: number;
    isOnFlashSale?: boolean;
    isOnPreOrder?: boolean;
    commission?: string;
    hasCommission?: boolean;
}

interface ProductCardProps {
    product: Product;
    index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const colors = product.colors || [];

    return (
        <Link
            href={`/products/${product.id || 'batik-elegance-123'}`}
            className="block group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
                className="flex flex-col h-full bg-white transition-all duration-500 ease-out group-hover:-translate-y-1"
            >
                {/* Product Image - Taller Aspect Ratio */}
                <div className="relative aspect-3/4 overflow-hidden bg-neutral-base-50 rounded-sm mb-4 shadow-sm group-hover:shadow-md transition-shadow duration-500">
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {(Number(product.totalStock) || 0) === 0 && (
                            <span className="bg-red-500/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-sm">
                                Sold Out
                            </span>
                        )}
                        {product.isOnFlashSale && (
                            <span className="bg-amber-500/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-sm">
                                Flash Sale
                            </span>
                        )}
                    </div>

                    {/* Subtle Overlay on Hover */}
                    <div className="absolute inset-0 bg-neutral-base-900/0 group-hover:bg-neutral-base-900/5 transition-colors duration-500" />
                </div>

                {/* Product Info */}
                <div className="flex justify-between items-start gap-4 px-1">
                    <div className="flex-1 space-y-1.5">
                        <p className="text-[11px] text-neutral-base-400 font-bold uppercase tracking-wider">
                            {product.category || "Kemeja"}
                        </p>
                        <h3 className="text-[16px] font-medium text-neutral-base-900 leading-tight group-hover:text-amber-900 transition-colors duration-300">
                            {product.name}
                        </h3>
                        <div className="pt-0.5">
                            {product.originalPrice && (
                                <span className="text-[12px] text-neutral-base-300 line-through mr-2">
                                    {product.originalPrice}
                                </span>
                            )}
                            <p className="text-[17px] font-bold text-neutral-base-900 tracking-tight">
                                {product.price}
                            </p>
                        </div>
                    </div>

                    {/* Color Dots - Dynamic Expand On Hover */}
                    <div className="flex flex-col items-end pt-10 pb-2">
                        <div className="h-6 flex items-center">
                            <motion.div
                                className="flex items-center -space-x-1"
                                animate={{ gap: isHovered ? "6px" : "0px" }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                <AnimatePresence mode="popLayout">
                                    {(isHovered ? colors : colors.slice(0, 2)).map((color, cIdx) => (
                                        <Tooltip key={`${color.name}-${cIdx}`}>
                                            <TooltipTrigger asChild>
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.8, x: 5 }}
                                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.8, x: 5 }}
                                                    whileHover={{ scale: 1.2, zIndex: 10 }}
                                                    className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm cursor-pointer"
                                                    style={{ backgroundColor: color.value }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-neutral-base-900 text-white border-none text-[10px] font-bold py-1 px-2 mb-1">
                                                {color.name}
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </AnimatePresence>
                                {!isHovered && colors.length > 2 && (
                                    <motion.div
                                        layout
                                        className="w-3 h-3 rounded-full bg-neutral-base-100 ring-2 ring-white flex items-center justify-center text-[6px] font-bold text-neutral-base-400"
                                    >
                                        +
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>
                        {isHovered && colors.length > 2 && (
                            <motion.p
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[9px] text-neutral-base-400 font-bold uppercase tracking-tighter mt-1"
                            >
                                {colors.length} Colors
                            </motion.p>
                        )}
                    </div>
                </div>
            </motion.div >
        </Link >
    );
}
