"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowDown, ArrowUp, Search, ShoppingBag, Heart, User, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/store/auth/AuthModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    Command,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";

interface Collection {
    id: string;
    title: string;
    images: {
        url: string;
        aspectRatio: string; // e.g. "aspect-[3/4]"
    }[];
}

const MOCK_COLLECTIONS: Collection[] = [
    {
        id: "home",
        title: "BERANDA",
        images: [
            { url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1574015974293-817f0efebb1b?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1572493122750-394dd95cee7a?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
        ]
    },
    {
        id: "batik-enome",
        title: "Batik Enome",
        images: [
            { url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1574015974293-817f0efebb1b?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1572493122750-394dd95cee7a?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
        ]
    },
    {
        id: "batik-by-nuna",
        title: "Batik by nuna",
        images: [
            { url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1574015974293-817f0efebb1b?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1572493122750-394dd95cee7a?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
        ]
    },
    {
        id: "enome-homme",
        title: "enome homme",
        images: [
            { url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1574015974293-817f0efebb1b?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
            { url: "https://images.unsplash.com/photo-1572493122750-394dd95cee7a?q=80&w=1000&auto=format&fit=crop", aspectRatio: "aspect-[3/4]" },
        ]
    }
];

const MOCK_PRODUCTS = [
    {
        id: "p1",
        name: "Abimanyu Silk Blouse",
        category: "Koleksi Wanita",
        price: "Rp 1.250.000",
        image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=400&auto=format&fit=crop"
    },
    {
        id: "p2",
        name: "Arjuna Slim Fit Shirt",
        category: "Klasik Pria",
        price: "Rp 850.000",
        image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&auto=format&fit=crop"
    },
    {
        id: "p3",
        name: "Kencana Maxi Dress",
        category: "Gaun Malam Eksklusif",
        price: "Rp 2.100.000",
        image: "https://images.unsplash.com/photo-1574015974293-817f0efebb1b?q=80&w=400&auto=format&fit=crop"
    },
    {
        id: "p4",
        name: "Prameswari Silk Scarf",
        category: "Aksesoris",
        price: "Rp 450.000",
        image: "https://images.unsplash.com/photo-1572493122750-394dd95cee7a?q=80&w=400&auto=format&fit=crop"
    }
];

const SearchMenuContent = ({
    setDirection,
    setCurrentIndex,
    currentIndex,
    setIsSearchOpen,
    router
}: {
    setDirection: (dir: number) => void;
    setCurrentIndex: (idx: number) => void;
    currentIndex: number;
    setIsSearchOpen: (open: boolean) => void;
    router: any;
}) => (
    <CommandList className="scrollbar-hide max-h-none">
        <CommandEmpty className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="size-16 rounded-2xl bg-stone-100 flex items-center justify-center">
                <Search className="size-6 text-stone-400" />
            </div>
            <p className="text-stone-800 text-base font-semibold">Tidak ada hasil ditemukan</p>
            <p className="text-stone-400 text-sm">Coba kata kunci lain</p>
        </CommandEmpty>

        {/* Collections Section */}
        <CommandGroup heading={<span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400 px-5 md:px-8 pt-6 pb-2 block">Koleksi</span>}>
            <div className="px-4 md:px-6 space-y-1.5">
                {MOCK_COLLECTIONS.map((collection) => (
                    <CommandItem
                        key={collection.id}
                        onSelect={() => {
                            const index = MOCK_COLLECTIONS.findIndex(c => c.id === collection.id);
                            if (index !== -1) {
                                setDirection(index > currentIndex ? 1 : -1);
                                setCurrentIndex(index);
                                setIsSearchOpen(false);
                            }
                        }}
                        className="group/item flex items-center gap-4 md:gap-5 px-3 md:px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-transparent hover:bg-stone-50 data-[selected=true]:bg-stone-50 cursor-pointer transition-all duration-200"
                    >
                        <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                            <Image
                                src={collection.images[0].url}
                                alt={collection.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden min-w-0">
                            <span className="font-semibold text-[14px] md:text-[15px] text-stone-800 truncate">{collection.title}</span>
                            <span className="text-[11px] md:text-[12px] text-stone-400 truncate">{collection.images.length} produk</span>
                        </div>
                        <ChevronRight className="ml-auto size-4 text-stone-300 group-hover/item:text-stone-500 shrink-0 transition-colors" />
                    </CommandItem>
                ))}
            </div>
        </CommandGroup>

        <div className="my-4 h-px bg-stone-100 mx-6 md:mx-8" />

        {/* Products Section */}
        <CommandGroup heading={<span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400 px-5 md:px-8 pt-2 pb-2 block">Produk Populer</span>}>
            <div className="px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {MOCK_PRODUCTS.map((product) => (
                    <CommandItem
                        key={product.id}
                        onSelect={() => {
                            router.push(`/products/${product.id}`);
                            setIsSearchOpen(false);
                        }}
                        className="group/prod flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 rounded-xl md:rounded-2xl bg-transparent hover:bg-stone-50 data-[selected=true]:bg-stone-50 cursor-pointer transition-all duration-200"
                    >
                        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden min-w-0">
                            <span className="font-medium text-[13px] md:text-[14px] text-stone-800 truncate">{product.name}</span>
                            <span className="text-[11px] text-stone-400 truncate">{product.category}</span>
                            <span className="text-[13px] md:text-[14px] text-stone-900 font-semibold">{product.price}</span>
                        </div>
                    </CommandItem>
                ))}
            </div>
        </CommandGroup>

        <div className="my-4 h-px bg-stone-100 mx-6 md:mx-8" />

        {/* Quick Links */}
        <CommandGroup heading={<span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400 px-5 md:px-8 pt-2 pb-2 block">Pintasan</span>}>
            <div className="flex flex-wrap gap-2 px-5 md:px-7 pb-8">
                {[
                    { name: "Semua Produk", path: "/products", icon: ShoppingBag },
                    { name: "Wishlist", path: "/account/wishlist", icon: Heart },
                    { name: "Bantuan", path: "/faq", icon: Settings },
                ].map((action) => (
                    <button
                        key={action.name}
                        onClick={() => {
                            router.push(action.path);
                            setIsSearchOpen(false);
                        }}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-[12px] font-medium text-stone-600 hover:text-stone-800 transition-all active:scale-95"
                    >
                        <action.icon className="size-3.5" />
                        {action.name}
                    </button>
                ))}
            </div>
        </CommandGroup>
    </CommandList>
);

export default function CollectionSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [verticalIndex, setVerticalIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    const { count: cartCount } = useCart();
    const { data: wishlistData } = useWishlist();
    const wishlistCount = wishlistData?.items?.length || 0;
    const [authModal, setAuthModal] = useState<{ open: boolean; tab: "login" | "register" }>({ open: false, tab: "login" });

    const paginate = (newDirection: number) => {
        const newIndex = currentIndex + newDirection;
        if (newIndex >= 0 && newIndex < MOCK_COLLECTIONS.length) {
            setDirection(newDirection);
            setCurrentIndex(newIndex);
            setVerticalIndex(0); // Reset vertical scroll on collection change
        }
    };

    const scrollVertical = (newDirection: number) => {
        const newIndex = verticalIndex + newDirection;
        const maxIndex = MOCK_COLLECTIONS[currentIndex].images.length - 1;
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
    }, [verticalIndex]);

    const isMobile = useIsMobile();

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0
        })
    };

    const [isSearchOpen, setIsSearchOpen] = useState(false);

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

    return (
        <section className="relative w-full h-screen bg-black overflow-hidden select-none text-white">
            {/* Top Navigation Overlay */}
            <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
                <div className="flex items-center justify-end gap-3 px-5 py-5 md:px-10 md:py-8">
                    {/* Search Bar Trigger */}
                    <div
                        onClick={() => setIsSearchOpen(true)}
                        className="group pointer-events-auto flex items-center gap-3 bg-black/30 backdrop-blur-xl border border-white/10 pl-4 pr-4 md:pl-5 md:pr-5 h-11 md:h-12 rounded-full cursor-pointer hover:bg-black/40 hover:border-white/20 transition-all duration-300 w-[200px] md:w-[480px]"
                    >
                        <Search className="size-4 text-white/50 group-hover:text-white/80 transition-colors shrink-0" />
                        <span className="text-[13px] text-white/50 group-hover:text-white/80 transition-colors truncate">Cari produk...</span>
                        <kbd className="pointer-events-none ml-auto hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded border border-white/15 bg-white/5 px-1.5 font-mono text-[10px] text-white/40">
                            <span className="text-[10px]">⌘</span>K
                        </kbd>
                    </div>

                    {/* Signup Button */}
                    <button
                        onClick={() => setAuthModal({ open: true, tab: "register" })}
                        className="pointer-events-auto h-11 md:h-12 px-5 md:px-7 rounded-full bg-white text-stone-900 text-[12px] md:text-[13px] font-semibold hover:bg-stone-100 transition-all duration-300 active:scale-[0.97] shrink-0"
                    >
                        Daftar
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Search Experience */}
            {isMobile ? (
                <Drawer open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                    <DrawerContent className="bg-stone-50 border-stone-200 text-stone-900 rounded-t-3xl h-[85vh] border-t p-0">
                        <DrawerHeader className="sr-only">
                            <DrawerTitle>Cari Produk</DrawerTitle>
                        </DrawerHeader>
                        <Command className="bg-transparent flex flex-col h-full overflow-hidden">
                            <div className="relative border-b border-stone-200/60 px-5 py-3 shrink-0">
                                <CommandInput
                                    placeholder="Cari produk, koleksi..."
                                    className="h-12 text-base border-none focus:ring-0 placeholder:text-stone-400 text-stone-900 font-medium pl-0"
                                />
                            </div>
                            <ScrollArea className="flex-1 scrollbar-hide">
                                <SearchMenuContent
                                    setDirection={setDirection}
                                    setCurrentIndex={setCurrentIndex}
                                    currentIndex={currentIndex}
                                    setIsSearchOpen={setIsSearchOpen}
                                    router={router}
                                />
                            </ScrollArea>
                        </Command>
                    </DrawerContent>
                </Drawer>
            ) : (
                <CommandDialog
                    open={isSearchOpen}
                    onOpenChange={setIsSearchOpen}
                    className="bg-stone-50/95 backdrop-blur-2xl border border-stone-200/50 text-stone-900 rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] max-w-2xl"
                    commandClassName="bg-transparent"
                >
                    <div className="relative border-b border-stone-200/60 px-6 py-5">
                        <CommandInput
                            placeholder="Cari produk, koleksi..."
                            className="h-12 text-lg border-none focus:ring-0 placeholder:text-stone-400 text-stone-900 font-medium pl-0"
                        />
                    </div>

                    <ScrollArea className="h-[520px] scrollbar-hide">
                        <SearchMenuContent
                            setDirection={setDirection}
                            setCurrentIndex={setCurrentIndex}
                            currentIndex={currentIndex}
                            setIsSearchOpen={setIsSearchOpen}
                            router={router}
                        />
                    </ScrollArea>
                </CommandDialog>
            )}

            {/* Horizontal Navigation Labels - Subtle Overlay */}
            {/* <div className="absolute top-10 left-0 right-0 z-50 flex items-center justify-between px-10 pointer-events-none">
                <div className="bg-white/10 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/20 shadow-2xl pointer-events-auto">
                    <p className="text-[11px] font-black text-white uppercase tracking-[0.5em]">
                        {MOCK_COLLECTIONS[currentIndex].title}
                    </p>
                </div>
            </div> */}

            {/* Horizontal Slider Controls - High Visibility Circles */}
            <div className="absolute inset-y-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12 pointer-events-none">
                <button
                    onClick={() => paginate(-1)}
                    disabled={currentIndex === 0}
                    className={cn(
                        "w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-3xl text-white border border-white/20 hover:bg-white/40 hover:border-white/40 transition-all active:scale-95 pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.3)] group",
                        currentIndex === 0 && "opacity-0 pointer-events-none"
                    )}
                >
                    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <button
                    onClick={() => paginate(1)}
                    disabled={currentIndex === MOCK_COLLECTIONS.length - 1}
                    className={cn(
                        "w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-3xl text-white border border-white/20 hover:bg-white/40 hover:border-white/40 transition-all active:scale-95 pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.3)] group",
                        currentIndex === MOCK_COLLECTIONS.length - 1 && "opacity-0 pointer-events-none"
                    )}
                >
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Vertical Scroll Controls - Enhanced Visibility */}
            <div className="absolute inset-x-0 bottom-10 z-50 flex flex-col items-center pointer-events-none">
                <AnimatePresence mode="wait">
                    {verticalIndex < MOCK_COLLECTIONS[currentIndex].images.length - 1 ? (
                        <motion.button
                            key="down"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            onClick={() => scrollVertical(1)}
                            className="flex flex-col items-center gap-3 group pointer-events-auto cursor-pointer"
                        >
                            <span className="text-[11px] font-black text-white tracking-[0.6em] group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                Gulir ke Bawah
                            </span>

                            {/* Animated Progress Line */}
                            {/* <div className="relative w-[2px] h-12 bg-white/20 overflow-hidden">
                                <motion.div
                                    animate={{ y: [-48, 48] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                    className="absolute inset-x-0 top-0 h-full bg-white shadow-[0_0_10px_white]"
                                />
                            </div> */}

                            <motion.div
                                animate={{ y: [0, 6, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <ArrowDown className="w-5 h-5 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" />
                            </motion.div>
                        </motion.button>
                    ) : (
                        <motion.button
                            key="up"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            onClick={() => scrollVertical(-verticalIndex)}
                            className="flex flex-col items-center gap-3 group pointer-events-auto cursor-pointer"
                        >
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <ArrowUp className="w-5 h-5 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" />
                            </motion.div>

                            <span className="text-[11px] font-black text-white tracking-[0.6em] group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                Kembali ke Atas
                            </span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

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
                    {/* Vertical Snap Scroll Column */}
                    <div
                        ref={scrollContainerRef}
                        className="w-full h-full overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth"
                    >
                        {MOCK_COLLECTIONS[currentIndex].images.map((img, i) => (
                            <div key={i} className="relative w-full h-screen snap-start shrink-0 overflow-hidden">
                                <Image
                                    src={img.url}
                                    alt={`${MOCK_COLLECTIONS[currentIndex].title} - ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    priority={i === 0}
                                />

                                {/* Logo Overlay as per Mockup */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="relative w-64 h-64 md:w-96 md:h-96 opacity-60 drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                                        <Image
                                            src="/logo-enome.png"
                                            alt="Overlay Logo"
                                            fill
                                            className="object-contain brightness-[1.8]"
                                        />
                                    </div>
                                </div>

                                {/* Shadow Overlay for Better Legibility */}
                                <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />
                            </div>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Collection Dots - Right Side */}
            <div className="absolute top-1/2 -translate-y-1/2 right-6 md:right-10 z-50 flex flex-col gap-3">
                {MOCK_COLLECTIONS.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setDirection(idx > currentIndex ? 1 : -1);
                            setCurrentIndex(idx);
                        }}
                        className={cn(
                            "w-1.5 rounded-full transition-all duration-500",
                            currentIndex === idx ? "h-10 bg-white" : "h-1.5 bg-white/20 hover:bg-white/40"
                        )}
                        title={`Go to ${MOCK_COLLECTIONS[idx].title}`}
                    />
                ))}
            </div>

            <AuthModal
                isOpen={authModal.open}
                onClose={() => setAuthModal({ ...authModal, open: false })}
                defaultTab={authModal.tab}
            />
        </section>
    );
}
