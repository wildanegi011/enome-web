"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortOption } from "@/components/store/product/ProductListHeader";

interface SortDropdownProps {
    sortBy: SortOption;
    onSortChange: (option: SortOption) => void;
}

export default function SortDropdown({ sortBy, onSortChange }: SortDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const options: { value: SortOption; label: string }[] = [
        { value: "newest", label: "Terbaru" },
        { value: "price_asc", label: "Harga Terendah" },
        { value: "price_desc", label: "Harga Tertinggi" },
        { value: "name_asc", label: "Nama A-Z" },
    ];

    const currentLabel = options.find(o => o.value === sortBy)?.label || "Terbaru";

    // Handle outside click to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[13px] text-neutral-base-400 font-montserrat">Urutkan:</span>
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 text-[13px] font-bold text-neutral-base-900 hover:text-neutral-base-600 transition-colors font-montserrat tracking-tight outline-none"
                >
                    {currentLabel}
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} />
                </button>
                <div 
                    className={cn(
                        "absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-base-100 shadow-xl rounded-xl py-2 transition-all z-20",
                        isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
                    )}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onSortChange(option.value);
                                setIsOpen(false);
                            }}
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
