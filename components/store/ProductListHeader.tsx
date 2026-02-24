"use client";

import { ChevronDown, LayoutGrid, LayoutList, Columns2, Columns3, Columns4 } from "lucide-react";
import { useState } from "react";

export default function ProductListHeader() {
    const [sortBy, setSortBy] = useState("Best selling");

    return (
        <div className="flex items-center justify-between mb-10 font-sans">
            <div className="relative group">
                <button className="flex items-center gap-2 text-[14px] font-bold text-neutral-base-900 hover:text-neutral-base-600 transition-colors">
                    {sortBy}
                    <ChevronDown className="w-4 h-4" />
                </button>
                {/* Dropdown would go here */}
            </div>

            <div className="hidden md:flex items-center gap-4">
                {[
                    { icon: LayoutList, cols: 1 },
                    { icon: Columns2, cols: 2 },
                    { icon: Columns3, cols: 3 },
                    { icon: Columns4, cols: 4 },
                    { icon: LayoutGrid, cols: 6 },
                ].map((item, idx) => (
                    <button
                        key={idx}
                        className={`w-8 h-8 flex items-center justify-center border transition-all ${idx === 2
                                ? "bg-neutral-base-900 border-neutral-base-900 text-white shadow-lg shadow-black/10"
                                : "bg-white border-neutral-base-100 text-neutral-base-300 hover:text-neutral-base-900 hover:border-neutral-base-300"
                            }`}
                        title={`${item.cols} Columns`}
                    >
                        <item.icon className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                ))}
            </div>
        </div>
    );
}
