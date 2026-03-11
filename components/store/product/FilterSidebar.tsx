/**
 * FilterSidebar Component
 *
 * Komponen sidebar untuk memfilter daftar produk berdasarkan:
 * - Kategori (Collection)
 * - Harga
 * - Warna
 * - Ukuran
 *
 * Fitur:
 * - Collapsible sections (Bisa buka/tutup per section)
 * - Show more/less untuk list yang panjang
 * - Sinkronisasi dengan URL search params (via parent)
 * - Animasi halus dengan Framer Motion
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Box, ChevronDown, Check, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

/** Type untuk item kategori/koleksi */
export type FilterCollectionItem = {
    name: string;
    icon?: string | null;
};

/** Konstanta default jika data dari props kosong */
const DEFAULT_SIZES = ["S", "M", "L", "XL"];
const DEFAULT_COLORS = [
    { name: "Navy", value: "#1A1B2D" },
    { name: "White", value: "#FFFFFF" },
    { name: "Tan", value: "#D2B48C" },
    { name: "Olive", value: "#808000" },
];

/** Rentang harga yang didukung backend */
const PRICE_RANGES = [
    "Di bawah Rp 500rb",
    "Rp 500rb - Rp 1.5jt",
    "Di atas Rp 1.5jt"
];

/** Jumlah item awal yang tampil sebelum tombol "Lihat Semua" muncul */
const INITIAL_VISIBLE_COUNT = 5;

/** Interface state filter utama */
export interface FilterState {
    size: string[];
    color: string[];
    price: string[];
    collection: string[];
    search?: string;
}

interface FilterSidebarProps {
    /** State filter yang sedang aktif */
    activeFilters: FilterState;
    /** Callback saat filter berubah */
    onFilterChange: (category: keyof FilterState, value: string) => void;
    /** Class tambahan untuk styling wrapper */
    className?: string;
    /** Daftar kategori dinamis dari API */
    collections?: FilterCollectionItem[];
    /** Daftar warna dinamis dari API */
    colors?: { name: string; value: string }[];
    /** Daftar ukuran dinamis dari API */
    sizes?: string[];
}

export default function FilterSidebar({
    activeFilters,
    onFilterChange,
    className,
    collections: dynamicCollections,
    colors: dynamicColors,
    sizes: dynamicSizes
}: FilterSidebarProps) {
    // --- Local State ---

    // Status buka/tutup section (Kategori, Harga, dll)
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        collection: true,
        price: true,
        color: true,
        size: true,
    });

    // Status "Show More" untuk setiap section
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    // --- Handlers ---

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleExpanded = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    /** Cek apakah ada filter yang sedang aktif */
    const hasActiveFilters = Object.values(activeFilters).some(val =>
        Array.isArray(val) ? val.length > 0 : !!val
    );

    /** Hapus seluruh filter sekaligus */
    const clearAllFilters = () => {
        Object.entries(activeFilters).forEach(([category, values]) => {
            if (Array.isArray(values)) {
                // Gunakan copy array karena loop sambil manipulasi bisa bermasalah
                [...values].forEach((value: string) => {
                    onFilterChange(category as keyof FilterState, value);
                });
            } else if (values) {
                onFilterChange(category as keyof FilterState, values as string);
            }
        });
    };

    /** Hitung jumlah filter aktif per kategori */
    const getActiveCount = (section: keyof FilterState) => activeFilters[section]?.length || 0;

    // --- Sub-components (Internal) ---

    /** Header section filter dengan tombol toggle */
    const SectionHeader = ({ title, section, isOpen }: { title: string; section: string; isOpen: boolean }) => {
        const count = getActiveCount(section as keyof FilterState);
        return (
            <button
                onClick={() => toggleSection(section)}
                className="flex items-center justify-between w-full py-2 group"
            >
                <div className="flex items-center gap-2">
                    <h3 className="text-[12px] font-semibold tracking-[0.08em] uppercase text-neutral-base-900 transition-colors group-hover:text-neutral-base-700 font-montserrat">
                        {title}
                    </h3>
                    {count > 0 && (
                        <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-neutral-base-900 text-white text-[9px] font-bold">
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

    /** Tombol untuk ekspansi list (Lihat Semua / Sembunyikan) */
    const ShowMoreButton = ({ section, totalCount, visibleCount = INITIAL_VISIBLE_COUNT }: { section: string; totalCount: number, visibleCount?: number }) => {
        if (totalCount <= visibleCount) return null;
        const isExpanded = expandedSections[section];
        const remaining = totalCount - visibleCount;
        return (
            <button
                onClick={() => toggleExpanded(section)}
                className="flex items-center gap-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-base-900 transition-colors font-montserrat tracking-tight mt-3 pl-3"
            >
                {isExpanded ? "Sembunyikan" : `Lihat Semua (${remaining} lainnya)`}
                <ChevronRight className={cn("w-3 h-3 transition-transform duration-200", isExpanded && "rotate-90")} />
            </button>
        );
    };

    // --- Data processing ---

    const allCategories = dynamicCollections || [];
    const visibleCategories = expandedSections.collection ? allCategories : allCategories.slice(0, INITIAL_VISIBLE_COUNT);

    const allColors = dynamicColors || DEFAULT_COLORS;
    const visibleColors = expandedSections.color ? allColors : allColors.slice(0, 8);

    const allSizes = dynamicSizes || DEFAULT_SIZES;
    const visibleSizes = expandedSections.size ? allSizes : allSizes.slice(0, 8);

    const sectionAnimation = {
        initial: { height: 0, opacity: 0 },
        animate: { height: "auto", opacity: 1 },
        exit: { height: 0, opacity: 0 },
        transition: { duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] as const }
    };

    return (
        <aside className={cn("w-full shrink-0 font-montserrat", className)}>
            {/* Header Sidebar */}
            <div className="flex items-center justify-between mb-8 pr-6">
                <h2 className="text-[24px] font-bold text-neutral-base-900 font-montserrat tracking-tight">Filter</h2>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-neutral-base-400 hover:text-neutral-base-900 transition-all group"
                    >
                        <div className="w-5 h-5 rounded-full bg-neutral-base-50 flex items-center justify-center group-hover:bg-neutral-base-100 transition-colors">
                            <X className="w-3 h-3" />
                        </div>
                        Hapus Filter
                    </button>
                )}
            </div>

            <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-8 pb-12 pr-4">

                    {/* --- Kategori (Collection) --- */}
                    {allCategories.length > 0 && (
                        <div className="space-y-4">
                            <SectionHeader title="Kategori" section="collection" isOpen={openSections.collection} />
                            <AnimatePresence initial={false}>
                                {openSections.collection && (
                                    <motion.div {...sectionAnimation} className="overflow-hidden">
                                        <div className="space-y-1 pt-1">
                                            {visibleCategories.map((catItem) => {
                                                const cat = catItem.name;
                                                const isActive = activeFilters.collection.includes(cat);

                                                return (
                                                    <button
                                                        key={cat}
                                                        onClick={() => onFilterChange("collection", cat)}
                                                        className={cn(
                                                            "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200 text-[14px] font-medium leading-5 group font-montserrat tracking-tight active:scale-[0.98]",
                                                            isActive
                                                                ? "bg-neutral-base-100 text-neutral-base-900 scale-[1.02]"
                                                                : "text-neutral-base-600 hover:bg-neutral-base-100 hover:text-neutral-base-900"
                                                        )}
                                                    >
                                                        {catItem.icon ? (
                                                            <i className={cn(catItem.icon, "w-4 h-4 flex items-center justify-center transition-colors", isActive ? "text-neutral-base-900" : "text-neutral-base-400 group-hover:text-neutral-base-900")}></i>
                                                        ) : (
                                                            <Box className={cn("w-4 h-4 transition-colors", isActive ? "text-neutral-base-900" : "text-neutral-base-400 group-hover:text-neutral-base-900")} strokeWidth={isActive ? 2.5 : 2} />
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
                            <div className="h-px bg-black/10 mt-8" />
                        </div>
                    )}

                    {/* --- Harga --- */}
                    <div className="space-y-4">
                        <SectionHeader title="Harga" section="price" isOpen={openSections.price} />
                        <AnimatePresence initial={false}>
                            {openSections.price && (
                                <motion.div {...sectionAnimation} className="overflow-hidden">
                                    <div className="space-y-1 pt-1">
                                        {PRICE_RANGES.map((range) => {
                                            const isActive = activeFilters.price.includes(range);
                                            return (
                                                <button
                                                    key={range}
                                                    onClick={() => onFilterChange("price", range)}
                                                    className={cn(
                                                        "flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-left text-[14px] font-normal transition-all duration-200 group font-montserrat tracking-tight active:scale-[0.98]",
                                                        isActive
                                                            ? "bg-neutral-base-100 text-neutral-base-900 scale-[1.01]"
                                                            : "text-neutral-base-600 hover:bg-neutral-base-50 hover:text-neutral-base-900"
                                                    )}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-[18px] h-[18px] border-2 rounded flex items-center justify-center transition-all",
                                                            isActive ? "border-neutral-base-900 bg-neutral-base-900" : "border-neutral-base-200 group-hover:border-neutral-base-400"
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
                        <div className="h-px bg-black/10 mt-8" />
                    </div>

                    {/* --- Warna --- */}
                    <div className="space-y-4">
                        <SectionHeader title="Warna" section="color" isOpen={openSections.color} />
                        <AnimatePresence initial={false}>
                            {openSections.color && (
                                <motion.div {...sectionAnimation} className="overflow-hidden">
                                    <div className="flex flex-wrap gap-3 p-1">
                                        {visibleColors.map((color) => {
                                            const isActive = activeFilters.color.includes(color.name);
                                            return (
                                                <button
                                                    key={color.value}
                                                    onClick={() => onFilterChange("color", color.name)}
                                                    className={cn(
                                                        "relative w-[25px] h-[25px] rounded-full border-2 transition-all duration-200 group ring-offset-2 active:scale-90",
                                                        isActive
                                                            ? "border-neutral-base-900 ring-2 ring-neutral-base-900 scale-110"
                                                            : "border-neutral-base-100 hover:border-neutral-base-400 hover:scale-105"
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
                                    <ShowMoreButton section="color" totalCount={allColors.length} visibleCount={8} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="h-px bg-black/10 mt-8" />
                    </div>

                    {/* --- Ukuran --- */}
                    <div className="space-y-4">
                        <SectionHeader title="Ukuran" section="size" isOpen={openSections.size} />
                        <AnimatePresence initial={false}>
                            {openSections.size && (
                                <motion.div {...sectionAnimation} className="overflow-hidden">
                                    <div className="grid grid-cols-4 gap-2 pt-1">
                                        {visibleSizes.map((s) => {
                                            const isActive = activeFilters.size.includes(s);
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => onFilterChange("size", s)}
                                                    className={cn(
                                                        "h-9 rounded-lg border text-[14px] font-normal transition-all duration-200 font-montserrat active:scale-[0.95]",
                                                        isActive
                                                            ? "bg-neutral-base-100 border-neutral-base-200 text-neutral-base-900 scale-[1.05]"
                                                            : "bg-white border-neutral-base-200 text-neutral-base-600 hover:border-neutral-base-900 hover:text-neutral-base-900 hover:shadow-sm"
                                                    )}
                                                >
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <ShowMoreButton section="size" totalCount={allSizes.length} visibleCount={8} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </ScrollArea>
        </aside>
    );
}
