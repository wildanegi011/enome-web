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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {images.map((img, idx) => {
                    const isFeatureImage = idx < 2;

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className={`relative bg-neutral-base-50 overflow-hidden min-w-0 rounded-2xl group cursor-zoom-in shadow-sm hover:shadow-xl transition-all duration-500 ${isFeatureImage ? "md:col-span-2 aspect-3/4" : "col-span-1 aspect-3/4"
                                }`}
                        >
                            <div className="absolute inset-0">
                                <FallbackImage
                                    src={img}
                                    alt={`Product image ${idx + 1}`}
                                    fill
                                    quality={90}
                                    unoptimized={true}
                                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                                    sizes={isFeatureImage ? "(max-width: 1024px) 100vw, 80vw" : "(max-width: 1024px) 50vw, 40vw"}
                                    priority={idx === 0}
                                    loading={idx === 0 ? "eager" : "lazy"}
                                />
                            </div>

                            {/* Overlay for interaction hint */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />

                            {/* Badges only for the primary image */}
                            {idx === 0 && (
                                <>
                                    {isSoldOut && (
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                            <div className="text-white text-[14px] md:text-[18px] font-bold uppercase tracking-[0.4em] font-montserrat drop-shadow-lg">
                                                Habis terjual
                                            </div>
                                        </div>
                                    )}

                                    {/* Flash Sale Top-Left Badge OVERLAY */}
                                    {isOnFlashSale && (
                                        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                                            <motion.div
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                className="bg-red-600 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl border border-red-500/50"
                                            >
                                                <Zap className="w-4 h-4 text-white fill-white animate-pulse" />
                                                <span className="text-[12px] font-bold uppercase tracking-widest text-white drop-shadow-sm font-montserrat">Flash Sale</span>
                                            </motion.div>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
