"use client";

import { useState, useMemo } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import FilterSidebar, { FilterState } from "@/components/store/FilterSidebar";
import ProductListHeader from "@/components/store/ProductListHeader";
import ProductCard from "@/components/store/ProductCard";
import Pagination from "@/components/store/Pagination";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/use-products";
import { ASSET_URL } from "@/config/config";
import type { Category } from "@/hooks/use-products";

import HeroSection from "@/components/store/HeroSection";

export default function ProductsPage() {
    const { data: rawProducts = [], isLoading: productsLoading } = useProducts();
    const { data: categoriesData = [], isLoading: categoriesLoading } = useCategories();
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        size: [],
        color: [],
        price: [],
        collection: [],
        tag: []
    });

    const isLoading = productsLoading || categoriesLoading;

    const dynamicCollections = useMemo(() => {
        return categoriesData.map((c: Category) => c.kategori);
    }, [categoriesData]);

    const handleFilterChange = (category: keyof FilterState, value: string) => {
        setActiveFilters(prev => {
            const current = prev[category];
            const updated = current.includes(value)
                ? current.filter(item => item !== value) // Remove if already exists
                : [...current, value]; // Add if doesn't exist

            return { ...prev, [category]: updated };
        });
    };

    // Filter logic
    const filteredProducts = useMemo(() => {
        return rawProducts.filter(product => {
            // Check Collections
            if (activeFilters.collection.length > 0) {
                if (!activeFilters.collection.includes(product.kategori)) return false;
            }

            // Price filtering (using finalMinPrice for accuracy with promotions)
            const minP = parseInt((product as any).finalMinPrice || (product as any).minPrice || "0");
            if (activeFilters.price.length > 0) {
                const priceMatch = activeFilters.price.some(range => {
                    if (range === "Under Rp 500k") return minP < 500000;
                    if (range === "Rp 500k - Rp 1.5M") return minP >= 500000 && minP <= 1500000;
                    if (range === "Above Rp 1.5M") return minP > 1500000;
                    return false;
                });
                if (!priceMatch) return false;
            }

            return true;
        });
    }, [activeFilters, rawProducts]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-base-900" />
            </div>
        );
    }

    return (
        <TooltipProvider>
            <main className="min-h-screen bg-white">
                <Navbar />

                {/* <HeroSection /> */}

                <div className="sticky top-[80px] z-30 bg-white/90 backdrop-blur-md border-b border-neutral-base-50">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                        <ProductListHeader />
                    </div>
                </div>

                <section className="py-12">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                        {/* Mobile Filter Trigger */}
                        <div className="flex lg:hidden justify-between items-center mb-6">
                            <h2 className="font-serif text-[24px] font-bold text-neutral-base-900">Products</h2>
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className="flex items-center gap-2 border border-neutral-base-200 px-4 py-2 text-[12px] font-bold shadow-sm hover:bg-neutral-base-50 transition-colors uppercase tracking-widest">
                                        <SlidersHorizontal className="w-[14px] h-[14px]" />
                                        Filters
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[350px] overflow-y-auto px-6 pt-16 border-l border-neutral-base-200">
                                    <SheetTitle className="sr-only">Product Filters</SheetTitle>
                                    <SheetDescription className="sr-only">Filter products by size, color, collection, and more.</SheetDescription>
                                    <div className="pb-10">
                                        <FilterSidebar
                                            activeFilters={activeFilters}
                                            onFilterChange={handleFilterChange}
                                            collections={dynamicCollections}
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-16">
                            {/* Desktop Sidebar (Left) */}
                            <div className="hidden lg:block w-80 shrink-0 sticky top-[180px] h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide pb-20">
                                <FilterSidebar
                                    activeFilters={activeFilters}
                                    onFilterChange={handleFilterChange}
                                    collections={dynamicCollections}
                                />
                            </div>

                            {/* Main Content */}
                            <div className="flex-1">
                                {filteredProducts.length === 0 ? (
                                    <div className="w-full py-20 text-center flex flex-col items-center justify-center border border-dashed border-neutral-base-200 rounded-3xl">
                                        <p className="font-serif text-[24px] text-neutral-base-400 mb-2">No products found</p>
                                        <p className="text-neutral-base-300 text-sm">Try adjusting your filters to see more results.</p>
                                        <button
                                            onClick={() => setActiveFilters({ size: [], color: [], price: [], collection: [], tag: [] })}
                                            className="mt-6 text-[12px] font-bold tracking-[0.1em] uppercase border-b border-neutral-base-900 pb-1"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-x-6 gap-y-12">
                                        {filteredProducts.map((p: any, idx) => {
                                            const colorArray = p.colors
                                                ? p.colors.split(",").map((c: string) => {
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
                                                id: p.produkId,
                                                name: p.namaProduk,
                                                image: p.gambar ? `${ASSET_URL}/img/produk/${p.gambar}` : "/placeholder.jpg",
                                                colors: colorArray,
                                                price: formatPriceRange(p.finalMinPrice, p.finalMaxPrice),
                                                originalPrice: (p.finalMinPrice !== p.baseMinPrice || p.finalMaxPrice !== p.baseMaxPrice)
                                                    ? formatPriceRange(p.baseMinPrice, p.baseMaxPrice)
                                                    : undefined,
                                                designer: "Handmade Batik by Énome",
                                                totalStock: p.totalStock ? parseInt(p.totalStock.toString()) : 0,
                                                isOnFlashSale: p.isOnFlashSale,
                                                isOnPreOrder: p.isOnPreOrder,
                                                commission: p.hasCommission ? formatPriceRange(p.commissionMin, p.commissionMax) : undefined,
                                                hasCommission: p.hasCommission
                                            };
                                            return <ProductCard key={p.produkId} product={mappedProduct as any} index={idx} />;
                                        })}
                                    </div>
                                )}

                                <div className="mt-20">
                                    <Pagination />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <Footer />
            </main>
        </TooltipProvider>
    );
}
