"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const WalletHistorySkeleton = () => (
    <div className="p-4 md:p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-neutral-base-50 last:border-0 px-2 md:px-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24 md:w-32" />
                        <Skeleton className="h-3 w-16 md:w-24" />
                    </div>
                </div>
                <Skeleton className="h-6 w-16 md:w-24" />
            </div>
        ))}
    </div>
);

export default WalletHistorySkeleton;
