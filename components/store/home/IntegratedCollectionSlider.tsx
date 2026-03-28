"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Sub-components
import NavOverlay from "./subcomponents/NavOverlay";
import SliderControls from "./subcomponents/SliderControls";
import ScrollIndicators from "./subcomponents/ScrollIndicators";
import CollectionDots from "./subcomponents/CollectionDots";
import SearchModal from "@/components/store/shared/SearchModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const getPositionClasses = (position: string | undefined, isMobile: boolean) => {
    if (!position) return isMobile ? "items-center bottom-24 text-center" : "items-start bottom-16 text-left left-12 md:left-20";

    const pos = position.toLowerCase();

    // Default mobile behavior is usually centered at the bottom unless specified
    if (isMobile) {
        if (pos.includes('top')) return "items-center top-24 text-center";
        if (pos.includes('mid') || pos.includes('center')) return "items-center top-1/2 -translate-y-1/2 text-center";
        return "items-center bottom-24 text-center";
    }

    // Desktop positioning
    let vClasses = "";
    let hClasses = "";

    // Vertical keywords: top, bottom, mid, middle, center
    if (pos.includes('top')) vClasses = "top-32 ";
    else if (pos.includes('bottom')) vClasses = "bottom-16 ";
    else if (pos.includes('mid') || (pos.includes('center') && !pos.includes('left') && !pos.includes('right'))) vClasses = "top-1/2 -translate-y-1/2 ";
    else vClasses = "bottom-16 "; // default

    // Horizontal keywords: left, right, center
    if (pos.includes('right')) hClasses = "items-end text-right right-12 md:right-20 ";
    else if (pos.includes('left')) hClasses = "items-start text-left left-12 md:left-20 ";
    else if (pos.includes('center') || (pos.includes('middle') && !pos.includes('top') && !pos.includes('bottom'))) hClasses = "items-center text-center left-1/2 -translate-x-1/2 ";
    else hClasses = "items-start text-left left-12 md:left-20 "; // default

    return vClasses + hClasses;
};

interface Collection {
    id: string;
    title: string;
    images: {
        url: string;
        link: string | null;
        title?: string;
        header?: string;
        position?: string;
        brand?: string;
        brandImageLink?: string,
        brandPosition?: string,
        tagline?: string;
        aspect: string;
        isMobile: boolean;
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

    // Filtered collections based on device
    const filteredCollections = collections.map(col => ({
        ...col,
        images: col.images.filter(img => img.isMobile === isMobile)
    })).filter(col => col.images.length > 0);

    const paginate = (newDirection: number) => {
        const newIndex = currentIndex + newDirection;
        if (newIndex >= 0 && newIndex < filteredCollections.length) {
            setDirection(newDirection);
            setCurrentIndex(newIndex);
            setVerticalIndex(0); // Reset vertical scroll on collection change
        }
    };

    const scrollVertical = (newDirection: number) => {
        const newIndex = verticalIndex + newDirection;
        const currentImages = filteredCollections[currentIndex]?.images || [];
        const maxIndex = currentImages.length - 1;
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

    // Clamp indices when device mode changes or collection change
    useEffect(() => {
        if (filteredCollections.length > 0) {
            // Clamp currentIndex
            if (currentIndex >= filteredCollections.length) {
                setCurrentIndex(Math.max(0, filteredCollections.length - 1));
            }

            // Clamp verticalIndex for the current collection
            const currentImages = filteredCollections[currentIndex]?.images || [];
            if (verticalIndex >= currentImages.length && currentImages.length > 0) {
                setVerticalIndex(Math.max(0, currentImages.length - 1));
            }
        }
    }, [isMobile, currentIndex, filteredCollections.length, collections, verticalIndex]);

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

    const handleSlideClick = (link: string | null | undefined) => {
        if (!link || link.trim() === "") return;
        const target = link.trim();
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
    };

    if (isLoading) {
        return (
            <div className="w-full h-screen bg-neutral-500 flex flex-col items-center justify-center gap-8">
                <m.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.95, 1, 0.95] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-48 h-48"
                >
                    <Image src="/logo-enome.png" alt="Loading" fill className="object-contain brightness-0 invert opacity-20" />
                </m.div>
                <div className="flex flex-col items-center gap-2">
                    <div className="h-px w-24 bg-linear-to-r from-transparent via-white/20 to-transparent relative overflow-hidden">
                        <m.div
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
                router={router}
            />

            {/* Pagination Controls */}
            <SliderControls
                currentIndex={currentIndex}
                totalCollections={filteredCollections.length}
                paginate={paginate}
            />

            {/* Vertical Scroll Indicators */}
            <ScrollIndicators
                verticalIndex={verticalIndex}
                totalImages={filteredCollections[currentIndex]?.images.length || 0}
                scrollVertical={scrollVertical}
            />

            <AnimatePresence initial={false} custom={direction} mode="wait">
                <m.div
                    key={`${currentIndex}-${isMobile}`} // Re-mount when device changes to reset ScrollArea
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
                        {filteredCollections[currentIndex]?.images ? (
                            filteredCollections[currentIndex].images.map((img, i) => (
                                <div key={i} className="relative w-full h-screen snap-start shrink-0 overflow-hidden bg-zinc-950">
                                    {/* True Fullscreen Layer - CSS Background Image (Cover mode) */}
                                    <m.div
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
                                    {/* <m.div
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
                                </m.div> */}

                                    {/* Brand Logo - Dynamic Positioning */}
                                    {img.brandImageLink && (
                                        <div className={cn(
                                            "absolute inset-0 z-10 pointer-events-none w-full h-full",
                                            isMobile ? "p-8 pb-32" : "p-12 md:p-24"
                                        )}>
                                            <m.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 1, delay: 0.4 }}
                                                viewport={{ once: false }}
                                                className={cn(
                                                    "absolute flex flex-col transition-all duration-700",
                                                    getPositionClasses(img.brandPosition, isMobile)
                                                )}
                                            >
                                                <div className="relative w-24 h-24 md:w-96 md:h-96">
                                                    <Image
                                                        src={img.brandImageLink}
                                                        alt={img.brand || "Brand Logo"}
                                                        fill
                                                        className="object-contain"
                                                        priority
                                                    />
                                                </div>
                                            </m.div>
                                        </div>
                                    )}

                                    {/* Collection Title & Tagline - Dynamic Positioning */}
                                    <div className={cn(
                                        "absolute inset-0 z-10 pointer-events-none w-full h-full",
                                        isMobile ? "p-8 pb-32" : "p-12 md:p-24"
                                    )}>
                                        <div className={cn(
                                            "absolute flex flex-col transition-all duration-700",
                                            getPositionClasses(img.position, isMobile)
                                        )}>
                                            {img.tagline ? (
                                                <m.div
                                                    initial={{ opacity: 0, y: 15 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.8, delay: 0.2 }}
                                                    viewport={{ once: false }}
                                                    className="w-full md:max-w-3xl font-montserrat px-4 md:px-0"
                                                    dangerouslySetInnerHTML={{ __html: img.tagline }}
                                                />
                                            ) : (
                                                <m.p
                                                    initial={{ opacity: 0, y: 15 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.8, delay: 0.2 }}
                                                    viewport={{ once: false }}
                                                    className="font-montserrat text-[14px] md:text-[18px] text-black/80 tracking-[0.2em] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] max-w-2xl"
                                                >
                                                    {img.title || filteredCollections[currentIndex]?.title}
                                                </m.p>
                                            )}
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
                                                handleSlideClick(img.link);
                                            }}
                                            className="absolute inset-0 z-20 cursor-pointer pointer-events-auto"
                                        />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                                <div className="text-center space-y-4">
                                    <div className="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                                        <Compass className="size-8 text-white/20 animate-pulse" />
                                    </div>
                                    <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">Memuat Koleksi...</p>
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </m.div>
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
