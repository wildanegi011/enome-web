"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
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
        <Link href={`/products/${product.id || 'batik-elegance-123'}`} className="block">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (index % 4) * 0.1 }}
                className="group flex flex-col h-full bg-white relative cursor-pointer"
            >
                <div className="relative aspect-4/5 overflow-hidden bg-neutral-base-100 mb-5 rounded-sm">
                    {product.totalStock === 0 && (
                        <div className="absolute top-4 left-4 z-20">
                            <span className="rounded-sm bg-red-400 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 shadow-xl">
                                Sold Out
                            </span>
                        </div>
                    )}
                    {product.isOnFlashSale && (
                        <div className="absolute top-4 right-4 z-20">
                            <span className="rounded-sm bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 shadow-xl">
                                Flash Sale
                            </span>
                        </div>
                    )}
                    {product.isOnPreOrder && (
                        <div className="absolute top-4 right-4 z-20">
                            <span className="rounded-sm bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 shadow-xl">
                                Pre-Order
                            </span>
                        </div>
                    )}
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                </div>

                <div className="text-left px-0.5">
                    <h3 className="font-serif text-[17px] lg:text-[18px] font-medium text-neutral-base-900 tracking-tight leading-tight line-clamp-1 group-hover:text-amber-900 transition-colors duration-300">
                        {product.name}
                    </h3>
                    <p className="text-[9px] text-neutral-base-400 uppercase tracking-[0.2em] font-bold opacity-70 mt-1">
                        {product.designer || "Handmade Batik by Énome"}
                    </p>

                    <div className="flex flex-col pt-2.5 min-h-[56px] justify-end">
                        {product.originalPrice && (
                            <p className="text-[11px] text-neutral-base-300 line-through font-medium mb-0.5">
                                {product.originalPrice}
                            </p>
                        )}
                        <p className={`font-black tracking-tighter text-neutral-base-900 leading-[1.1] ${(product.price?.length || 0) > 15 ? 'text-[15px] lg:text-[16px]' : 'text-[19px] lg:text-[20px]'
                            }`}>
                            {product.price || "Rp 380.000"}
                        </p>
                    </div>

                    <div className="pt-4 pb-2">
                        <p className="text-[10px] text-neutral-base-400 mb-2.5 uppercase tracking-widest font-bold opacity-80">Collection Palette</p>
                        <div
                            className="flex items-center h-12"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <motion.div
                                layout
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`flex items-center ${isHovered ? "gap-2" : "-space-x-2.5"}`}
                            >
                                {colors.slice(0, 4).map((color, cIdx) => (
                                    <Tooltip key={cIdx}>
                                        <TooltipTrigger asChild>
                                            <motion.button
                                                layout
                                                whileHover={{ scale: 1.15, zIndex: 50 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                }}
                                                className={`w-7 h-7 rounded-full border-2 transition-all relative border-white z-10 shadow-sm hover:shadow-md`}
                                                style={{ backgroundColor: color.value }}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-neutral-base-900 text-white border-none shadow-2xl px-3 py-1.5 text-[11px] font-bold rounded-lg mb-2">
                                            {color.name}
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                                {colors.length > 4 && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <motion.div
                                                layout
                                                className="w-7 h-7 rounded-full bg-neutral-base-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-neutral-base-600 shadow-sm"
                                            >
                                                +{colors.length - 4}
                                            </motion.div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-white/95 backdrop-blur-xl text-neutral-base-900 border-neutral-base-100 shadow-2xl p-4 min-w-[160px] rounded-2xl">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-neutral-base-400 uppercase tracking-widest border-b border-neutral-base-50 pb-2">Full Palette</p>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {colors.map((color, hcIdx) => (
                                                        <motion.div
                                                            key={hcIdx}
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: hcIdx * 0.04, type: "spring", stiffness: 400, damping: 25 }}
                                                            className="w-6 h-6 rounded-full border-2 border-white shadow-md ring-1 ring-neutral-base-100 hover:scale-125 transition-transform cursor-help"
                                                            style={{ backgroundColor: color.value }}
                                                            title={color.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div >
        </Link >
    );
}
