"use client";

import FallbackImage from "@/components/store/shared/FallbackImage";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryProps {
    images: string[];
    isSoldOut?: boolean;
    isOnFlashSale?: boolean;
}

import { Zap } from "lucide-react";

export default function ProductGallery({ images, isSoldOut, isOnFlashSale }: ProductGalleryProps) {
    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {images.map((img, idx) => {
                    // Logic: First and Second images are full width (col-span-1 on mobile, col-span-2 on desktop)
                    // Rest are in a 2-column grid (col-span-1 on desktop)
                    const isFeatureImage = idx < 2;

                    return (
                        <div
                            key={idx}
                            className={`relative bg-neutral-base-50 overflow-hidden min-w-0 ${isFeatureImage ? "md:col-span-2" : "col-span-1"
                                }`}
                        >
                            <FallbackImage
                                src={img}
                                alt={`Product image ${idx + 1}`}
                                width={2000}
                                height={3000}
                                quality={100}
                                unoptimized={true}
                                className="w-full h-auto object-contain object-center"
                                sizes={isFeatureImage ? "(max-width: 1024px) 100vw, 80vw" : "(max-width: 1024px) 50vw, 40vw"}
                                priority={idx === 0}
                            />

                            {/* Badges only for the primary image */}
                            {idx === 0 && (
                                <>
                                    {isSoldOut && (
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                            <div className="text-white text-[14px] font-bold uppercase tracking-[0.3em]">
                                                Habis
                                            </div>
                                        </div>
                                    )}

                                    {/* Flash Sale Top-Left Badge OVERLAY */}
                                    {isOnFlashSale && (
                                        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                                            <div className="bg-red-600 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-red-500/50">
                                                <Zap className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-white drop-shadow-sm">Flash Sale</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
