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
            <div className="px-4 pt-6 pb-3 sm:pt-4 sm:pb-3 sm:bg-zinc-50/50 [&_svg]:text-zinc-400 [&_svg]:opacity-100 [&_svg]:shrink-0 shrink-0">
                <div className="relative flex items-center">
                    <Search className="absolute left-4 size-4 text-zinc-400" />
                    <input
                        ref={inputRef}
                        placeholder="Cari produk..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        // onKeyDown={(e) => {
                        //     if (e.key === "Enter") {
                        //         handleSearchSubmit();
                        //     }
                        // }}
                        className="h-12 sm:h-11 text-base sm:text-sm border-none focus:ring-0 placeholder:text-zinc-400 text-zinc-900 font-bold bg-zinc-50 sm:bg-white focus:bg-zinc-100 sm:focus:bg-zinc-50 rounded-xl pl-11 pr-11 w-full transition-all font-montserrat tracking-tight shadow-sm sm:shadow-none outline-hidden"
                    />
                    {searchValue && (
                        <button
                            onClick={() => setSearchValue("")}
                            className="absolute right-4 size-6 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-100 shrink-0" />

            {/* Results Area */}
            <ScrollArea className="flex-1 no-scrollbar overflow-hidden" viewportClassName="h-full sm:max-h-[65vh]">
                <style jsx global>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
                <CommandList className="max-h-none h-full pb-6">
                    {/* Empty State */}
                    <CommandEmpty className="py-16 flex flex-col items-center justify-center gap-4 text-zinc-400">
                        <div className="size-14 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200/50">
                            <Search className="size-6 text-zinc-300" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-zinc-600 text-sm font-bold tracking-tight">Tidak ada hasil ditemukan</p>
                            <p className="text-zinc-400 text-xs">Coba dengan kata kunci lain</p>
                        </div>
                    </CommandEmpty>

                    {/* ── Idle State: No search query ── */}
                    {!debouncedSearch && (
                        <>
                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <CommandGroup
                                    heading={
                                        <div className="flex items-center justify-between px-4 pt-2 pb-2">
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-3 text-zinc-400" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-montserrat">Recent</span>
                                            </div>
                                            <button
                                                onClick={clearAll}
                                                className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                                            >
                                                Bersihkan semua
                                            </button>
                                        </div>
                                    }
                                >
                                    <div className="px-2 flex flex-wrap gap-1.5">
                                        {recentSearches.map((term) => (
                                            <CommandItem
                                                key={term}
                                                onSelect={() => {
                                                    setSearchValue(term);
                                                    handleSearchSubmit(term);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 data-[selected=true]:bg-zinc-200 text-[13px] font-bold text-zinc-600 hover:text-zinc-900 data-[selected=true]:text-zinc-900 cursor-pointer transition-colors group/item font-montserrat"
                                            >
                                                {term}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeSearch(term); }}
                                                    className="size-3.5 rounded-full hover:bg-zinc-300 flex items-center justify-center transition-colors cursor-pointer text-zinc-400 group-hover/item:text-zinc-600"
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
                                        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                                            <TrendingUp className="size-3 text-zinc-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-montserrat">Kategori</span>
                                        </div>
                                    }
                                >
                                    <div className="px-2 flex flex-wrap gap-1.5">
                                        {categories.slice(0, 8).map((cat) => (
                                            <CommandItem
                                                key={cat.kategoriId}
                                                onSelect={() => {
                                                    addSearch(cat.kategori);
                                                    router.push(`/products?category=${cat.kategori}`);
                                                    onOpenChange(false);
                                                }}
                                                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 data-[selected=true]:bg-zinc-50 text-[13px] font-black text-zinc-500 hover:text-zinc-900 data-[selected=true]:text-zinc-900 cursor-pointer transition-colors font-montserrat"
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
                                <div className="flex items-center gap-2 px-4 pt-1 pb-2">
                                    <ShoppingCart className="size-3 text-zinc-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-montserrat">
                                        Hasil
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-400 font-montserrat tracking-tight">
                                        {displayedProducts.length} Produk
                                    </span>
                                </div>
                            }
                        >
                            <div className="px-2 space-y-0.5">
                                {displayedProducts.map((product) => (
                                    <CommandItem
                                        key={product.produkId}
                                        onSelect={() => {
                                            if (searchValue.trim()) addSearch(searchValue.trim());
                                            router.push(`/products/${product.produkId}`);
                                            onOpenChange(false);
                                        }}
                                        className="group/prod flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 data-[selected=true]:bg-zinc-50 cursor-pointer transition-colors"
                                    >
                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200/50">
                                            <Image
                                                src={`${ASSET_URL}/img/produk_utama/${product.gambar}` || "/placeholder.png"}
                                                alt={product.namaProduk}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0 gap-1">
                                            <span className="font-bold text-[16px] text-neutral-900 truncate leading-tight tracking-tight">{product.namaProduk}</span>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest font-montserrat leading-none">{product.kategori}</span>
                                                <span className="text-[14px] font-bold text-neutral-900 font-montserrat tracking-tight leading-tight">
                                                    {product.finalMinPrice ? formatCurrency(Number(product.finalMinPrice)) : "—"}
                                                </span>
                                            </div>
                                        </div>
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
                                        <Compass className="size-3 text-zinc-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-montserrat">Tautan cepat</span>
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
                                                <link.icon className="size-4 text-zinc-500 group-hover:text-zinc-900 group-data-[selected=true]:text-zinc-900" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-600 group-hover:text-zinc-900 group-data-[selected=true]:text-zinc-900 tracking-tight">{link.label}</span>
                                            <ChevronRight className="ml-auto size-4 text-zinc-300 group-hover:text-zinc-500" />
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
                <DrawerContent className="h-full flex flex-col p-0 border-none bg-white rounded-none outline-hidden">
                    <DrawerHeader className="sr-only">
                        <DrawerTitle>Pencarian Produk</DrawerTitle>
                        <DrawerDescription>Cari koleksi batik premium kami</DrawerDescription>
                    </DrawerHeader>
                    
                    {/* Mobile Header Close Button */}
                    <div className="flex items-center justify-between px-4 pt-4 shrink-0 sm:hidden">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400 font-montserrat">Pencarian</span>
                        <button 
                            onClick={() => onOpenChange(false)}
                            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 transition-colors"
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
            className="w-full sm:max-w-lg p-0 bg-stone-50/95 backdrop-blur-2xl border border-stone-200/50 text-zinc-900 rounded-2xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] flex flex-col outline-hidden h-auto transition-all duration-300"
            commandClassName="bg-transparent flex flex-col h-full"
            showCloseButton={false}
            shouldFilter={false}
        >
            {renderSearchContent()}

            {/* Desktop Footer */}
            <div className="flex px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/30 items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-montserrat">
                        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] font-black text-zinc-400">ESC</kbd>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">close</span>
                    </div>
                </div>
                <span className="text-[10px] text-zinc-300 font-black tracking-[0.3em] uppercase font-montserrat">ÉNOMÉ</span>
            </div>
        </CommandDialog>
    );
}
