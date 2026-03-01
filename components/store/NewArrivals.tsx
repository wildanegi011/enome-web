"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useNewArrivals } from "@/hooks/use-products";
import { ASSET_URL } from "@/config/config";
import ProductCard from "./ProductCard";

export default function NewArrivals() {
    const { data: rawProducts = [], isLoading: productsLoading } = useNewArrivals();
    const [activeCategory, setActiveCategory] = useState("");
    const headerRef = useRef(null);
    const headerInView = useInView(headerRef, { once: true });

    const isLoading = productsLoading;

    // Smart Categories: Derive unique categories directly from products (max 4 to leave room for Discount Deals)
    const derivedCategories = useMemo(() => {
        if (!rawProducts.length) return [];
        const cats = Array.from(new Set(rawProducts.map(p => p.kategori)));
        return cats.sort().slice(0, 4); // Limit to top 4 categories
    }, [rawProducts]);

    // Set first category as active once loaded
    useEffect(() => {
        if (!activeCategory && derivedCategories.length > 0) {
            setActiveCategory(derivedCategories[0]);
        }
    }, [derivedCategories, activeCategory]);

    // Combine dynamic categories with permanent "Discount Deals" (Total max 4)
    const categories = useMemo(() => {
        return [...derivedCategories, "Discount Deals"];
    }, [derivedCategories]);

    // Filter products based on active category
    const products = useMemo(() => {
        if (activeCategory === "Discount Deals") return rawProducts.filter(p => (p as any).isOnFlashSale);
        return rawProducts.filter(p => p.kategori === activeCategory);
    }, [rawProducts, activeCategory]);

    if (isLoading) {
        return <section className="py-16 md:py-24 bg-white font-sans animate-pulse">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                <div className="h-12 w-48 bg-gray-100 rounded mx-auto mb-16"></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map(n => <div key={n} className="aspect-4/5 bg-gray-100 rounded"></div>)}
                </div>
            </div>
        </section>;
    }

    return (
        <TooltipProvider>
            <section className="py-16 md:py-24 bg-white font-sans">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                    {/* Header */}
                    <motion.div
                        ref={headerRef}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center mb-12 md:mb-16"
                    >
                        <h2 className="font-heading text-[32px] md:text-[40px] lg:text-[48px] font-bold text-neutral-base-900 leading-tight">New Arrivals</h2>
                        <p className="text-neutral-base-500 mt-3 md:mt-4 max-w-2xl mx-auto text-[15px] md:text-[16px] leading-relaxed">
                            Discover our latest drop. A perfect blend of cultural heritage and contemporary style, meticulously crafted for the modern individual.
                        </p>
                    </motion.div>

                    {/* Categories */}
                    <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12 md:mb-16 px-2 md:px-4">
                        {categories.map((cat: string) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 md:px-10 py-2.5 md:py-3.5 text-[11px] md:text-[12px] font-bold tracking-[0.05em] uppercase transition-all rounded-md ${activeCategory === cat
                                    ? "bg-neutral-base-900 text-white shadow-2xl shadow-black/30"
                                    : "bg-neutral-base-50 text-neutral-base-500 hover:bg-neutral-base-100"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
                        {products.length > 0 ? (
                            products.map((product: any, idx: number) => {
                                // Map real product to generic format for ProductCard
                                const colorArray = product.colors
                                    ? product.colors.split(",").map((c: string) => {
                                        const [name, value] = c.split("|");
                                        return { name, value };
                                    })
                                    : [];

                                const formatPriceRange = (min: any, max: any) => {
                                    const nMin = parseInt(min);
                                    const nMax = parseInt(max);
                                    if (!nMax || nMin === nMax) return `Rp ${nMin.toLocaleString()}`;
                                    return `Rp ${nMin.toLocaleString()} - Rp ${nMax.toLocaleString()}`;
                                };

                                const mappedProduct = {
                                    id: product.produkId,
                                    name: product.namaProduk,
                                    image: product.gambar ? `${ASSET_URL}/img/produk/${product.gambar}` : "/placeholder.jpg",
                                    colors: colorArray,
                                    price: formatPriceRange(product.finalMinPrice, product.finalMaxPrice),
                                    originalPrice: (product.finalMinPrice !== product.baseMinPrice || product.finalMaxPrice !== product.baseMaxPrice)
                                        ? formatPriceRange(product.baseMinPrice, product.baseMaxPrice)
                                        : undefined,
                                    designer: "Handmade Batik by Énome",
                                    totalStock: product.totalStock ? parseInt(product.totalStock.toString()) : 0,
                                    isOnFlashSale: product.isOnFlashSale,
                                    discountPercentage: product.discountPercentage,
                                    isOnPreOrder: product.isOnPreOrder,
                                    commission: product.hasCommission
                                        ? formatPriceRange(product.commissionMin, product.commissionMax)
                                        : undefined,
                                    hasCommission: product.hasCommission
                                };
                                return <ProductCard key={product.produkId} product={mappedProduct as any} index={idx} />;
                            })
                        ) : (
                            <div className="col-span-full py-20 text-center text-gray-400 italic">
                                No products found in this category.
                            </div>
                        )}
                    </div>

                    {/* View More */}
                    <div className="mt-24 text-center">
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.2em] uppercase text-neutral-base-900 border-b-2 border-transparent hover:border-neutral-base-900 pb-1 transition-all"
                        >
                            View More
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>
        </TooltipProvider>
    );
}
