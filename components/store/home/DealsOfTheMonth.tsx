"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import NextImage from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useHighlights } from "@/hooks/use-products";
import { ASSET_URL } from "@/config/config";
import Link from "next/link";

export default function DealsOfTheMonth() {
    const { data: highlights = [], isLoading } = useHighlights();
    const [current, setCurrent] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px" });

    // Debug log to help identify why it's empty in the browser
    useEffect(() => {
        if (!isLoading) {
            console.log("DealsOfTheMonth Highlights:", highlights);
        }
    }, [highlights, isLoading]);

    const nextSlide = useCallback(() => {
        if (!highlights || highlights.length === 0) return;
        setCurrent((prev) => (prev + 1) % highlights.length);
    }, [highlights]);

    const prevSlide = useCallback(() => {
        if (!highlights || highlights.length === 0) return;
        setCurrent((prev) => (prev - 1 + highlights.length) % highlights.length);
    }, [highlights]);

    if (isLoading) {
        return (
            <div className="py-16 md:py-24 bg-white animate-pulse">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                    <div className="grid lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-5 space-y-4">
                            <div className="h-12 w-3/4 bg-gray-100 rounded"></div>
                            <div className="h-24 w-full bg-gray-100 rounded"></div>
                        </div>
                        <div className="lg:col-span-7 h-[500px] bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!highlights || highlights.length === 0) return null;

    const currentProduct = highlights[current];
    if (!currentProduct) return null;

    return (
        <section ref={ref} className="py-16 md:py-24 bg-white overflow-hidden text-neutral-base-900 font-sans">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-center">
                    {/* Text Content - Left Side */}
                    <motion.div
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-5 pr-0 lg:pr-8 text-center lg:text-left"
                    >
                        <h2 className="font-heading text-[36px] md:text-[42px] lg:text-[56px] text-neutral-base-900 leading-[1.1]">
                            Deals Of The Month
                        </h2>
                        <div className="mt-4 md:mt-6 space-y-2">
                            <h3 className="text-[20px] md:text-[24px] font-bold text-neutral-base-900">
                                {currentProduct.namaProduk}
                            </h3>
                            <div className="flex items-center gap-2">
                                <p className="text-red-600 font-bold text-lg">
                                    Rp {Number(currentProduct.finalMinPrice).toLocaleString('id-ID')}
                                </p>
                                {!!currentProduct.discountPercentage && currentProduct.discountPercentage > 0 && (
                                    <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-sm">
                                        -{currentProduct.discountPercentage}%
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* TODO: uncomment when we have product description */}
                        {/* {currentProduct.deskripsi ? (
                            <div
                                className="text-neutral-base-500 mt-4 leading-relaxed max-w-sm mx-auto lg:mx-0 text-[15px] md:text-[16px] line-clamp-5 prose-sm"
                                dangerouslySetInnerHTML={{ __html: currentProduct.deskripsi }}
                            />
                        ) : ( */}
                        <p className="text-neutral-base-500 mt-4 leading-relaxed max-w-sm mx-auto lg:mx-0 text-[15px] md:text-[16px] line-clamp-3">
                            Explore our curated selection of limited-time offers. Handpicked batik pieces that blend tradition with modern elegance.
                        </p>
                        {/* )} */}
                        <Link href={`/products/${currentProduct.produkId}`}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-8 md:mt-10 bg-neutral-base-900 text-white px-10 md:px-12 py-3.5 md:py-4 rounded-lg text-sm font-bold tracking-[0.15em] uppercase shadow-2xl shadow-black/20 transition-all w-full md:w-auto text-center"
                            >
                                Shop Now
                            </motion.button>
                        </Link>

                        {/* Carousel Nav Controls */}
                        <div className="mt-12 md:mt-20 flex items-center justify-center lg:justify-start gap-3">
                            <button
                                onClick={prevSlide}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-neutral-base-200 flex items-center justify-center text-neutral-base-400 hover:text-neutral-base-900 hover:border-neutral-base-900 transition-all duration-300"
                            >
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.2} />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-neutral-base-200 flex items-center justify-center text-neutral-base-400 hover:text-neutral-base-900 hover:border-neutral-base-900 transition-all duration-300"
                            >
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.2} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Image Slider - Right Side */}
                    <motion.div
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-7 flex flex-col items-center lg:items-start lg:flex-row gap-6 relative"
                    >
                        {/* Active Image Container */}
                        <div className="relative w-full max-w-[380px] h-[450px] md:h-[550px] shrink-0 rounded-sm overflow-hidden shadow-2xl mx-auto lg:mx-0 bg-neutral-50">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={current}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0"
                                >
                                    <NextImage
                                        src={highlights[current].gambar ? `${ASSET_URL}/img/produk_utama/${highlights[current].gambar}` : "/placeholder.jpg"}
                                        alt={highlights[current].namaProduk}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 380px"
                                        priority
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Partial Images (Hidden on mobile) */}
                        <div className="hidden lg:flex gap-6 items-center flex-1">
                            {highlights.length >= 2 && (
                                <div className="relative w-[340px] h-[480px] shrink-0 opacity-40 rounded-sm overflow-hidden pointer-events-none bg-neutral-50">
                                    <NextImage
                                        src={highlights[(current + 1) % highlights.length].gambar ? `${ASSET_URL}/img/produk_utama/${highlights[(current + 1) % highlights.length].gambar}` : "/placeholder.jpg"}
                                        alt="Next item"
                                        fill
                                        className="object-cover"
                                        sizes="340px"
                                    />
                                </div>
                            )}

                            {highlights.length >= 3 && (
                                <div className="relative w-[280px] h-[440px] shrink-0 opacity-20 rounded-sm overflow-hidden pointer-events-none bg-neutral-50">
                                    <NextImage
                                        src={highlights[(current + 2) % highlights.length].gambar ? `${ASSET_URL}/img/produk_utama/${highlights[(current + 2) % highlights.length].gambar}` : "/placeholder.jpg"}
                                        alt="Next item"
                                        fill
                                        className="object-cover"
                                        sizes="280px"
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Pagination Dots */}
                <div className="mt-8 flex justify-center lg:justify-end gap-3 lg:pr-[400px]">
                    {highlights.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrent(idx)}
                            className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all ${idx === current ? "bg-black border-4 border-gray-100 ring-1 ring-black" : "bg-gray-300"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
