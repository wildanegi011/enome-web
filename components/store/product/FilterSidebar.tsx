"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shirt, Box, Watch, ChevronDown, Check, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const categoryIcons: Record<string, any> = {
    "Kemeja": Shirt,
    "Outer": Box,
    "Aksesori": Watch,
    "Man": Shirt,
    "Table runner": Box,
    "Dress": Shirt,
    "Scarf": Watch,
    "Kids": Shirt,
    "Bags": Box,
};

export type FilterCollectionItem = {
    name: string;
    icon?: string | null;
};

const DEFAULT_SIZES = ["S", "M", "L", "XL"];
const DEFAULT_COLORS = [
    { name: "Navy", value: "#1A1B2D" },
    { name: "White", value: "#FFFFFF" },
    { name: "Tan", value: "#D2B48C" },
    { name: "Olive", value: "#808000" },
];

const priceRanges = [
    "< Rp 500.000", "Rp 500.000 - Rp 1.500.000", "> Rp 1.500.000"
];

const INITIAL_VISIBLE_COUNT = 5;

export interface FilterState {
    size: string[];
    color: string[];
    price: string[];
    collection: string[];
    tag: string[];
    search?: string;
}

interface FilterSidebarProps {
    activeFilters: FilterState;
    onFilterChange: (category: keyof FilterState, value: string) => void;
    className?: string;
    collections?: FilterCollectionItem[];
    colors?: { name: string; value: string }[];
    sizes?: string[];
}

export default function FilterSidebar({ activeFilters, onFilterChange, className, collections: dynamicCollections, colors: dynamicColors, sizes: dynamicSizes }: FilterSidebarProps) {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        collection: true,
        price: true,
        color: true,
        size: true,
    });

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleExpanded = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const hasActiveFilters = Object.values(activeFilters).some(val =>
        Array.isArray(val) ? val.length > 0 : !!val
    );

    const clearAllFilters = () => {
        Object.entries(activeFilters).forEach(([category, values]) => {
            if (Array.isArray(values)) {
                values.forEach((value: string) => {
                    onFilterChange(category as keyof FilterState, value);
                });
            } else if (values) {
                // Handle non-array values like 'search'
                onFilterChange(category as keyof FilterState, values as string);
            }
        });
    };

    const getActiveCount = (section: keyof FilterState) => activeFilters[section]?.length || 0;

    const SectionHeader = ({ title, section, isOpen }: { title: string; section: string; isOpen: boolean }) => {
        const count = getActiveCount(section as keyof FilterState);
        return (
            <button
                onClick={() => toggleSection(section)}
                className="flex items-center justify-between w-full py-2 group"
            >
                <div className="flex items-center gap-2">
                    <h3 className="text-[18px] font-bold tracking-[0.2em] uppercase text-neutral-base-900 transition-colors group-hover:text-amber-800 font-montserrat">
                        {title}
                    </h3>
                    {count > 0 && (
                        <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                            {count}
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={cn(
                        "w-3.5 h-3.5 text-neutral-base-400 transition-transform duration-300",
                        isOpen && "rotate-180 text-neutral-base-900"
                    )}
                />
            </button>
        );
    };

    const ShowMoreButton = ({ section, totalCount }: { section: string; totalCount: number }) => {
        if (totalCount <= INITIAL_VISIBLE_COUNT) return null;
        const isExpanded = expandedSections[section];
        const remaining = totalCount - INITIAL_VISIBLE_COUNT;
        return (
            <button
                onClick={() => toggleExpanded(section)}
                className="flex items-center gap-2 text-[14px] font-bold text-neutral-base-900 hover:text-neutral-base-600 transition-colors font-montserrat tracking-tight mt-3 pl-3"
            >
                {isExpanded ? "Sembunyikan" : `Lihat Semua (${remaining} lainnya)`}
                <ChevronRight className={cn("w-3 h-3 transition-transform duration-200", isExpanded && "rotate-90")} />
            </button>
        );
    };

    const allCategories: FilterCollectionItem[] = dynamicCollections || [
        { name: "Kemeja" },
        { name: "Outer" },
        { name: "Aksesori" }
    ];
    const visibleCategories = expandedSections.collection ? allCategories : allCategories.slice(0, INITIAL_VISIBLE_COUNT);

    const allColors = dynamicColors || DEFAULT_COLORS;
    const visibleColors = expandedSections.color ? allColors : allColors.slice(0, 8);

    const allSizes = dynamicSizes || DEFAULT_SIZES;
    const visibleSizes = expandedSections.size ? allSizes : allSizes.slice(0, 8);

    return (
        <aside className={cn("w-full shrink-0 font-montserrat", className)}>
            <div className="flex items-center justify-between mb-8 pr-6">
                <h2 className="text-[26px] font-bold text-neutral-base-900 font-montserrat tracking-tight">Filter</h2>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-neutral-base-400 hover:text-amber-800 transition-all group"
                    >
                        <div className="w-5 h-5 rounded-full bg-neutral-base-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                            <X className="w-3 h-3" />
                        </div>
                        Hapus Semua
                    </button>
                )}
            </div>

            <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="space-y-6 pb-12 overflow-x-hidden">
                    {/* Categories */}
                    <div className="space-y-4">
                        <SectionHeader title="Kategori" section="collection" isOpen={openSections.collection} />
                        <AnimatePresence initial={false}>
                            {openSections.collection && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-1 pt-1">
                                        {visibleCategories.map((catItem) => {
                                            const cat = catItem.name;
                                            const isActive = activeFilters.collection.includes(cat);
                                            const FallbackIcon = categoryIcons[cat] || Box;

                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => onFilterChange("collection", cat)}
                                                    className={cn(
                                                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all text-[14px] font-semibold group font-montserrat tracking-tight",
                                                        isActive
                                                            ? "bg-neutral-base-900 text-white shadow-md shadow-neutral-base-200"
                                                            : "text-neutral-base-600 hover:bg-neutral-base-50 hover:text-neutral-base-900"
                                                    )}
                                                >
                                                    {catItem.icon ? (
                                                        <i className={cn(catItem.icon, "w-4 h-4 flex items-center justify-center transition-colors", isActive ? "text-white" : "text-neutral-base-400 group-hover:text-neutral-base-900")}></i>
                                                    ) : (
                                                        <FallbackIcon className={cn("w-4 h-4 transition-colors", isActive ? "text-white" : "text-neutral-base-400 group-hover:text-neutral-base-900")} strokeWidth={isActive ? 2.5 : 2} />
                                                    )}
                                                    {cat}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <ShowMoreButton section="collection" totalCount={allCategories.length} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="h-px bg-neutral-base-50 mt-6" />
                    </div>

                    {/* Price Range */}
                    <div className="space-y-4">
                        <SectionHeader title="Harga" section="price" isOpen={openSections.price} />
                        <AnimatePresence initial={false}>
                            {openSections.price && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-1 pt-1">
                                        {priceRanges.map((range) => {
                                            const isActive = activeFilters.price.includes(range);
                                            return (
                                                <button
                                                    key={range}
                                                    onClick={() => onFilterChange("price", range)}
                                                    className={cn(
                                                        "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-left text-[14px] font-semibold transition-all group font-montserrat tracking-tight",
                                                        isActive
                                                            ? "bg-amber-50 text-amber-900"
                                                            : "text-neutral-base-600 hover:bg-neutral-base-50 hover:text-neutral-base-900 font-medium"
                                                    )}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-4 h-4 border-2 rounded flex items-center justify-center transition-all",
                                                            isActive ? "border-blue-600 bg-blue-600" : "border-neutral-base-200 group-hover:border-neutral-base-400"
                                                        )}>
                                                            {isActive && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                                                        </div>
                                                        {range}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="h-px bg-neutral-base-50 mt-6" />
                    </div>

                    {/* Color */}
                    <div className="space-y-4">
                        <SectionHeader title="Warna" section="color" isOpen={openSections.color} />
                        <AnimatePresence initial={false}>
                            {openSections.color && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex flex-wrap gap-2.5 p-1">
                                        {visibleColors.map((color) => {
                                            const isActive = activeFilters.color.includes(color.name);
                                            return (
                                                <button
                                                    key={color.value}
                                                    onClick={() => onFilterChange("color", color.name)}
                                                    className={cn(
                                                        "relative w-9 h-9 rounded-full border-2 transition-all group ring-offset-2",
                                                        isActive
                                                            ? "border-neutral-base-900 ring-2 ring-neutral-base-900"
                                                            : "border-neutral-base-100 hover:border-neutral-base-400"
                                                    )}
                                                    title={color.name}
                                                >
                                                    <div
                                                        className="absolute inset-0.5 rounded-full"
                                                        style={{ backgroundColor: color.value }}
                                                    />
                                                    {isActive && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className={cn(
                                                                "w-1.5 h-1.5 rounded-full",
                                                                color.name.toLowerCase() === "white" ? "bg-black" : "bg-white"
                                                            )} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {allColors.length > 8 && (
                                        <ShowMoreButton section="color" totalCount={allColors.length} />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="h-px bg-neutral-base-50 mt-6" />
                    </div>

                    {/* Size */}
                    <div className="space-y-4">
                        <SectionHeader title="Ukuran" section="size" isOpen={openSections.size} />
                        <AnimatePresence initial={false}>
                            {openSections.size && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-4 gap-2 pt-1">
                                        {visibleSizes.map((s) => {
                                            const isActive = activeFilters.size.includes(s);
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => onFilterChange("size", s)}
                                                    className={cn(
                                                        "h-10 rounded-lg border text-[13px] font-bold transition-all font-montserrat",
                                                        isActive
                                                            ? "bg-neutral-base-900 border-neutral-base-900 text-white shadow-md shadow-neutral-base-200 scale-[1.03]"
                                                            : "bg-white border-neutral-base-200 text-neutral-base-600 hover:border-neutral-base-900 hover:text-neutral-base-900"
                                                    )}
                                                >
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {allSizes.length > 8 && (
                                        <ShowMoreButton section="size" totalCount={allSizes.length} />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </ScrollArea>
        </aside>
    );
}
