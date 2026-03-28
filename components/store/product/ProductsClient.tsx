"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import FilterSidebar, { FilterState } from "@/components/store/product/FilterSidebar";
import ProductListHeader, { SortOption } from "@/components/store/product/ProductListHeader";
import Navbar from "@/components/store/layout/Navbar";
import Footer from "@/components/store/layout/Footer";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SlidersHorizontal, Search } from "lucide-react";
import { useProducts, useCategories, useColors, useSizes } from "@/hooks/use-products";
import type { Category, Color, Size } from "@/hooks/use-products";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from "@/components/store/shared/EmptyState";
import CONFIG from "@/lib/config";

// New Components
import Pagination from "@/components/store/shared/Pagination";
import ProductGrid from "@/components/store/product/ProductGrid";
import StickyHeader from "@/components/store/product/StickyHeader";

export interface FilterStateWithSearch extends FilterState {
    search?: string;
}

export default function ProductsClient() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const categoryFromUrl = searchParams.get("category");
    const searchFromUrl = searchParams.get("search");

    const [activeFilters, setActiveFilters] = useState<FilterStateWithSearch>({
        size: searchParams.get("size")?.split(",")?.filter(Boolean) || [],
        color: searchParams.get("color")?.split(",")?.filter(Boolean) || [],
        price: searchParams.get("price")?.split(",")?.filter(Boolean) || [],
        collection: categoryFromUrl ? categoryFromUrl.split(",").filter(Boolean) : [],
        brand: searchParams.get("brand")?.split(",")?.filter(Boolean) || [],
        gender: searchParams.get("gender")?.split(",")?.filter(Boolean) || [],
        search: searchFromUrl || undefined
    });

    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [currentPage, setCurrentPage] = useState(1);

    const { data: rawProducts = [], isLoading: productsLoading, isFetching: productsFetching } = useProducts(activeFilters);
    const { data: categoriesData = [], isLoading: categoriesLoading } = useCategories({ brand: activeFilters.brand, gender: activeFilters.gender });
    const { data: colorsData = [], isLoading: colorsLoading } = useColors();
    const { data: sizesData = [], isLoading: sizesLoading } = useSizes();

    const isInitialLoading = (productsLoading && rawProducts.length === 0) || categoriesLoading || colorsLoading || sizesLoading;
    const isRefreshing = productsFetching && !productsLoading;

    // Sync filters to URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (activeFilters.collection.length > 0) params.set("category", activeFilters.collection.join(","));
        if (activeFilters.search) params.set("search", activeFilters.search);
        if (activeFilters.color.length > 0) params.set("color", activeFilters.color.join(","));
        if (activeFilters.size.length > 0) params.set("size", activeFilters.size.join(","));
        if (activeFilters.brand.length > 0) params.set("brand", activeFilters.brand.join(","));
        if (activeFilters.gender.length > 0) params.set("gender", activeFilters.gender.join(","));
        if (activeFilters.price.length > 0) params.set("price", activeFilters.price.join(","));

        const qs = params.toString();
        const newUrl = qs ? `${pathname}?${qs}` : pathname;
        window.history.replaceState(null, "", newUrl);
    }, [activeFilters, pathname]);

    const dynamicCollections = useMemo(() => categoriesData.map((c: Category) => ({
        name: c.kategori,
        icon: c.icon || c.gambarKategori || null
    })), [categoriesData]);

    const dynamicColors = useMemo(() => colorsData.map((c: Color) => ({
        name: c.warna,
        value: c.kodeWarna || "#CCCCCC"
    })), [colorsData]);

    const dynamicSizes = useMemo(() => sizesData.map((s: Size) => s.size).filter(Boolean) as string[], [sizesData]);

    const handleFilterChange = useCallback((category: keyof FilterStateWithSearch, value: string) => {
        setActiveFilters(prev => {
            const current = prev[category];
            if (Array.isArray(current)) {
                const updated = current.includes(value)
                    ? current.filter(item => item !== value)
                    : [...current, value];
                return { ...prev, [category]: updated };
            } else {
                return { ...prev, [category]: current === value ? undefined : value };
            }
        });
        setCurrentPage(1); // Reset to first page on filter change
    }, []);

    const filteredProducts = useMemo(() => {
        let items = [...rawProducts];
        items.sort((a, b) => {
            switch (sortBy) {
                case "price_asc": return Number(a.finalMinPrice || 0) - Number(b.finalMinPrice || 0);
                case "price_desc": return Number(b.finalMinPrice || 0) - Number(a.finalMinPrice || 0);
                case "name_asc": return a.namaProduk.localeCompare(b.namaProduk);
                case "newest":
                default:
                    if (a.tglRilis && b.tglRilis) return new Date(b.tglRilis).getTime() - new Date(a.tglRilis).getTime();
                    return b.produkId.localeCompare(a.produkId);
            }
        });
        return items;
    }, [rawProducts, sortBy]);

    const ITEMS_PER_PAGE = CONFIG.PAGINATION.DEFAULT_LIMIT;
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage, ITEMS_PER_PAGE]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        const viewport = document.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <TooltipProvider>
            <main className="h-screen overflow-hidden bg-white flex flex-col">
                <ScrollArea className="flex-1">
                    <Navbar />
                    <div className="bg-white border-b border-neutral-base-50">
                        <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                            <ProductListHeader />
                        </div>
                    </div>

                    <section className="py-8 sm:py-12">
                        <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                            {/* Mobile Filter Trigger */}
                            <div className="flex lg:hidden justify-between items-center mb-6">
                                <h2 className="font-montserrat text-[20px] sm:text-[25px] font-bold text-neutral-base-900 tracking-tight">Produk</h2>
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <button className="flex items-center gap-2 border border-neutral-base-200 px-4 py-2 text-[13px] font-bold shadow-sm hover:bg-neutral-base-50 transition-colors uppercase tracking-widest font-montserrat">
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
                                {/* Desktop Sidebar */}
                                <aside className="hidden lg:block w-80 shrink-0 sticky top-[120px] h-[calc(100vh-140px)] z-50">
                                    <FilterSidebar
                                        activeFilters={activeFilters}
                                        onFilterChange={handleFilterChange}
                                        collections={dynamicCollections}
                                        colors={dynamicColors}
                                        sizes={dynamicSizes}
                                    />
                                </aside>

                                {/* Main Content */}
                                <div className="flex-1 relative min-h-[400px]">
                                    {isInitialLoading && rawProducts.length === 0 ? (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="space-y-4">
                                                    <div className="aspect-3/4 bg-neutral-100 animate-pulse rounded-2xl" />
                                                    <div className="h-4 bg-neutral-100 animate-pulse w-2/3 rounded" />
                                                    <div className="h-4 bg-neutral-100 animate-pulse w-1/3 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <StickyHeader
                                                currentPage={currentPage}
                                                itemsPerPage={ITEMS_PER_PAGE}
                                                totalItems={filteredProducts.length}
                                                sortBy={sortBy}
                                                onSortChange={setSortBy}
                                                isRefreshing={isRefreshing}
                                            />

                                            {filteredProducts.length === 0 ? (
                                                <EmptyState
                                                    icon={Search}
                                                    title="Tidak ada product"
                                                    description="Coba sesuaikan filter untuk melihat lebih banyak hasil."
                                                    actionLabel="Hapus Filter"
                                                    onActionClick={() => setActiveFilters({ size: [], color: [], price: [], collection: [], brand: [], gender: [], search: undefined })}
                                                    className="py-20 border-dashed"
                                                />
                                            ) : (
                                                <ProductGrid products={paginatedProducts} isRefreshing={isRefreshing} />
                                            )}

                                            {totalPages > 1 && (
                                                <div className="mt-16">
                                                    <Pagination
                                                        currentPage={currentPage}
                                                        totalItems={filteredProducts.length}
                                                        itemsPerPage={ITEMS_PER_PAGE}
                                                        onPageChange={handlePageChange}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                    <Footer />
                </ScrollArea>
            </main>
        </TooltipProvider>
    );
}
