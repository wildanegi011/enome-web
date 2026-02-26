"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";
import { Heart, Trash2, Loader2, Search, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/store/Navbar";
import UserSidebar from "@/components/store/UserSidebar";
import { ASSET_URL } from "@/config/config";
import { useToggleWishlist } from "@/hooks/use-wishlist";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import ResultsInfo from "@/components/store/ResultsInfo";

interface WishlistItem {
    wishlist_id: number;
    produk_id: string;
    nama_produk: string;
    kategori: string;
    gambar: string | null;
    isaktif: number;
    is_online: number;
    min_price: string | null;
    max_price: string | null;
    total_stock: string | null;
    colors: string | null;
    created_at: string | null;
}

type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";
type StockFilter = "all" | "in_stock" | "out_of_stock";

const ITEMS_PER_PAGE = 12;

const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);

const formatPriceRange = (min: string | null, max: string | null) => {
    const nMin = parseInt(min || "0");
    const nMax = parseInt(max || "0");
    if (!nMin) return "Harga belum tersedia";
    if (!nMax || nMin === nMax) return formatPrice(nMin);
    return `${formatPrice(nMin)} – ${formatPrice(nMax)}`;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Terbaru" },
    { value: "price_asc", label: "Harga Terendah" },
    { value: "price_desc", label: "Harga Tertinggi" },
    { value: "name_asc", label: "Nama A-Z" },
];

const WishlistGridSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="space-y-3">
                <Skeleton className="aspect-3/4 w-full rounded-xl" />
                <div className="space-y-2 px-1">
                    <Skeleton className="w-16 h-3" />
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-4" />
                </div>
            </div>
        ))}
    </div>
);

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
    const toggleWishlist = useToggleWishlist();

    // Filter & sort state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [stockFilter, setStockFilter] = useState<StockFilter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [currentPage, setCurrentPage] = useState(1);

    const fetchWishlist = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/wishlist/details");
            const data = await res.json();
            setItems(data.items || []);
        } catch (error) {
            console.error("Gagal memuat wishlist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const handleRemove = async (e: React.MouseEvent, produkId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setRemovingIds(prev => new Set(prev).add(produkId));

        try {
            await toggleWishlist.mutateAsync(produkId);
            setTimeout(() => {
                setItems(prev => prev.filter(i => i.produk_id !== produkId));
                setRemovingIds(prev => { const next = new Set(prev); next.delete(produkId); return next; });
            }, 300);
        } catch {
            setRemovingIds(prev => { const next = new Set(prev); next.delete(produkId); return next; });
        }
    };

    const parseColors = (colors: string | null) => {
        if (!colors) return [];
        return colors.split(",").map(c => {
            const [name, value] = c.split("|");
            return { name, value };
        });
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
                    return 0; // Already sorted by newest from API
            }
        });

        return filtered;
    }, [items, searchQuery, selectedCategory, stockFilter, sortBy]);

    // Pagination
    const totalPages = Math.ceil(processedItems.length / ITEMS_PER_PAGE);
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

                <main className="max-w-[1340px] mx-auto px-4 md:px-8 py-10">
                    <div className="flex flex-col lg:flex-row gap-12">
                        <div className="hidden lg:block">
                            <UserSidebar />
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex flex-col gap-2 mb-6">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-[28px] md:text-[32px] font-black text-neutral-base-900 tracking-tight">
                                        Wishlist
                                    </h1>
                                </div>
                                <p className="text-[13px] md:text-[14px] text-neutral-base-400 font-medium">
                                    Produk favorit yang ingin Anda beli nanti.
                                </p>
                            </div>

                            {/* Filters & Controls */}
                            {!isLoading && items.length > 0 && (
                                <div className="space-y-4 mb-8">
                                    {/* Search + Sort Row */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {/* Search */}
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Cari produk wishlist..."
                                                className="w-full h-11 pl-10 pr-4 bg-white border border-neutral-base-100 rounded-xl text-[13px] font-medium text-neutral-base-900 placeholder:text-neutral-base-300 outline-none focus:border-neutral-base-300 focus:ring-1 focus:ring-neutral-base-200 transition-all"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery("")}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-neutral-base-100 text-neutral-base-400 hover:bg-neutral-base-200 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Sort */}
                                        <div className="relative shrink-0">
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                                className="h-11 pl-4 pr-10 bg-white border border-neutral-base-100 rounded-xl text-[13px] font-bold text-neutral-base-700 outline-none focus:border-neutral-base-300 appearance-none cursor-pointer transition-all"
                                            >
                                                {SORT_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Category + Stock Filter Pills - Scrollable for many categories */}
                                    <div className="relative group/scroll">
                                        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1 scroll-smooth">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                {/* Stock filters */}
                                                <button
                                                    onClick={() => setStockFilter("all")}
                                                    className={cn(
                                                        "h-8 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all",
                                                        stockFilter === "all"
                                                            ? "bg-neutral-base-900 text-white border-neutral-base-900"
                                                            : "bg-white text-neutral-base-500 border-neutral-base-100 hover:border-neutral-base-300"
                                                    )}
                                                >
                                                    Semua
                                                </button>
                                                <button
                                                    onClick={() => setStockFilter("in_stock")}
                                                    className={cn(
                                                        "h-8 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all",
                                                        stockFilter === "in_stock"
                                                            ? "bg-emerald-600 text-white border-emerald-600"
                                                            : "bg-white text-neutral-base-500 border-neutral-base-100 hover:border-emerald-300"
                                                    )}
                                                >
                                                    Tersedia
                                                </button>
                                                <button
                                                    onClick={() => setStockFilter("out_of_stock")}
                                                    className={cn(
                                                        "h-8 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all",
                                                        stockFilter === "out_of_stock"
                                                            ? "bg-rose-500 text-white border-rose-500"
                                                            : "bg-white text-neutral-base-500 border-neutral-base-100 hover:border-rose-300"
                                                    )}
                                                >
                                                    Habis
                                                </button>

                                                {/* Separator */}
                                                {categories.length > 0 && (
                                                    <div className="w-px h-5 bg-neutral-base-100 mx-1" />
                                                )}

                                                {/* Category pills */}
                                                <button
                                                    onClick={() => setSelectedCategory("all")}
                                                    className={cn(
                                                        "h-8 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all",
                                                        selectedCategory === "all"
                                                            ? "bg-neutral-base-900 text-white border-neutral-base-900"
                                                            : "bg-white text-neutral-base-500 border-neutral-base-100 hover:border-neutral-base-300"
                                                    )}
                                                >
                                                    Semua Kategori
                                                </button>
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={cn(
                                                            "h-8 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all",
                                                            selectedCategory === cat
                                                                ? "bg-neutral-base-900 text-white border-neutral-base-900"
                                                                : "bg-white text-neutral-base-500 border-neutral-base-100 hover:border-neutral-base-300"
                                                        )}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}

                                                {/* Clear all filters */}
                                                {activeFilterCount > 0 && (
                                                    <button
                                                        onClick={clearFilters}
                                                        className="h-8 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-50 border border-rose-200 transition-all flex items-center gap-1"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        Reset
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Fade Mask */}
                                        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-neutral-base-50/30 to-transparent pointer-events-none hidden md:block" />
                                    </div>

                                    {/* Results count */}
                                    <ResultsInfo
                                        currentPage={currentPage}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                        totalItems={processedItems.length}
                                        className="mb-4"
                                    />
                                </div>
                            )}

                            {/* Wishlist Content */}
                            {isLoading ? (
                                <WishlistGridSkeleton />
                            ) : items.length === 0 ? (
                                <div className="py-32 text-center bg-white border border-neutral-base-100 rounded-[32px]">
                                    <Heart className="w-12 h-12 text-neutral-base-100 mx-auto mb-6" />
                                    <h2 className="text-[20px] font-bold text-neutral-base-900 mb-2">
                                        Wishlist Anda kosong
                                    </h2>
                                    <p className="text-[14px] text-neutral-base-400 font-medium mb-8">
                                        Simpan produk favorit dengan menekan ikon ❤️ di halaman produk.
                                    </p>
                                    <Link
                                        href="/products"
                                        className="inline-flex h-12 items-center px-8 bg-neutral-base-900 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-neutral-base-800 transition-all"
                                    >
                                        Jelajahi Produk
                                    </Link>
                                </div>
                            ) : processedItems.length === 0 ? (
                                <div className="py-20 text-center bg-white border border-dashed border-neutral-base-200 rounded-3xl">
                                    <Search className="w-10 h-10 text-neutral-base-200 mx-auto mb-4" />
                                    <h2 className="text-[18px] font-bold text-neutral-base-700 mb-2">
                                        Tidak ada produk ditemukan
                                    </h2>
                                    <p className="text-[13px] text-neutral-base-400 font-medium mb-6">
                                        Coba ubah filter atau kata pencarian Anda.
                                    </p>
                                    <button
                                        onClick={clearFilters}
                                        className="text-[12px] font-bold tracking-widest uppercase border-b border-neutral-base-900 pb-1 hover:text-amber-900 hover:border-amber-900 transition-colors"
                                    >
                                        Reset Filter
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <LayoutGroup>
                                        <motion.div
                                            layout
                                            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {paginatedItems.map((item, idx) => {
                                                    const colors = parseColors(item.colors);
                                                    const stock = parseInt(item.total_stock || "0");
                                                    const isRemoving = removingIds.has(item.produk_id);

                                                    return (
                                                        <motion.div
                                                            key={item.produk_id}
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: isRemoving ? 0 : 1, scale: isRemoving ? 0.9 : 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            transition={{ duration: 0.3, delay: idx * 0.03 }}
                                                        >
                                                            <Link
                                                                href={`/products/${item.produk_id}`}
                                                                className="block group"
                                                            >
                                                                <div className="flex flex-col h-full bg-white transition-all duration-500 ease-out group-hover:-translate-y-1">
                                                                    {/* Image */}
                                                                    <div className="relative aspect-3/4 overflow-hidden bg-neutral-base-50 rounded-sm mb-4 shadow-sm group-hover:shadow-md transition-shadow duration-500">
                                                                        <Image
                                                                            src={item.gambar ? `${ASSET_URL}/img/produk/${item.gambar}` : "/placeholder.jpg"}
                                                                            alt={item.nama_produk}
                                                                            fill
                                                                            className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                                                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                                        />

                                                                        {/* Out of Stock Overlay */}
                                                                        {stock === 0 && (
                                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-1">
                                                                                <span className="text-white text-[9px] font-bold uppercase tracking-widest">
                                                                                    Habis
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        {/* Remove Button */}
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <motion.button
                                                                                    onClick={(e) => handleRemove(e, item.produk_id)}
                                                                                    disabled={isRemoving}
                                                                                    className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm z-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50"
                                                                                    whileHover={{ scale: 1.1 }}
                                                                                    whileTap={{ scale: 0.9 }}
                                                                                >
                                                                                    {isRemoving ? (
                                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-base-400" />
                                                                                    ) : (
                                                                                        <Trash2 className="w-3.5 h-3.5 text-neutral-base-400 hover:text-red-500 transition-colors" />
                                                                                    )}
                                                                                </motion.button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent className="bg-neutral-base-900 text-white border-none text-[10px] font-bold py-1 px-2 mb-1">
                                                                                Hapus dari Wishlist
                                                                            </TooltipContent>
                                                                        </Tooltip>

                                                                        {/* Subtle Hover Overlay */}
                                                                        <div className="absolute inset-0 bg-neutral-base-900/0 group-hover:bg-neutral-base-900/5 transition-colors duration-500 pointer-events-none" />
                                                                    </div>

                                                                    {/* Info */}
                                                                    <div className="flex justify-between items-start gap-3 px-1">
                                                                        <div className="flex-1 min-w-0 space-y-1.5">
                                                                            <p className="text-[11px] text-neutral-base-400 font-bold uppercase tracking-wider">
                                                                                {item.kategori}
                                                                            </p>
                                                                            <h3 className="text-[14px] md:text-[15px] font-medium text-neutral-base-900 leading-tight truncate group-hover:text-amber-900 transition-colors duration-300">
                                                                                {item.nama_produk}
                                                                            </h3>
                                                                            <p className="text-[15px] md:text-[16px] font-bold text-neutral-base-900 tracking-tight">
                                                                                {formatPriceRange(item.min_price, item.max_price)}
                                                                            </p>
                                                                        </div>

                                                                        {/* Color Dots */}
                                                                        {colors.length > 0 && (
                                                                            <div className="flex flex-col items-end pt-8 pb-1 shrink-0">
                                                                                <div className="flex items-center gap-1">
                                                                                    {colors.slice(0, 3).map((color, cIdx) => (
                                                                                        <Tooltip key={cIdx}>
                                                                                            <TooltipTrigger asChild>
                                                                                                <div
                                                                                                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-sm"
                                                                                                    style={{ backgroundColor: color.value }}
                                                                                                />
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent className="bg-neutral-base-900 text-white border-none text-[10px] font-bold py-1 px-2 mb-1">
                                                                                                {color.name}
                                                                                            </TooltipContent>
                                                                                        </Tooltip>
                                                                                    ))}
                                                                                    {colors.length > 3 && (
                                                                                        <div className="w-3.5 h-3.5 rounded-full bg-neutral-base-100 ring-2 ring-white flex items-center justify-center text-[6px] font-bold text-neutral-base-500">
                                                                                            +{colors.length - 3}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </motion.div>
                                    </LayoutGroup>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="mt-12">
                                            <PaginationControls
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                onPageChange={(page) => {
                                                    setCurrentPage(page);
                                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                                }}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </TooltipProvider>
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
