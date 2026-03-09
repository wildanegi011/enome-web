"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

// Sub-components
import NavOverlay from "./subcomponents/NavOverlay";
import SliderControls from "./subcomponents/SliderControls";
import ScrollIndicators from "./subcomponents/ScrollIndicators";
import CollectionDots from "./subcomponents/CollectionDots";
import SearchModal from "./subcomponents/SearchModal";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Collection {
    id: string;
    title: string;
    images: {
        url: string;
        link: string | null;
        title?: string;
        aspect: string;
    }[];
}

export default function IntegratedCollectionSlider() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [verticalIndex, setVerticalIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        async function fetchSlides() {
            try {
                const res = await fetch("/api/slides");
                const result = await res.json();
                if (result.success) {
                    setCollections(result.data);
                }
            } catch (error) {
                console.error("Error fetching slides:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSlides();
    }, []);

    const paginate = (newDirection: number) => {
        const newIndex = currentIndex + newDirection;
        if (newIndex >= 0 && newIndex < collections.length) {
            setDirection(newDirection);
            setCurrentIndex(newIndex);
            setVerticalIndex(0); // Reset vertical scroll on collection change
        }
    };

    const scrollVertical = (newDirection: number) => {
        const newIndex = verticalIndex + newDirection;
        const maxIndex = collections[currentIndex].images.length - 1;
        if (newIndex >= 0 && newIndex <= maxIndex) {
            setVerticalIndex(newIndex);
            const container = scrollContainerRef.current;
            if (container) {
                container.scrollTo({
                    top: newIndex * window.innerHeight,
                    behavior: "smooth"
                });
            }
        }
    };

    // Listen to manual scroll to update verticalIndex
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const index = Math.round(container.scrollTop / window.innerHeight);
            if (index !== verticalIndex) {
                setVerticalIndex(index);
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [verticalIndex, collections, currentIndex]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsSearchOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    if (isLoading) {
        return (
            <div className="w-full h-screen bg-neutral-950 flex flex-col items-center justify-center gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.95, 1, 0.95] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-48 h-48"
                >
                    <Image src="/logo-enome.png" alt="Loading" fill className="object-contain brightness-0 invert opacity-20" />
                </motion.div>
                <div className="flex flex-col items-center gap-2">
                    <div className="h-px w-24 bg-linear-to-r from-transparent via-white/20 to-transparent relative overflow-hidden">
                        <motion.div
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 w-1/3 h-full bg-linear-to-r from-transparent via-white/60 to-transparent"
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (collections.length === 0) return null;

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0,
            scale: 1.1,
            filter: "blur(10px)"
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)"
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0,
            scale: 0.9,
            filter: "blur(10px)"
        })
    };

    return (
        <section className="relative w-full h-screen bg-black overflow-hidden select-none text-white font-montserrat">


            {/* Top Navigation Overlay */}
            <NavOverlay setIsSearchOpen={setIsSearchOpen} />

            {/* Search Experience */}
            <SearchModal
                isOpen={isSearchOpen}
                onOpenChange={setIsSearchOpen}
                isMobile={isMobile}
                setDirection={setDirection}
                setCurrentIndex={setCurrentIndex}
                currentIndex={currentIndex}
                router={router}
                collections={collections}
            />

            {/* Pagination Controls */}
            <SliderControls
                currentIndex={currentIndex}
                totalCollections={collections.length}
                paginate={paginate}
            />

            {/* Vertical Scroll Indicators */}
            <ScrollIndicators
                verticalIndex={verticalIndex}
                totalImages={collections[currentIndex].images.length}
                scrollVertical={scrollVertical}
            />

            <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 35 },
                        opacity: { duration: 0.3 }
                    }}
                    className="absolute inset-0 w-full h-full"
                >
                    <ScrollArea
                        viewportRef={scrollContainerRef}
                        className="w-full h-full"
                        viewportClassName="snap-y snap-mandatory no-scrollbar scroll-smooth"
                        scrollBarClassName="hidden"
                    >
                        {collections[currentIndex].images.map((img, i) => (
                            <div key={i} className="relative w-full h-screen snap-start shrink-0 overflow-hidden bg-zinc-950">
                                {/* True Fullscreen Layer - CSS Background Image (Cover mode) */}
                                <motion.div
                                    initial={{ scale: 1.05, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    viewport={{ once: false }}
                                    className="absolute inset-0 bg-cover bg-top bg-no-repeat"
                                    style={{ backgroundImage: `url(${img.url})` }}
                                />

                                {/* Subtle Overlay for Brand Consistency */}
                                <div className="absolute inset-0 bg-black/5 pointer-events-none" />

                                {/* Vertical Side Logo - Left Center */}
                                {/* <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                    viewport={{ once: false }}
                                    className="absolute left-12 md:left-20 top-1/2 -translate-y-1/2 z-10 pointer-events-none select-none"
                                >
                                    <div className="relative w-16 h-64 md:w-md md:h-96">
                                        <Image
                                            src="/logo-enome.png"
                                            alt="ÉNOMÉ"
                                            fill
                                            className="object-contain brightness-0 invert opacity-100"
                                            style={{ filter: "drop-shadow(0 0 30px rgba(255,255,255,0.15))" }}
                                        />
                                    </div>
                                </motion.div> */}

                                {/* Collection Title - Centered on Mobile, Left on Desktop */}
                                <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                                    <div className="flex flex-col items-center md:items-start px-6 md:px-12 pb-24 md:pb-16">
                                        <motion.p
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.8, delay: 0.3 }}
                                            viewport={{ once: false }}
                                            className="font-montserrat text-[15px] md:text-[18px] text-center md:text-left text-white/70 tracking-[0.25em] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                                        >
                                            {img.title || collections[currentIndex].title}
                                        </motion.p>
                                    </div>
                                </div>

                                {/* Ambient Shadow Gradient */}
                                <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/40 to-transparent pointer-events-none" />

                                {/* Interactive Click Overlay - FINAL STABLE POSITION */}
                                {img.link && img.link.trim() !== "" && (
                                    <div
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log("🚀 EXPLOSIVE CLICK:", img.link);

                                            const target = img.link!.trim();
                                            if (target.includes('category=')) {
                                                const cat = target.split('category=')[1]?.split('&')[0];
                                                if (cat) {
                                                    router.push(`/products?category=${cat}`);
                                                    return;
                                                }
                                            }

                                            try {
                                                const u = new URL(target);
                                                if (u.origin === window.location.origin) {
                                                    router.push(u.pathname + u.search);
                                                } else {
                                                    window.location.href = target;
                                                }
                                            } catch (err) {
                                                router.push(target);
                                            }
                                        }}
                                        className="absolute inset-0 z-20 cursor-pointer pointer-events-auto"
                                    />
                                )}
                            </div>
                        ))}
                    </ScrollArea>
                </motion.div>
            </AnimatePresence>

            {/* Collection Dots - Right Side */}
            <CollectionDots
                currentIndex={currentIndex}
                collections={collections}
                setDirection={setDirection}
                setCurrentIndex={setCurrentIndex}
            />
        </section>
    );
}
