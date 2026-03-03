"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { Heart, Trash2, Loader2, Search, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/store/layout/Navbar";
import UserSidebar from "@/components/store/layout/UserSidebar";
import AccountHeader from "@/components/store/layout/AccountHeader";
import { ASSET_URL } from "@/config/config";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ResultsInfo from "@/components/store/shared/ResultsInfo";
import SearchInput from "@/components/store/shared/SearchInput";
import EmptyState from "@/components/store/shared/EmptyState";
import Pagination from "@/components/store/shared/Pagination";

type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";
type StockFilter = "all" | "in_stock" | "out_of_stock";

const ITEMS_PER_PAGE = 12;

import WishlistSkeleton from "@/components/store/wishlist/WishlistSkeleton";
import WishlistItemCard from "@/components/store/wishlist/WishlistItemCard";
import WishlistFilters from "@/components/store/wishlist/WishlistFilters";
import { useToggleWishlist, useWishlistDetails } from "@/hooks/use-wishlist";

const formatPriceRange = (min: string | null, max: string | null) => {
    const nMin = parseInt(min || "0");
    const nMax = parseInt(max || "0");
    if (!nMin) return "Harga belum tersedia";
    if (!nMax || nMin === nMax) return formatCurrency(nMin);
    return `${formatCurrency(nMin)} – ${formatCurrency(nMax)}`;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Terbaru" },
    { value: "price_asc", label: "Harga Terendah" },
    { value: "price_desc", label: "Harga Tertinggi" },
    { value: "name_asc", label: "Nama A-Z" },
];

export default function WishlistPage() {
    const { data: items = [], isLoading } = useWishlistDetails();
    const toggleWishlist = useToggleWishlist();
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

    // Filter & sort state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [stockFilter, setStockFilter] = useState<StockFilter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [currentPage, setCurrentPage] = useState(1);

    const handleRemove = async (e: React.MouseEvent, produkId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setRemovingIds(prev => new Set(prev).add(produkId));

        try {
            await toggleWishlist.mutateAsync(produkId);
            setTimeout(() => {
                setRemovingIds(prev => { const next = new Set(prev); next.delete(produkId); return next; });
            }, 300);
        } catch {
            setRemovingIds(prev => { const next = new Set(prev); next.delete(produkId); return next; });
        }
    };

    // Derived categories from data
    const categories = useMemo(() => {
        const cats = [...new Set(items.map(i => i.kategori))].filter(Boolean).sort();
        return cats;
    }, [items]);

    // Filtered + sorted items
    const processedItems = useMemo(() => {
        let filtered = [...items];

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(i =>
                i.nama_produk.toLowerCase().includes(q) ||
                i.kategori.toLowerCase().includes(q)
            );
        }

        // Category
        if (selectedCategory !== "all") {
            filtered = filtered.filter(i => i.kategori === selectedCategory);
        }

        // Stock
        if (stockFilter === "in_stock") {
            filtered = filtered.filter(i => parseInt(i.total_stock || "0") > 0);
        } else if (stockFilter === "out_of_stock") {
            filtered = filtered.filter(i => parseInt(i.total_stock || "0") === 0);
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "price_asc":
                    return parseInt(a.min_price || "0") - parseInt(b.min_price || "0");
                case "price_desc":
                    return parseInt(b.min_price || "0") - parseInt(a.min_price || "0");
                case "name_asc":
                    return a.nama_produk.localeCompare(b.nama_produk);
                case "newest":
                default:
                    return 0;
            }
        });

        return filtered;
    }, [items, searchQuery, selectedCategory, stockFilter, sortBy]);

    // Pagination
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedItems.slice(start, start + ITEMS_PER_PAGE);
    }, [processedItems, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, stockFilter, sortBy]);

    const activeFilterCount = [
        selectedCategory !== "all" ? 1 : 0,
        stockFilter !== "all" ? 1 : 0,
        searchQuery.trim() ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedCategory("all");
        setStockFilter("all");
        setSortBy("newest");
    };

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-neutral-base-50/30 font-sans text-neutral-base-900">
                <Navbar />

                <main className="max-w-[1340px] mx-auto px-3 sm:px-4 md:px-8 py-6 md:py-10">
                    <div className="flex flex-col lg:flex-row gap-12">
                        <div className="hidden lg:block shrink-0">
                            <UserSidebar />
                        </div>

                        <div className="flex-1 min-w-0">
                            <AccountHeader
                                title="Wishlist"
                                description="Produk favorit yang ingin Anda beli nanti."
                                className="mb-6"
                            />

                            {/* Filters & Controls */}
                            {!isLoading && items.length > 0 && (
                                <WishlistFilters
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    stockFilter={stockFilter}
                                    setStockFilter={setStockFilter}
                                    selectedCategory={selectedCategory}
                                    setSelectedCategory={setSelectedCategory}
                                    categories={categories}
                                    activeFilterCount={activeFilterCount}
                                    clearFilters={clearFilters}
                                    sortOptions={SORT_OPTIONS}
                                />
                            )}

                            {/* Results count */}
                            {!isLoading && items.length > 0 && processedItems.length > 0 && (
                                <ResultsInfo
                                    currentPage={currentPage}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    totalItems={processedItems.length}
                                    className="mb-4"
                                />
                            )}

                            {/* Wishlist Content */}
                            {isLoading ? (
                                <WishlistSkeleton />
                            ) : items.length === 0 ? (
                                <EmptyState
                                    icon={Heart}
                                    title="Wishlist Anda kosong"
                                    description="Simpan produk favorit dengan menekan ikon ❤️ di halaman produk."
                                    actionLabel="Jelajahi Produk"
                                    actionHref="/products"
                                />
                            ) : processedItems.length === 0 ? (
                                <EmptyState
                                    icon={Search}
                                    title="Tidak ada produk ditemukan"
                                    description="Coba ubah filter atau kata pencarian Anda."
                                    actionLabel="Reset Filter"
                                    onActionClick={clearFilters}
                                />
                            ) : (
                                <>
                                    <LayoutGroup>
                                        <motion.div
                                            layout
                                            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {paginatedItems.map((item, idx) => (
                                                    <WishlistItemCard
                                                        key={item.produk_id}
                                                        item={item}
                                                        idx={idx}
                                                        isRemoving={removingIds.has(item.produk_id)}
                                                        onRemove={handleRemove}
                                                        formatPriceRange={formatPriceRange}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </motion.div>
                                    </LayoutGroup>

                                    {/* Pagination */}
                                    <div className="mt-12">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalItems={processedItems.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                            onPageChange={(page) => {
                                                setCurrentPage(page);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </TooltipProvider>
    );
}