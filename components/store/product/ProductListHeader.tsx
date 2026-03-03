"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import Breadcrumb from "@/components/store/shared/Breadcrumb";
import { cn } from "@/lib/utils";

export type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";

interface ProductListHeaderProps {
    sortBy: SortOption;
    onSortChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Terbaru" },
    { value: "price_asc", label: "Harga Terendah" },
    { value: "price_desc", label: "Harga Tertinggi" },
    { value: "name_asc", label: "Nama A-Z" },
];

export default function ProductListHeader({ sortBy, onSortChange }: ProductListHeaderProps) {
    const currentSort = sortOptions.find(opt => opt.value === sortBy)?.label || "Terbaru";

    return (
        <div className="flex items-center justify-between py-6 font-sans">
            {/* Breadcrumbs */}
            <Breadcrumb
                items={[
                    { label: "Beranda", href: "/" },
                    { label: "Katalog" }
                ]}
            />

            {/* Sorting */}
            <div className="flex items-center gap-2">
                <span className="text-[14px] text-neutral-base-400">Urutkan:</span>
                <div className="relative group">
                    <button className="flex items-center gap-2 text-[14px] font-bold text-neutral-base-900 hover:text-neutral-base-600 transition-colors">
                        {currentSort}
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-base-100 shadow-xl rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                        {sortOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => onSortChange(option.value)}
                                className={cn(
                                    "w-full text-left px-4 py-2 text-[13px] hover:bg-neutral-base-50 transition-colors",
                                    sortBy === option.value ? "text-neutral-base-900 font-bold" : "text-neutral-base-500"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
