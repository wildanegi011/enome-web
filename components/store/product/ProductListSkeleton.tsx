"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/store/layout/Navbar";
import Footer from "@/components/store/layout/Footer";

export default function ProductListSkeleton() {
    return (
        <main className="h-screen overflow-hidden bg-white flex flex-col">
            <ScrollArea className="flex-1">
                <Navbar />
                <div className="bg-white border-b border-neutral-base-50 h-[80px] flex items-center">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 w-full">
                        <Skeleton className="h-8 w-64" />
                    </div>
                </div>
                <section className="py-12">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                        <div className="flex flex-col lg:flex-row gap-16">
                            <div className="hidden lg:block w-80 shrink-0 space-y-8 sticky top-[120px]">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-4">
                                        <Skeleton className="h-6 w-32" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-5/6" />
                                            <Skeleton className="h-4 w-4/6" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
                                    {[1, 2, 3, 4, 6].map((i) => (
                                        <div key={i} className="space-y-4">
                                            <Skeleton className="aspect-3/4 w-full rounded-2xl bg-neutral-100" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-4 w-1/2" />
                                                <Skeleton className="h-4 w-1/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <Footer />
            </ScrollArea>
        </main>
    );
}
