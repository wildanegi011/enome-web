"use client";

import FallbackImage from "@/components/store/shared/FallbackImage";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { Heart } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "@/hooks/use-auth";
import { useWishlist, useToggleWishlist } from "@/hooks/use-wishlist";
import { useCartItems } from "@/hooks/use-cart-items";
import { CartItem } from "@/lib/api/cart-api";
import { cn } from "@/lib/utils";

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
    const [hoverState, setHoverState] = useState<'none' | 'card' | 'colors'>('none');
    const colors = product.colors || [];
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    const { data: wishlistData } = useWishlist();
    const toggleWishlist = useToggleWishlist();
    const isWishlisted = wishlistData?.items?.includes(product.id || "") ?? false;

    // Cart-Aware Stock Calculation
    const { cartItems } = useCartItems();
    const qtyInCart = cartItems
        .filter((item: CartItem) => item.produkId === product.id)
        .reduce((sum: number, item: CartItem) => sum + Number(item.qty || 0), 0);

    const realStock = Math.max(0, (Number(product.totalStock) || 0) - qtyInCart);

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
            return;
        }
        if (product.id) {
            toggleWishlist.mutate({
                produkId: product.id,
            });
        }
    };

    const isCardHovered = hoverState === 'card';
    const isColorsHovered = hoverState === 'colors';

    return (
        <div
            className="group relative"
            onMouseEnter={() => setHoverState('card')}
            onMouseLeave={() => setHoverState('none')}
        >
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{
                    opacity: 1,
                    y: isCardHovered ? -6 : 0
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col h-full bg-white transition-none"
            >
                {/* Product Image - Taller Aspect Ratio */}
                <div className="relative aspect-3/4 overflow-hidden bg-neutral-base-50 rounded-sm mb-4 transition-shadow duration-200 shadow-sm group-hover:shadow-xl">
                    <Link
                        href={`/products/${product.id || 'batik-elegance-123'}`}
                        className="absolute inset-0 z-1"
                    >
                        <motion.div
                            className="absolute inset-0 z-1"
                            animate={{ scale: isCardHovered ? 1.05 : 1 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <FallbackImage
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                        </motion.div>
                    </Link>

                    {/* Status Badges */}
                    {product.isOnFlashSale && (
                        <div className="absolute top-3 left-3 z-10 pointer-events-none">
                            <span className="bg-red-600/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-sm">
                                Flash Sale
                            </span>
                        </div>
                    )}

                    {/* Out of Stock Overlay (Cart-Aware) */}
                    {realStock === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
                            <span className="text-white text-[9px] font-bold uppercase tracking-widest">
                                {qtyInCart > 0 && qtyInCart >= (Number(product.totalStock) || 0) ? "In Cart" : "Habis"}
                            </span>
                        </div>
                    )}

                    {/* Wishlist Icon */}
                    <div className="absolute top-3 right-3 z-10">
                        <motion.button
                            type="button"
                            onClick={handleWishlist}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: (hoverState !== 'none' || isWishlisted) ? 1 : 0,
                                scale: (hoverState !== 'none' || isWishlisted) ? 1 : 0.8
                            }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
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
                    </div>

                    {/* Subtle Overlay on Hover */}
                    <div className={cn(
                        "absolute inset-0 bg-neutral-base-900/5 transition-opacity duration-200 pointer-events-none z-5",
                        isCardHovered ? "opacity-100" : "opacity-0"
                    )} />
                </div>

                {/* Product Info */}
                <Link
                    href={`/products/${product.id || 'batik-elegance-123'}`}
                    className="flex justify-between items-start gap-4 px-1 hover:no-underline"
                >
                    <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
                        <p className="text-[10px] sm:text-[12px] text-neutral-base-400 font-bold uppercase tracking-widest font-montserrat truncate">
                            {product.category || "Kemeja"}
                        </p>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <h3 className={cn(
                                    "text-[13px] sm:text-[16px] font-bold leading-tight transition-colors duration-200 truncate font-montserrat tracking-tight",
                                    isCardHovered ? "text-amber-900" : "text-neutral-base-900"
                                )}>
                                    {product.name}
                                </h3>
                            </TooltipTrigger>
                            <TooltipContent className="bg-neutral-base-900 text-white border-none text-[12px] font-semibold py-1.5 px-3 font-montserrat">
                                {product.name}
                            </TooltipContent>
                        </Tooltip>
                        <div className="pt-0.5">
                            {product.originalPrice && product.isOnFlashSale && (
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[10px] sm:text-[12px] text-neutral-base-400 line-through font-montserrat">
                                        {product.originalPrice}
                                    </span>
                                    {!!product.discountPercentage && product.discountPercentage > 0 && (
                                        <span className="text-[8px] sm:text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                                            -{product.discountPercentage}%
                                        </span>
                                    )}
                                </div>
                            )}
                            <p className="text-[14px] sm:text-[16px] font-medium text-neutral-base-900 tracking-tight font-montserrat">
                                {product.price}
                            </p>
                        </div>
                    </div>

                    {/* Color Dots */}
                    {colors.length > 0 && (
                        <div
                            className="flex flex-col items-end pt-10 pb-2 shrink-0 relative z-10"
                            onMouseEnter={(e) => {
                                e.stopPropagation();
                                setHoverState('colors');
                            }}
                            onMouseLeave={(e) => {
                                e.stopPropagation();
                                setHoverState('card');
                            }}
                        >
                            <div className="h-6 flex items-center">
                                <motion.div
                                    layout
                                    className="flex items-center"
                                    animate={{ gap: isColorsHovered ? 6 : 0 }}
                                    transition={{ duration: 0.2, ease: "circOut" }}
                                >
                                    <AnimatePresence mode="popLayout">
                                        {(isColorsHovered ? colors : colors.slice(0, 2)).map((color, cIdx) => (
                                            <Tooltip key={`${color.name}-${cIdx}`} delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, scale: 0, x: -4 }}
                                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                                        exit={{ opacity: 0, scale: 0, x: -4 }}
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 500,
                                                            damping: 35,
                                                            delay: isColorsHovered ? cIdx * 0.01 : 0,
                                                        }}
                                                        whileHover={{ scale: 1.25, zIndex: 10 }}
                                                        className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-sm cursor-pointer shrink-0"
                                                        style={{ backgroundColor: color.value }}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-neutral-base-900 text-white border-none text-[10px] font-bold py-1 px-2 mb-1">
                                                    {color.name}
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </AnimatePresence>
                                    {!isColorsHovered && colors.length > 2 && (
                                        <div className="w-3.5 h-3.5 rounded-full bg-neutral-base-100 ring-2 ring-white flex items-center justify-center text-[6px] font-bold text-neutral-base-500">
                                            +{colors.length - 2}
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                            <AnimatePresence>
                                {isColorsHovered && colors.length > 2 && (
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
                </Link>
            </motion.div >
        </div >
    );
}
