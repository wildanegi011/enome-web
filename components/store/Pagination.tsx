"use client";

import { ChevronRight } from "lucide-react";

export default function Pagination() {
    const pages = [1, 2, 3];

    return (
        <div className="flex items-center justify-center gap-4 mt-20 font-sans">
            {pages.map((page) => (
                <button
                    key={page}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold transition-all ${page === 1
                            ? "bg-neutral-base-100 text-neutral-base-900 shadow-sm"
                            : "text-neutral-base-400 hover:text-neutral-base-900 hover:bg-neutral-base-50"
                        }`}
                >
                    {page}
                </button>
            ))}
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-base-400 hover:text-neutral-base-900 hover:bg-neutral-base-50 transition-all">
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
        </div>
    );
}
