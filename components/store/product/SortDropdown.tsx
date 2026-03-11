"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortOption } from "@/components/store/product/ProductListHeader";

interface SortDropdownProps {
    sortBy: SortOption;
    onSortChange: (option: SortOption) => void;
}

export default function SortDropdown({ sortBy, onSortChange }: SortDropdownProps) {
    const options: { value: SortOption; label: string }[] = [
        { value: "newest", label: "Terbaru" },
        { value: "price_asc", label: "Harga Terendah" },
        { value: "price_desc", label: "Harga Tertinggi" },
        { value: "name_asc", label: "Nama A-Z" },
    ];

    const currentLabel = options.find(o => o.value === sortBy)?.label || "Terbaru";

    return (
        <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[13px] text-neutral-base-400 font-montserrat">Urutkan:</span>
            <div className="relative group">
                <button className="flex items-center gap-2 text-[13px] font-bold text-neutral-base-900 hover:text-neutral-base-600 transition-colors font-montserrat tracking-tight">
                    {currentLabel}
                    <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-base-100 shadow-xl rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onSortChange(option.value)}
                            className={cn(
                                "w-full text-left px-4 py-2 text-[13px] hover:bg-neutral-base-50 transition-colors font-montserrat",
                                sortBy === option.value ? "text-neutral-base-900 font-bold" : "text-neutral-base-500"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
