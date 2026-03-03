"use client";

import { Skeleton } from "@/components/ui/skeleton";

const WishlistSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="space-y-3">
                <Skeleton className="aspect-3/4 w-full rounded-xl" />
                <div className="space-y-2 px-1">
                    <Skeleton className="w-16 h-3" />
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-4" />
                </div>
            </div>
        ))}
    </div>
);

export default WishlistSkeleton;
