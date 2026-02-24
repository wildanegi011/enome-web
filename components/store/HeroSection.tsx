"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ASSET_URL } from "@/config/config";

import { useSlides } from "@/hooks/use-slides";
import { useSlider } from "@/hooks/use-slider";

export default function HeroSection() {
    const { data: slides = [], isLoading } = useSlides();
    const { current, goToSlide, nextSlide, prevSlide } = useSlider({ count: slides.length });

    if (isLoading) {
        return <section className="w-full h-[55vh] min-h-[450px] max-h-[600px] bg-neutral-100 animate-pulse" />;
    }

    if (slides.length === 0) {
        return null;
    }


    const currentSlide = slides[current];

    return (
        <section className="relative group w-full h-[55vh] min-h-[450px] max-h-[600px] overflow-hidden bg-neutral-900">
            {/* Slider Images */}
            <AnimatePresence>
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }} // Reduced duration for responsiveness
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <Image
                        src={`${ASSET_URL}/img/slide/${currentSlide.image || ""}`}
                        alt={currentSlide.text || "Hero Slide"}
                        fill
                        className="object-contain" // Changed to contain to prevent cropping
                        priority
                        unoptimized
                        sizes="100vw"
                    />
                </motion.div>
            </AnimatePresence>

            {/* Subtle dark overlays */}
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Navigation Arrows */}
            <button
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 hover:bg-black/40 transition-all duration-300 shadow-xl"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 hover:bg-black/40 transition-all duration-300 shadow-xl"
                aria-label="Next slide"
            >
                <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
            </button>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-end h-full pb-8 px-4">

                {/* Centered Dynamic Title */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center text-center pointer-events-none"
                    >
                        <h1 className="font-heading text-[48px] sm:text-[64px] md:text-[80px] lg:text-[100px] font-bold text-white leading-[1] tracking-tighter drop-shadow-2xl uppercase">
                            {currentSlide.text}
                        </h1>
                    </motion.div>
                </AnimatePresence>

            </div>

            {/* Slide Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => goToSlide(idx)}
                        className={`h-[4px] rounded-full transition-all duration-700 ease-in-out ${idx === current ? "bg-white w-12 shadow-md" : "bg-white/40 w-6 hover:bg-white/60"
                            }`}
                        aria-label={`Slide ${idx + 1}`}
                    />
                ))}
            </div>
        </section>
    );
}
