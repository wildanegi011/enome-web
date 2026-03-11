"use client";

import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import ProductCard from "@/components/store/product/ProductCard";
import { ASSET_URL } from "@/config/config";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProductGridProps {
    products: any[];
    isRefreshing: boolean;
}

export default function ProductGrid({ products, isRefreshing }: ProductGridProps) {
    const formatPriceRange = (min: any, max: any) => {
        const nMin = parseInt(min);
        const nMax = parseInt(max);
        if (!nMax || nMin === nMax) return formatCurrency(nMin);
        return `${formatCurrency(nMin)} - ${formatCurrency(nMax)}`;
    };

    return (
        <LayoutGroup>
            <motion.div
                layout
                className={cn(
                    "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-x-6 gap-y-12 transition-opacity duration-500",
                    isRefreshing ? "opacity-40" : "opacity-100"
                )}
            >
                <AnimatePresence mode="popLayout">
                    {products.map((p, idx) => {
                        const colorArray = p.colors
                            ? p.colors.split(",").map((c: string) => {
                                const [name, value] = c.split("|");
                                return { name, value };
                            })
                            : [];

                        const mappedProduct = {
                            id: p.produkId,
                            name: p.namaProduk,
                            image: p.gambar ? `${ASSET_URL}/img/produk_utama/${p.gambar}` : "/placeholder.jpg",
                            category: p.kategori,
                            colors: colorArray,
                            price: formatPriceRange(p.finalMinPrice, p.finalMaxPrice),
                            originalPrice: (p.finalMinPrice !== p.baseMinPrice || p.finalMaxPrice !== p.baseMaxPrice)
                                ? formatPriceRange(p.baseMinPrice, p.baseMaxPrice)
                                : undefined,
                            designer: "Handmade Batik by Énome",
                            totalStock: p.totalStock ? parseInt(p.totalStock.toString()) : 0,
                            isOnFlashSale: p.isOnFlashSale,
                            discountPercentage: p.discountPercentage,
                            isOnPreOrder: p.isOnPreOrder,
                            commission: p.hasCommission ? formatPriceRange(p.commissionMin, p.commissionMax) : undefined,
                            hasCommission: p.hasCommission
                        };

                        return (
                            <motion.div
                                key={p.produkId}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <ProductCard product={mappedProduct as any} index={idx} />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>
        </LayoutGroup>
    );
}
