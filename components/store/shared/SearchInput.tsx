"use client";

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const SearchInput = ({ value, onChange, placeholder = "Cari...", className }: SearchInputProps) => {
    return (
        <div className={cn("relative group flex-1 w-full", className)}>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300 group-focus-within:text-neutral-base-900 transition-colors" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-12 pl-12 pr-6 rounded-2xl border border-neutral-base-100 bg-white text-[13px] font-medium outline-none focus:ring-4 focus:ring-neutral-base-900/5 transition-all"
            />
        </div>
    );
};

export default SearchInput;
