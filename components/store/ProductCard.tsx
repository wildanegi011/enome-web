"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { Heart } from "lucide-react";
import Link from 'next/link';
import { useWishlist, useToggleWishlist } from "@/hooks/use-wishlist";

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
    discountPercentage?: number;
}

interface ProductCardProps {
    product: Product;
    index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const colors = product.colors || [];

    const { data: wishlistData } = useWishlist();
    const toggleWishlist = useToggleWishlist();
    const isWishlisted = wishlistData?.items?.includes(product.id || "") ?? false;

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.id) {
            toggleWishlist.mutate(product.id);
        }
    };

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
                    {product.isOnFlashSale && (
                        <div className="absolute top-3 left-3 z-1">
                            <span className="bg-red-600/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-sm">
                                Flash Sale
                            </span>
                        </div>
                    )}

                    {/* Out of Stock Overlay */}
                    {(Number(product.totalStock) || 0) === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-1">
                            <span className="text-white text-[9px] font-bold uppercase tracking-widest">
                                Habis
                            </span>
                        </div>
                    )}

                    {/* Wishlist Icon */}
                    <motion.button
                        onClick={handleWishlist}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: isHovered || isWishlisted ? 1 : 0, scale: isHovered || isWishlisted ? 1 : 0.8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Heart
                            className={`w-4 h-4 transition-colors duration-200 ${isWishlisted
                                ? "fill-red-500 text-red-500"
                                : "text-neutral-base-600 hover:text-red-500"
                                }`}
                            strokeWidth={2}
                        />
                    </motion.button>

                    {/* Subtle Overlay on Hover */}
                    <div className="absolute inset-0 bg-neutral-base-900/0 group-hover:bg-neutral-base-900/5 transition-colors duration-500 pointer-events-none" />
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
                            {product.originalPrice && product.isOnFlashSale && (
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[12px] text-neutral-base-400 line-through">
                                        {product.originalPrice}
                                    </span>
                                    {!!product.discountPercentage && product.discountPercentage > 0 && (
                                        <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                                            -{product.discountPercentage}%
                                        </span>
                                    )}
                                </div>
                            )}
                            <p className="text-[17px] font-bold text-neutral-base-900 tracking-tight">
                                {product.price}
                            </p>
                        </div>
                    </div>

                    {/* Color Dots - Smooth Expand On Hover */}
                    {colors.length > 0 && (
                        <div className="flex flex-col items-end pt-10 pb-2">
                            <div className="h-6 flex items-center">
                                <motion.div
                                    className="flex items-center"
                                    animate={{ gap: isHovered ? 6 : 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                >
                                    <AnimatePresence mode="popLayout">
                                        {(isHovered ? colors : colors.slice(0, 2)).map((color, cIdx) => (
                                            <TooltipProvider key={`${color.name}-${cIdx}`}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <motion.div
                                                            layout
                                                            initial={{ opacity: 0, scale: 0, x: -8 }}
                                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                                            exit={{ opacity: 0, scale: 0, x: -8 }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 500,
                                                                damping: 30,
                                                                delay: isHovered ? cIdx * 0.03 : 0,
                                                            }}
                                                            whileHover={{ scale: 1.3, zIndex: 10 }}
                                                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-sm cursor-pointer"
                                                            style={{ backgroundColor: color.value }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-neutral-base-900 text-white border-none text-[10px] font-bold py-1 px-2 mb-1">
                                                        {color.name}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                    </AnimatePresence>
                                    {!isHovered && colors.length > 2 && (
                                        <motion.div
                                            layout
                                            className="w-3.5 h-3.5 rounded-full bg-neutral-base-100 ring-2 ring-white flex items-center justify-center text-[6px] font-bold text-neutral-base-500"
                                        >
                                            +{colors.length - 2}
                                        </motion.div>
                                    )}
                                </motion.div>
                            </div>
                            <AnimatePresence>
                                {isHovered && colors.length > 2 && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        transition={{ duration: 0.15 }}
                                        className="text-[9px] text-neutral-base-400 font-bold uppercase tracking-tighter mt-1"
                                    >
                                        {colors.length} Colors
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </motion.div >
        </Link >
    );
}
