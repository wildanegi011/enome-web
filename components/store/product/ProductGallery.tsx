"use client";

import FallbackImage from "@/components/store/shared/FallbackImage";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Zap, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface ProductGalleryProps {
    images: string[];
    isSoldOut?: boolean;
    isOnFlashSale?: boolean;
}

export default function ProductGallery({ images, isSoldOut, isOnFlashSale }: ProductGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Handle mobile scroll to update indicators
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const width = scrollRef.current.offsetWidth;
        const scrollLeft = scrollRef.current.scrollLeft;
        const index = Math.round(scrollLeft / width);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const scrollToImage = (index: number) => {
        if (!scrollRef.current) return;
        const width = scrollRef.current.offsetWidth;
        scrollRef.current.scrollTo({
            left: index * width,
            behavior: "smooth"
        });
    };

    return (
        <div className="flex flex-col gap-4 md:gap-8 w-full min-w-0">
            {/* Mobile Carousel View (Hidden on Tablet/Desktop) */}
            <div className="relative md:hidden group/gallery">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-3/4 w-full rounded-2xl bg-neutral-base-50 shadow-sm"
                >
                    {images.map((img, idx) => (
                        <div key={idx} className="flex-none w-full h-full snap-center relative">
                            <FallbackImage
                                src={img}
                                alt={`Product image ${idx + 1}`}
                                fill
                                quality={90}
                                unoptimized={true}
                                className="object-cover object-center"
                                priority={idx === 0}
                            />
                        </div>
                    ))}
                </div>

                {/* Glassmorphism Badges (Mobile) */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                    {isOnFlashSale && (
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="bg-red-600/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20"
                        >
                            <Zap className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white font-montserrat">Flash Sale</span>
                        </motion.div>
                    )}
                    {isSoldOut && (
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                            <span className="text-white text-[10px] font-bold uppercase tracking-widest font-montserrat">Habis terjual</span>
                        </div>
                    )}
                </div>

                {/* Modern Indicators */}
                {images.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5 p-2 px-3 rounded-full bg-black/10 backdrop-blur-md border border-white/10">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => scrollToImage(idx)}
                                className={`transition-all duration-300 rounded-full ${activeIndex === idx
                                    ? "w-6 h-1.5 bg-white"
                                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
                                    }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop Grid View (Hidden on Mobile) */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {images.map((img, idx) => {
                    const isFeatureImage = idx === 0;

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className={`relative bg-neutral-base-50 overflow-hidden min-w-0 rounded-3xl group cursor-zoom-in shadow-sm hover:shadow-2xl transition-all duration-700 ${isFeatureImage ? "md:col-span-2 aspect-3/4" : "col-span-1 aspect-3/4"
                                }`}
                        >
                            <div className="absolute inset-0">
                                <FallbackImage
                                    src={img}
                                    alt={`Product image ${idx + 1}`}
                                    fill
                                    quality={90}
                                    unoptimized={true}
                                    className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-110"
                                    sizes={isFeatureImage ? "(max-width: 1024px) 100vw, 80vw" : "(max-width: 1024px) 50vw, 40vw"}
                                    priority={idx === 0}
                                />
                            </div>

                            {/* Interaction Overlay */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                <div className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 text-neutral-base-900">
                                    <Maximize2 size={20} strokeWidth={1.5} />
                                </div>
                            </div>

                            {/* Badges for primary image */}
                            {idx === 0 && (
                                <div className="absolute top-6 left-6 z-20 flex flex-col gap-3">
                                    {isOnFlashSale && (
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className="bg-red-600 backdrop-blur-md px-5 py-2.5 rounded-full flex items-center gap-2.5 shadow-2xl border border-red-500/50"
                                        >
                                            <Zap className="w-4 h-4 text-white fill-white animate-pulse" />
                                            <span className="text-[12px] font-bold uppercase tracking-widest text-white drop-shadow-sm font-montserrat">Flash Sale</span>
                                        </motion.div>
                                    )}
                                    {isSoldOut && (
                                        <div className="bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-2xl">
                                            <span className="text-white text-[12px] font-bold uppercase tracking-widest font-montserrat">Habis terjual</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
