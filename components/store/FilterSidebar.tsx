"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, CircleDot, Circle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const sizes = ["S", "M", "L", "XL"];
const colors = [
    { name: "Coral", value: "#FF7F50" },
    { name: "Orange", value: "#FF4500" },
    { name: "Lime", value: "#32CD32" },
    { name: "Cyan", value: "#00FFFF" },
    { name: "Blue", value: "#0000FF" },
    { name: "Purple", value: "#800080" },
    { name: "Pink", value: "#FFC0CB" },
    { name: "Red", value: "#FF0000" },
];

const priceRanges = [
    "Under Rp 500k", "Rp 500k - Rp 1.5M", "Above Rp 1.5M"
];

const collections = [
    "Man", "Table runner", "Outer", "Dress", "Scarf", "Kids", "Bags"
];

const tags = [
    "Fashion", "Batik", "Sandal", "Belt", "Bags", "Snacker", "kain", "outer", "bomber", "Sunglasses"
];

export interface FilterState {
    size: string[];
    color: string[];
    price: string[];
    collection: string[];
    tag: string[];
}

interface FilterSidebarProps {
    activeFilters: FilterState;
    onFilterChange: (category: keyof FilterState, value: string) => void;
    className?: string;
    collections?: string[];
}

export default function FilterSidebar({ activeFilters, onFilterChange, className, collections: dynamicCollections }: FilterSidebarProps) {
    const displayCollections = dynamicCollections || collections;
    // Open all by default for visibility, but allow toggling
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        size: true,
        color: true,
        price: true,
        collection: true,
        tag: true
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const AccordionSection = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => (
        <div className="border-b border-neutral-base-100 py-6 first:pt-0">
            <button
                onClick={() => toggleSection(id)}
                className="w-full flex items-center justify-between group"
            >
                <span className="text-[13px] font-bold tracking-[0.15em] uppercase text-neutral-base-900 group-hover:text-amber-800 transition-colors">
                    {title}
                </span>
                <motion.div
                    animate={{ rotate: openSections[id] ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="text-neutral-base-400 group-hover:text-neutral-base-900 transition-colors"
                >
                    <ChevronDown className="w-5 h-5" strokeWidth={1.5} />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {openSections[id] && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pt-6 pb-2">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <aside className={cn("w-full shrink-0 font-sans", className)}>
            <div className="flex items-center justify-between mb-10">
                <h2 className="font-serif text-[36px] font-medium text-neutral-base-900 tracking-tight">Filters</h2>
            </div>

            <div className="space-y-0">
                {/* Size */}
                <AccordionSection id="size" title="Size">
                    <div className="flex flex-wrap gap-3">
                        {sizes.map((size) => {
                            const isActive = activeFilters.size.includes(size);
                            return (
                                <button
                                    key={size}
                                    onClick={() => onFilterChange("size", size)}
                                    className={`w-12 h-12 flex items-center justify-center text-[13px] font-bold transition-all rounded-full ${isActive
                                        ? "bg-neutral-base-900 text-white shadow-md ring-2 ring-offset-2 ring-neutral-base-900"
                                        : "border border-neutral-base-200 text-neutral-base-600 hover:border-neutral-base-900 hover:text-neutral-base-900 bg-white hover:bg-neutral-base-50"
                                        }`}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </AccordionSection>

                {/* Colors */}
                <AccordionSection id="color" title="Colors">
                    <div className="flex flex-wrap gap-x-3 gap-y-4">
                        {colors.map((color) => {
                            const isActive = activeFilters.color.includes(color.name);
                            return (
                                <div key={color.name} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onFilterChange("color", color.name)}>
                                    <button
                                        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? "ring-2 ring-offset-2 ring-neutral-base-900 scale-110 shadow-md" : "border max-w-full border-neutral-base-200 group-hover:scale-110 shadow-sm"
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    >
                                        {isActive && <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </AccordionSection>

                {/* Prices */}
                <AccordionSection id="price" title="Price">
                    <div className="space-y-4">
                        {priceRanges.map((range) => {
                            const isActive = activeFilters.price.includes(range);
                            return (
                                <button
                                    key={range}
                                    onClick={() => onFilterChange("price", range)}
                                    className="flex items-center gap-3 w-full group"
                                >
                                    <div className={`flex items-center justify-center transition-colors ${isActive ? "text-neutral-base-900" : "text-neutral-base-300 group-hover:text-neutral-base-500"}`}>
                                        {isActive ? <CircleDot className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-[14px] transition-colors ${isActive ? "text-neutral-base-900 font-bold" : "text-neutral-base-500 group-hover:text-neutral-base-900 font-medium"
                                        }`}>
                                        {range}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </AccordionSection>

                {/* Collections */}
                <AccordionSection id="collection" title="Collections">
                    <div className="space-y-4">
                        {displayCollections.map((item) => {
                            const isActive = activeFilters.collection.includes(item);
                            return (
                                <button
                                    key={item}
                                    onClick={() => onFilterChange("collection", item)}
                                    className="flex items-center justify-between w-full group py-1"
                                >
                                    <span className={`text-[14px] transition-colors ${isActive ? "text-neutral-base-900 font-bold" : "text-neutral-base-500 group-hover:text-neutral-base-900 font-medium"
                                        }`}>
                                        {item}
                                    </span>
                                    {isActive && <Check className="w-4 h-4 text-neutral-base-900" />}
                                </button>
                            );
                        })}
                    </div>
                </AccordionSection>

                {/* Tags */}
                <AccordionSection id="tag" title="Tags">
                    <div className="flex flex-wrap gap-2.5">
                        {tags.map((tag) => {
                            const isActive = activeFilters.tag.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => onFilterChange("tag", tag)}
                                    className={`text-[13px] px-4 py-2 rounded-full transition-all font-medium ${isActive
                                        ? "bg-neutral-base-900 text-white shadow-md border border-neutral-base-900"
                                        : "bg-neutral-base-50 text-neutral-base-600 border border-transparent hover:border-neutral-base-300 hover:bg-neutral-base-100"
                                        }`}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </AccordionSection>
            </div>
        </aside>
    );
}
