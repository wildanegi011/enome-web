"use client";

import ResultsInfo from "@/components/store/shared/ResultsInfo";
import SortDropdown from "@/components/store/product/SortDropdown";
import { SortOption } from "@/components/store/product/ProductListHeader";

import { Loader2 } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";

interface ProductsHeaderProps {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    sortBy: SortOption;
    onSortChange: (option: SortOption) => void;
    isRefreshing?: boolean;
}

export default function StickyHeader({
    currentPage,
    itemsPerPage,
    totalItems,
    sortBy,
    onSortChange,
    isRefreshing = false
}: ProductsHeaderProps) {
    return (
        <div className="sticky top-[80px] z-40 bg-white/95 backdrop-blur-md py-4 mb-6 border-b border-neutral-base-50 -mx-4 px-4 md:-mx-8 md:px-8 lg:mx-0 lg:px-0">
            {/* Subtle Loading Overlay */}
            <AnimatePresence>
                {isRefreshing && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 -bottom-[1px] z-10 flex justify-center"
                    >
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-neutral-base-100 h-fit translate-y-1/2">
                            <Loader2 className="w-3 h-3 animate-spin text-neutral-base-900" />
                            <span className="text-[9px] font-bold tracking-[0.2em] uppercase font-montserrat italic">Updating...</span>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
            <div className="flex items-center justify-between">
                <ResultsInfo
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                />
                <SortDropdown sortBy={sortBy} onSortChange={onSortChange} />
            </div>
        </div>
    );
}
