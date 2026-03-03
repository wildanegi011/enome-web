"use client";

import React from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchInput from "@/components/store/shared/SearchInput";

interface WishlistFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    sortBy: string;
    setSortBy: (val: any) => void;
    stockFilter: string;
    setStockFilter: (val: any) => void;
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    categories: string[];
    activeFilterCount: number;
    clearFilters: () => void;
    sortOptions: { value: string; label: string }[];
}

const WishlistFilters = ({
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    stockFilter,
    setStockFilter,
    selectedCategory,
    setSelectedCategory,
    categories,
    activeFilterCount,
    clearFilters,
    sortOptions
}: WishlistFiltersProps) => {
    return (
        <div className="space-y-4 mb-8">
            {/* Search + Sort Row */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <SearchInput
                    placeholder="Cari produk wishlist..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                />

                {/* Sort */}
                <div className="relative shrink-0">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-11 pl-4 pr-10 bg-white border border-neutral-base-100 rounded-xl text-[13px] font-bold text-neutral-base-700 outline-none focus:border-neutral-base-300 appearance-none cursor-pointer transition-all w-full sm:w-auto"
                    >
                        {sortOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300 pointer-events-none" />
                </div>
            </div>

            {/* Category + Stock Filter Pills */}
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
                <div className="absolute right-0 top-0 bottom-2 w-12 bg-linear-to-l from-neutral-base-50/30 to-transparent pointer-events-none hidden md:block" />
            </div>
        </div>
    );
};

export default WishlistFilters;
