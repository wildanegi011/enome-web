"use client";

import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const instagramImages = [
    { src: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80", height: "h-[350px]" },
    { src: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80", height: "h-[450px]" },
    { src: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80", height: "h-[320px]" },
    { src: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80", height: "h-[480px]" },
    { src: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=600&q=80", height: "h-[380px]" },
    { src: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80", height: "h-[460px]" },
    { src: "https://images.unsplash.com/photo-1604644401890-0bd678c83788?w=600&q=80", height: "h-[340px]" },
];

export default function InstagramSection() {
    const [current, setCurrent] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const nextSlide = useCallback(() => {
        setCurrent((prev) => (prev + 1) % instagramImages.length);
    }, []);

    const prevSlide = useCallback(() => {
        setCurrent((prev) => (prev - 1 + instagramImages.length) % instagramImages.length);
    }, []);

    return (
        <section ref={ref} className="py-16 md:py-24 bg-white overflow-hidden font-sans">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12 md:mb-20"
                >
                    <h2 className="font-serif text-[36px] md:text-[42px] lg:text-[64px] text-neutral-base-900 leading-tight italic">
                        Follow Us On Instagram
                    </h2>
                    <p className="text-neutral-base-500 mt-4 md:mt-6 leading-relaxed max-w-2xl mx-auto text-[15px] md:text-[16px]">
                        Join our community of batik lovers. Tag us @enome.official for a chance to be featured in our upcoming collections.
                    </p>
                </motion.div>

                {/* Slider Container */}
                <div className="relative group px-12">
                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border border-neutral-base-100 flex items-center justify-center text-neutral-base-400 hover:text-neutral-base-900 hover:border-neutral-base-900 transition-all z-20 shadow-xl opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
                    >
                        <ChevronLeft className="w-6 h-6" strokeWidth={1.2} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border border-neutral-base-100 flex items-center justify-center text-neutral-base-400 hover:text-neutral-base-900 hover:border-neutral-base-900 transition-all z-20 shadow-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                    >
                        <ChevronRight className="w-6 h-6" strokeWidth={1.2} />
                    </button>

                    <div className="overflow-hidden">
                        <motion.div
                            className="flex gap-6"
                            animate={{ x: `-${current * 320}px` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {instagramImages.map((img, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                    transition={{ duration: 0.8, delay: idx * 0.05 }}
                                    className={`relative h-[480px] w-[300px] shrink-0 rounded-lg overflow-hidden shadow-2xl shadow-black/5 hover:shadow-black/15 transition-all group/item`}
                                >
                                    <Image
                                        src={img.src}
                                        alt={`Instagram fashion ${idx + 1}`}
                                        fill
                                        className="object-cover group-hover/item:scale-110 transition-transform duration-1000"
                                        sizes="300px"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                        <div className="w-10 h-10 border border-white rounded-full flex items-center justify-center text-white">
                                            <span className="text-xs">IG</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Indicators */}
                    <div className="flex justify-center gap-2 mt-12">
                        {instagramImages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrent(idx)}
                                className={`h-1.5 rounded-full transition-all duration-500 ${idx === current ? "bg-neutral-base-900 w-8" : "bg-neutral-base-200 w-2 hover:bg-neutral-base-300"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
