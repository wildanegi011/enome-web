"use client";

import Image from "next/image";
import { useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useInView } from "framer-motion";

const dealImages = [
    { src: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80", alt: "Model 1" },
    { src: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80", alt: "Model 2" },
    { src: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80", alt: "Model 3" },
];

export default function DealsOfTheMonth() {
    const [current, setCurrent] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const nextSlide = useCallback(() => {
        setCurrent((prev) => (prev + 1) % dealImages.length);
    }, []);

    const prevSlide = useCallback(() => {
        setCurrent((prev) => (prev - 1 + dealImages.length) % dealImages.length);
    }, []);

    return (
        <section ref={ref} className="py-16 md:py-24 bg-white overflow-hidden text-neutral-base-900 font-sans">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-center">
                    {/* Text Content - Left Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8 }}
                        className="lg:col-span-5 pr-0 lg:pr-8 text-center lg:text-left"
                    >
                        <h2 className="font-serif text-[36px] md:text-[42px] lg:text-[56px] text-neutral-base-900 leading-[1.1] italic">
                            Deals Of The Month
                        </h2>
                        <p className="text-neutral-base-500 mt-4 md:mt-6 leading-relaxed max-w-sm mx-auto lg:mx-0 text-[15px] md:text-[16px]">
                            Explore our curated selection of limited-time offers. Handpicked batik pieces that blend tradition with modern elegance.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-8 md:mt-10 bg-neutral-base-900 text-white px-10 md:px-12 py-3.5 md:py-4 rounded-lg text-sm font-bold tracking-[0.15em] uppercase shadow-2xl shadow-black/20 transition-all w-full md:w-auto"
                        >
                            Shop Collection
                        </motion.button>

                        {/* Carousel Nav Controls inside text area bottom left */}
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
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8 }}
                        className="lg:col-span-7 flex flex-col items-center lg:items-start lg:flex-row gap-6 relative"
                    >
                        {/* Active Image Container */}
                        <div className="relative w-full max-w-[380px] h-[450px] md:h-[550px] shrink-0 rounded-sm overflow-hidden shadow-2xl mx-auto lg:mx-0">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={current}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0"
                                >
                                    <Image
                                        src={dealImages[current].src}
                                        alt={dealImages[current].alt}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 380px"
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Partial Images (Hidden on mobile) */}
                        <div className="hidden lg:flex gap-6 items-center flex-1">
                            <div className="relative w-[340px] h-[480px] shrink-0 opacity-40 rounded-sm overflow-hidden pointer-events-none">
                                <Image
                                    src={dealImages[(current + 1) % dealImages.length].src}
                                    alt="Next item"
                                    fill
                                    className="object-cover"
                                    sizes="340px"
                                />
                            </div>

                            <div className="relative w-[280px] h-[440px] shrink-0 opacity-20 rounded-sm overflow-hidden pointer-events-none">
                                <Image
                                    src={dealImages[(current + 2) % dealImages.length].src}
                                    alt="Next item"
                                    fill
                                    className="object-cover"
                                    sizes="280px"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Pagination Dots */}
                <div className="mt-8 flex justify-center lg:justify-end gap-3 lg:pr-[400px]">
                    {dealImages.map((_, idx) => (
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
