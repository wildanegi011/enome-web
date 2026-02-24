"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryProps {
    images: string[];
    isSoldOut?: boolean;
}

export default function ProductGallery({ images, isSoldOut }: ProductGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    return (
        <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-6 h-full">
            {/* Thumbnails Column (Left on desktop, Bottom on mobile) */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0 shrink-0 mx-auto md:mx-0">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`relative w-[60px] h-[80px] md:w-[80px] md:h-[110px] shrink-0 overflow-hidden transition-all ${idx === currentIndex
                            ? "ring-1 ring-neutral-base-900 border-2 border-white opacity-100"
                            : "opacity-60 hover:opacity-100"
                            }`}
                    >
                        <Image
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 60px, 80px"
                        />
                    </button>
                ))}
            </div>

            {/* Main Image Container */}
            <div className="relative w-full aspect-[3/4] md:aspect-auto md:h-[600px] lg:h-[750px] bg-neutral-base-50 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={images[currentIndex]}
                            alt="Main product representation"
                            fill
                            className="object-cover object-center"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                        />
                        {isSoldOut && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-sm px-8 py-3 bg-red-400 text-white text-[14px] font-black uppercase tracking-[0.3em] shadow-2xl"
                                >
                                    Sold Out
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
