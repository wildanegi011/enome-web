"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import FilterSidebar, { FilterState } from "@/components/store/product/FilterSidebar";
export interface FilterStateWithSearch extends FilterState {
    search?: string;
}
import ProductListHeader, { SortOption } from "@/components/store/product/ProductListHeader";
import ProductCard from "@/components/store/product/ProductCard";
import Navbar from "@/components/store/layout/Navbar";
import Footer from "@/components/store/layout/Footer";
import ResultsInfo from "@/components/store/shared/ResultsInfo";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SlidersHorizontal, Loader2, Search } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useProducts, useCategories, useColors, useSizes } from "@/hooks/use-products";
import { ASSET_URL } from "@/config/config";
import type { Category, Color, Size } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";

import HeroSection from "@/components/store/home/HeroSection";
import CONFIG from "@/lib/config";
import EmptyState from "@/components/store/shared/EmptyState";

function ProductsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const categoryFromUrl = searchParams.get("category");
    const searchFromUrl = searchParams.get("search");

    const [activeFilters, setActiveFilters] = useState<FilterStateWithSearch>({
        size: [],
        color: [],
        price: [],
        collection: categoryFromUrl ? [categoryFromUrl] : [],
        tag: [],
        search: searchFromUrl || undefined
    });
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const { data: rawProducts = [], isLoading: productsLoading, isFetching: productsFetching } = useProducts(activeFilters);
    const { data: categoriesData = [], isLoading: categoriesLoading } = useCategories();
    const { data: colorsData = [], isLoading: colorsLoading } = useColors();
    const { data: sizesData = [], isLoading: sizesLoading } = useSizes();

    // Only show skeleton on initial load when there's no data at all
    const isInitialLoading = (productsLoading && rawProducts.length === 0) || categoriesLoading || colorsLoading || sizesLoading;
    const isRefreshing = productsFetching && !productsLoading;

    // Sync filters → URL (silently, no navigation/re-render)
    useEffect(() => {
        const params = new URLSearchParams();
        if (activeFilters.collection.length > 0) {
            params.set("category", activeFilters.collection.join(","));
        }
        if (activeFilters.search) {
            params.set("search", activeFilters.search);
        }
        if (activeFilters.color.length > 0) {
            params.set("color", activeFilters.color.join(","));
        }
        if (activeFilters.size.length > 0) {
            params.set("size", activeFilters.size.join(","));
        }
        if (activeFilters.price.length > 0) {
            params.set("price", activeFilters.price.join(","));
        }
        const qs = params.toString();
        const newUrl = qs ? `${pathname}?${qs}` : pathname;
        window.history.replaceState(null, "", newUrl);
    }, [activeFilters, pathname]);

    const dynamicCollections = useMemo(() => {
        return categoriesData.map((c: Category) => ({
            name: c.kategori,
            icon: c.gambarKategori || null
        }));
    }, [categoriesData]);

    const dynamicColors = useMemo(() => {
        return colorsData.map((c: Color) => ({ name: c.warna, value: c.kodeWarna || "#CCCCCC" }));
    }, [colorsData]);

    const dynamicSizes = useMemo(() => {
        return sizesData.map((s: Size) => s.size).filter(Boolean) as string[];
    }, [sizesData]);

    const handleFilterChange = useCallback((category: keyof FilterStateWithSearch, value: string) => {
        setActiveFilters(prev => {
            const current = prev[category];

            if (Array.isArray(current)) {
                const updated = current.includes(value)
                    ? current.filter(item => item !== value)
                    : [...current, value];
                return { ...prev, [category]: updated };
            } else {
                const updated = current === value ? undefined : value;
                return { ...prev, [category]: updated };
            }
        });
    }, []);

    // Use database-filtered products directly and apply client-side sorting
    const filteredProducts = useMemo(() => {
        let items = [...rawProducts];

        // Sort items
        items.sort((a, b) => {
            switch (sortBy) {
                case "price_asc":
                    return Number(a.finalMinPrice || 0) - Number(b.finalMinPrice || 0);
                case "price_desc":
                    return Number(b.finalMinPrice || 0) - Number(a.finalMinPrice || 0);
                case "name_asc":
                    return a.namaProduk.localeCompare(b.namaProduk);
                case "newest":
                default:
                    // For "newest", if the API doesn't guarantee it, we sort by product ID descending or tglRilis
                    // Assuming higher product ID or tglRilis is newer
                    if (a.tglRilis && b.tglRilis) {
                        return new Date(b.tglRilis).getTime() - new Date(a.tglRilis).getTime();
                    }
                    return b.produkId.localeCompare(a.produkId);
            }
        });

        return items;
    }, [rawProducts, sortBy]);

    // Pagination
    const ITEMS_PER_PAGE = CONFIG.PAGINATION.DEFAULT_LIMIT;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilters]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isInitialLoading) {
        return <ProductListSkeleton />;
    }

    return (
        <TooltipProvider>
            <main className="min-h-screen bg-white">
                <Navbar />

                <div className="sticky top-[80px] z-30 bg-white/90 backdrop-blur-md border-b border-neutral-base-50">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                        <ProductListHeader sortBy={sortBy} onSortChange={setSortBy} />
                    </div>
                </div>

                <section className="py-12">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                        {/* Mobile Filter Trigger */}
                        <div className="flex lg:hidden justify-between items-center mb-6">
                            <h2 className="font-serif text-[24px] font-bold text-neutral-base-900">Produk</h2>
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className="flex items-center gap-2 border border-neutral-base-200 px-4 py-2 text-[12px] font-bold shadow-sm hover:bg-neutral-base-50 transition-colors uppercase tracking-widest">
                                        <SlidersHorizontal className="w-[14px] h-[14px]" />
                                        Filter
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[350px] overflow-y-auto px-6 pt-16 border-l border-neutral-base-200">
                                    <SheetTitle className="sr-only">Filter Produk</SheetTitle>
                                    <SheetDescription className="sr-only">Filter produk berdasarkan ukuran, warna, koleksi, dan lainnya.</SheetDescription>
                                    <div className="pb-10">
                                        <FilterSidebar
                                            activeFilters={activeFilters}
                                            onFilterChange={handleFilterChange}
                                            collections={dynamicCollections}
                                            colors={dynamicColors}
                                            sizes={dynamicSizes}
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-16">
                            {/* Desktop Sidebar (Left) */}
                            <div className="hidden lg:block w-80 shrink-0 sticky top-[180px] h-[calc(100vh-200px)]">
                                <FilterSidebar
                                    activeFilters={activeFilters}
                                    onFilterChange={handleFilterChange}
                                    collections={dynamicCollections}
                                    colors={dynamicColors}
                                    sizes={dynamicSizes}
                                />
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 relative">
                                {/* Subtle Loading Overlay */}
                                <AnimatePresence>
                                    {isRefreshing && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-10 bg-white/20 backdrop-blur-[1px] flex justify-center pt-20"
                                        >
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-neutral-base-100 h-fit">
                                                <Loader2 className="w-4 h-4 animate-spin text-neutral-base-900" />
                                                <span className="text-[10px] font-bold tracking-widest uppercase">Updating...</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Total Products Count */}
                                <div className="flex items-center justify-between mb-6">
                                    <ResultsInfo
                                        currentPage={currentPage}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                        totalItems={filteredProducts.length}
                                    />
                                </div>

                                {filteredProducts.length === 0 ? (
                                    <EmptyState
                                        icon={Search}
                                        title="Tidak ada product"
                                        description="Coba sesuaikan filter untuk melihat lebih banyak hasil."
                                        actionLabel="Hapus Filter"
                                        onActionClick={() => setActiveFilters({ size: [], color: [], price: [], collection: [], tag: [], search: undefined })}
                                        className="py-20 border-dashed"
                                    />
                                ) : (
                                    <LayoutGroup>
                                        <motion.div
                                            layout
                                            className={cn(
                                                "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-x-6 gap-y-12 transition-opacity duration-500",
                                                isRefreshing ? "opacity-40" : "opacity-100"
                                            )}
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {paginatedProducts.map((p: any, idx) => {
                                                    const colorArray = p.colors
                                                        ? p.colors.split(",").map((c: string) => {
                                                            const [name, value] = c.split("|");
                                                            return { name, value };
                                                        })
                                                        : [];

                                                    const formatPriceRange = (min: any, max: any) => {
                                                        const nMin = parseInt(min);
                                                        const nMax = parseInt(max);
                                                        if (!nMax || nMin === nMax) return formatCurrency(nMin);
                                                        return `${formatCurrency(nMin)} - ${formatCurrency(nMax)}`;
                                                    };

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
                                )}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-16">
                                        <PaginationControls
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
                <Footer />
            </main>
        </TooltipProvider>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<ProductListSkeleton />}>
            <ProductsContent />
        </Suspense>
    );
}

function ProductListSkeleton() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <div className="sticky top-[80px] z-30 bg-white border-b border-neutral-base-50 h-[80px] flex items-center">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 w-full">
                    <Skeleton className="h-8 w-64" />
                </div>
            </div>
            <section className="py-12">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                    <div className="flex flex-col lg:flex-row gap-16">
                        <div className="hidden lg:block w-80 shrink-0 space-y-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="space-y-4">
                                    <Skeleton className="h-6 w-32" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-4/6" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
                                {[1, 2, 3, 4, 6].map((i) => (
                                    <div key={i} className="space-y-4">
                                        <Skeleton className="aspect-3/4 w-full rounded-2xl bg-neutral-100" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                            <Skeleton className="h-4 w-1/4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

function PaginationControls({ currentPage, totalPages, onPageChange }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-1.5">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-10 px-3 flex items-center justify-center text-[13px] font-semibold text-neutral-base-600 hover:text-neutral-base-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                ← Prev
            </button>
            {getPageNumbers().map((page, idx) =>
                typeof page === "string" ? (
                    <span key={`ellipsis-${idx}`} className="h-10 w-10 flex items-center justify-center text-neutral-base-300 text-[13px]">
                        ···
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all",
                            currentPage === page
                                ? "bg-neutral-base-900 text-white shadow-md"
                                : "text-neutral-base-400 hover:bg-neutral-base-50 hover:text-neutral-base-900"
                        )}
                    >
                        {page}
                    </button>
                )
            )}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-10 px-3 flex items-center justify-center text-[13px] font-semibold text-neutral-base-600 hover:text-neutral-base-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                Next →
            </button>
        </div>
    );
}
