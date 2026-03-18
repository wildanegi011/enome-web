"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronRight, Clock, Search, ShoppingCart, TrendingUp, X, Compass, Heart } from "lucide-react";
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
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { useHighlights, useProducts, useCategories } from "@/hooks/use-products";
import { useDebounce } from "@/hooks/use-debounce";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { ASSET_URL } from "@/config/config";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Collection {
    id: string;
    title: string;
    images: {
        url: string;
        aspect: string;
        isMobile: boolean;
    }[];
}

interface SearchModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    setDirection: (dir: number) => void;
    setCurrentIndex: (idx: number) => void;
    currentIndex: number;
    router: any;
    collections: Collection[];
}

export default function SearchModal({
    isOpen,
    onOpenChange,
    router,
    collections
}: SearchModalProps) {
    const isMobile = useIsMobile();
    const [searchValue, setSearchValue] = useState("");
    const debouncedSearch = useDebounce(searchValue, 300);

    const isSearching = debouncedSearch.length >= 3;
    const [viewportHeight, setViewportHeight] = useState("100dvh");

    useEffect(() => {
        if (!isMobile || !window.visualViewport) return;

        const handleResize = () => {
            if (window.visualViewport) {
                // Subtracting a small amount or using the exact height ensures 
                // the drawer bottom doesn't get cut off or hide the input
                setViewportHeight(`${window.visualViewport.height}px`);
            }
        };

        window.visualViewport.addEventListener("resize", handleResize);
        window.visualViewport.addEventListener("scroll", handleResize);
        handleResize();

        return () => {
            window.visualViewport?.removeEventListener("resize", handleResize);
            window.visualViewport?.removeEventListener("scroll", handleResize);
        };
    }, [isMobile, isOpen]);

    const { data: highlights = [] } = useHighlights();
    const { data: searchResults = [] } = useProducts(
        { search: debouncedSearch },
        { enabled: isSearching }
    );
    const { data: categories = [] } = useCategories(8);
    const { searches: recentSearches, addSearch, removeSearch, clearAll } = useRecentSearches();

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Use a small timeout to ensure the modal/drawer is rendered and ready
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const displayedProducts = isSearching ? searchResults : highlights;

    const handleSearchSubmit = (value?: string) => {
        const query = value || searchValue;
        if (query.trim()) {
            addSearch(query.trim());
            router.push(`/products?search=${encodeURIComponent(query.trim())}`);
            onOpenChange(false);
        }
    };

    const renderSearchContent = () => (
        <div className="flex flex-col min-h-0 overflow-hidden flex-1">
            {/* Search Input Area */}
            <div className="px-4 pt-6 pb-4 sm:pt-6 sm:pb-5 sm:bg-white [&_svg]:text-neutral-400 [&_svg]:opacity-100 [&_svg]:shrink-0 shrink-0">
                <div className="relative flex items-center group">
                    <Search className="absolute left-4 size-4.5 text-neutral-400 group-focus-within:text-neutral-900 transition-colors duration-300" />
                    <input
                        ref={inputRef}
                        placeholder="Cari produk..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="h-14 sm:h-13 text-[16px] sm:text-[15px] border border-zinc-100 focus:border-zinc-300 focus:ring-0 placeholder:text-neutral-300 text-neutral-900 font-semibold bg-zinc-50/50 sm:bg-white focus:bg-white rounded-2xl pl-12 pr-12 w-full transition-all font-montserrat tracking-tight shadow-xs outline-hidden"
                    />
                    {searchValue && (
                        <button
                            onClick={() => setSearchValue("")}
                            className="absolute right-4 p-1 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors text-neutral-400 hover:text-neutral-600"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Subtle Divider */}
            <div className="h-px bg-linear-to-r from-transparent via-zinc-200 to-transparent opacity-50 shrink-0 mx-4" />

            {/* Results Area */}
            <ScrollArea className="flex-1 no-scrollbar overflow-hidden" viewportClassName="h-full sm:max-h-[65vh]">
                <style jsx global>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
                <CommandList className="max-h-none h-full pb-6">
                    {/* Empty State */}
                    <CommandEmpty className="py-20 flex flex-col items-center justify-center gap-6 text-neutral-400">
                        <div className="size-20 rounded-[2.5rem] bg-amber-50/50 flex items-center justify-center border border-amber-100/50 shadow-xs">
                            <Search className="size-8 text-amber-600/40 stroke-[1.5]" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-neutral-900 text-[17px] font-bold tracking-tight font-montserrat">Tidak ada hasil ditemukan</p>
                            <p className="text-neutral-400 text-xs font-medium max-w-[250px] leading-relaxed">Coba gunakan kata kunci lain atau telusuri kategori kami.</p>
                        </div>
                    </CommandEmpty>

                    {/* ── Idle State: No search query ── */}
                    {!debouncedSearch && (
                        <>
                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <CommandGroup
                                    heading={
                                        <div className="flex items-center justify-between px-4 pt-4 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-3.5 text-neutral-400" />
                                                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-400 font-montserrat">Terakhir Dicari</span>
                                            </div>
                                            <button
                                                onClick={clearAll}
                                                className="text-[10px] font-bold text-neutral-400 hover:text-neutral-500 transition-colors cursor-pointer"
                                            >
                                                BERSIHKAN SEMUA
                                            </button>
                                        </div>
                                    }
                                >
                                    <div className="px-3 flex flex-wrap gap-2">
                                        {recentSearches.map((term) => (
                                            <CommandItem
                                                key={term}
                                                onSelect={() => {
                                                    setSearchValue(term);
                                                    handleSearchSubmit(term);
                                                }}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100/50 hover:bg-zinc-100 data-[selected=true]:bg-zinc-100 text-[13px] font-bold text-neutral-600 hover:text-neutral-900 data-[selected=true]:text-neutral-900 cursor-pointer transition-all group/item font-montserrat border border-transparent hover:border-zinc-200"
                                            >
                                                {term}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeSearch(term); }}
                                                    className="size-4 rounded-full hover:bg-zinc-200 flex items-center justify-center transition-colors cursor-pointer text-neutral-300 group-hover/item:text-neutral-500"
                                                >
                                                    <X className="size-2.5" />
                                                </button>
                                            </CommandItem>
                                        ))}
                                    </div>
                                </CommandGroup>
                            )}

                            {/* Trending Categories */}
                            {categories.length > 0 && (
                                <CommandGroup
                                    heading={
                                        <div className="flex items-center gap-2 px-4 pt-6 pb-3">
                                            <TrendingUp className="size-3.5 text-neutral-500" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500 font-montserrat">Kategori</span>
                                        </div>
                                    }
                                >
                                    <div className="px-3 flex flex-wrap gap-2">
                                        {categories.slice(0, 8).map((cat) => (
                                            <CommandItem
                                                key={cat.kategoriId}
                                                onSelect={() => {
                                                    addSearch(cat.kategori);
                                                    router.push(`/products?category=${cat.kategori}`);
                                                    onOpenChange(false);
                                                }}
                                                className="inline-flex items-center px-4 py-2 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 data-[selected=true]:bg-zinc-50 text-[13px] font-bold text-neutral-500 hover:text-neutral-900 data-[selected=true]:text-neutral-900 cursor-pointer transition-all font-montserrat tracking-tight"
                                            >
                                                {cat.kategori}
                                            </CommandItem>
                                        ))}
                                    </div>
                                </CommandGroup>
                            )}
                        </>
                    )}

                    {/* Products (search results only) */}
                    {debouncedSearch && displayedProducts.length > 0 && (
                        <CommandGroup
                            heading={
                                <div className="flex items-center gap-2 px-4 pt-2 pb-4">
                                    <ShoppingCart className="size-3.5 text-neutral-500" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500 font-montserrat">
                                        Hasil Pencarian
                                    </span>
                                    <span className="ml-auto px-2 py-0.5 rounded-full bg-zinc-100 text-[10px] font-bold text-neutral-400 font-montserrat tracking-tighter">
                                        {displayedProducts.length} Produk
                                    </span>
                                </div>
                            }
                        >
                            <div className="px-3 space-y-2">
                                {displayedProducts.map((product) => (
                                    <CommandItem
                                        key={product.produkId}
                                        onSelect={() => {
                                            if (searchValue.trim()) addSearch(searchValue.trim());
                                            router.push(`/products/${product.produkId}`);
                                            onOpenChange(false);
                                        }}
                                        className="group/prod flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-zinc-50 data-[selected=true]:bg-zinc-50 cursor-pointer transition-all border border-transparent hover:border-zinc-100"
                                    >
                                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200/50 group-hover/prod:scale-105 transition-transform duration-500">
                                            <Image
                                                src={`${ASSET_URL}/img/produk_utama/${product.gambar}` || "/placeholder.png"}
                                                alt={product.namaProduk}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1 gap-1.5">
                                            <span className="font-bold text-[13px] sm:text-[14px] text-neutral-600 truncate leading-tight tracking-tight font-montserrat">{product.namaProduk}</span>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-montserrat leading-none w-fit">{product.kategori}</span>
                                                <span className="text-[14px] font-black text-neutral-600 font-montserrat tracking-tight leading-tight">
                                                    {product.finalMinPrice ? formatCurrency(Number(product.finalMinPrice)) : "—"}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="size-4 text-neutral-200 group-hover/prod:text-neutral-900 group-hover/prod:translate-x-1 transition-all" />
                                    </CommandItem>
                                ))}
                            </div>
                        </CommandGroup>
                    )}

                    {/* Quick Links (idle only) */}
                    {!debouncedSearch && (
                        <>
                            <div className="my-3 h-px bg-zinc-100 mx-4" />
                            <CommandGroup
                                heading={
                                    <div className="flex items-center gap-2 px-4 pt-1 pb-2">
                                        <Compass className="size-3 text-neutral-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 font-montserrat">Tautan cepat</span>
                                    </div>
                                }
                            >
                                <div className="px-2 space-y-0.5">
                                    {[
                                        { label: "Semua Produk", path: "/products", icon: ShoppingCart },
                                        { label: "Wishlist", path: "/account/wishlist", icon: Heart },
                                    ].map((link) => (
                                        <CommandItem
                                            key={link.path}
                                            onSelect={() => {
                                                router.push(link.path);
                                                onOpenChange(false);
                                            }}
                                            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 data-[selected=true]:bg-zinc-50 cursor-pointer transition-colors"
                                        >
                                            <div className="size-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-200 group-data-[selected=true]:bg-zinc-200 transition-colors">
                                                <link.icon className="size-4 text-neutral-500 group-hover:text-neutral-900 group-data-[selected=true]:text-neutral-900" />
                                            </div>
                                            <span className="text-sm font-bold text-neutral-600 group-hover:text-neutral-900 group-data-[selected=true]:text-neutral-900 tracking-tight">{link.label}</span>
                                            <ChevronRight className="ml-auto size-4 text-neutral-300 group-hover:text-neutral-500" />
                                        </CommandItem>
                                    ))}
                                </div>
                            </CommandGroup>
                        </>
                    )}
                </CommandList>
            </ScrollArea>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open && searchValue.trim()) {
                        addSearch(searchValue.trim());
                    }
                    onOpenChange(open);
                }}
            >
                <DrawerContent
                    className="flex flex-col p-0 border-none bg-white rounded-none outline-hidden overflow-hidden"
                    style={{ height: viewportHeight }}
                >
                    <DrawerHeader className="sr-only">
                        <DrawerTitle>Pencarian Produk</DrawerTitle>
                        <DrawerDescription>Cari koleksi batik premium kami</DrawerDescription>
                    </DrawerHeader>

                    {/* Mobile Header Close Button */}
                    <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0 sm:hidden">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-400 font-montserrat">Pencarian</span>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-2 -mr-2 text-neutral-400 hover:text-neutral-900 transition-colors bg-zinc-50 rounded-full"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    <Command className="bg-transparent flex flex-col items-stretch h-full border-none outline-hidden" shouldFilter={false}>
                        {renderSearchContent()}
                    </Command>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <CommandDialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open && searchValue.trim()) {
                    addSearch(searchValue.trim());
                }
                onOpenChange(open);
            }}
            className="w-full sm:max-w-lg p-0 bg-white border border-zinc-200/60 text-neutral-900 rounded-2xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] flex flex-col outline-hidden h-auto transition-all duration-300"
            commandClassName="bg-transparent flex flex-col h-full"
            showCloseButton={false}
            shouldFilter={false}
        >
            {renderSearchContent()}

            {/* Desktop Footer */}
            <div className="flex px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/30 items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-montserrat">
                        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] font-black text-neutral-400">ESC</kbd>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">close</span>
                    </div>
                </div>
                <span className="text-[10px] text-neutral-300 font-black tracking-[0.3em] uppercase font-montserrat">ÉNOMÉ</span>
            </div>
        </CommandDialog>
    );
}
