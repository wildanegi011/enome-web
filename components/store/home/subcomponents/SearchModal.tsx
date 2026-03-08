"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight, Clock, Search, ShoppingCart, Sparkles, TrendingUp, X, Compass, Heart } from "lucide-react";
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
} from "@/components/ui/drawer";
import { useHighlights, useProducts, useCategories } from "@/hooks/use-products";
import { useDebounce } from "@/hooks/use-debounce";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { ASSET_URL } from "@/config/config";
import { formatCurrency } from "@/lib/utils";

interface Collection {
    id: string;
    title: string;
    images: {
        url: string;
        aspect: string;
    }[];
}

/* ─── Shared Search Results Content ─── */
const SearchMenuContent = ({
    setDirection,
    setCurrentIndex,
    currentIndex,
    setIsSearchOpen,
    router,
    collections,
    products,
    searchQuery,
    categories,
    recentSearches,
    onRemoveRecent,
    onClearRecent,
    onSelectRecent,
    searchValue,
    addSearch,
}: {
    setDirection: (dir: number) => void;
    setCurrentIndex: (idx: number) => void;
    currentIndex: number;
    setIsSearchOpen: (open: boolean) => void;
    router: any;
    collections: Collection[];
    products: any[];
    searchQuery: string;
    categories: { kategoriId: number; kategori: string }[];
    recentSearches: string[];
    onRemoveRecent: (q: string) => void;
    onClearRecent: () => void;
    onSelectRecent: (q: string) => void;
    searchValue: string;
    addSearch: (q: string) => void;
}) => (
    <CommandList className="max-h-none pb-6">
        {/* Empty State */}
        <CommandEmpty className="py-16 flex flex-col items-center justify-center gap-4 text-zinc-100">
            <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center">
                <Search className="size-6 text-zinc-500" />
            </div>
            <div className="text-center space-y-1">
                <p className="text-zinc-300 text-sm font-semibold">Tidak ada hasil ditemukan</p>
                <p className="text-zinc-500 text-xs">Coba dengan kata kunci lain</p>
            </div>
        </CommandEmpty>

        {/* ── Idle State: No search query ── */}
        {!searchQuery && (
            <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                    <CommandGroup
                        heading={
                            <div className="flex items-center justify-between px-4 pt-2 pb-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="size-3 text-zinc-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 font-plus-jakarta">Recent</span>
                                </div>
                                <button
                                    onClick={onClearRecent}
                                    className="text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
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
                                    onSelect={() => onSelectRecent(term)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 data-[selected=true]:bg-white/10 text-xs font-medium text-zinc-300 hover:text-white data-[selected=true]:text-white cursor-pointer transition-colors group/item"
                                >
                                    {term}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemoveRecent(term); }}
                                        className="size-3.5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-zinc-500 group-hover/item:text-zinc-300"
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
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 font-plus-jakarta">Kategori</span>
                            </div>
                        }
                    >
                        <div className="px-2 flex flex-wrap gap-1.5">
                            {categories.slice(0, 8).map((cat) => (
                                <CommandItem
                                    key={cat.kategoriId}
                                    onSelect={() => {
                                        if (searchValue.trim()) addSearch(searchValue.trim());
                                        router.push(`/products?category=${cat.kategori}`);
                                        setIsSearchOpen(false);
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/10 data-[selected=true]:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white data-[selected=true]:text-white cursor-pointer transition-colors font-plus-jakarta"
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
        {searchQuery && (
            <CommandGroup
                heading={
                    <div className="flex items-center gap-2 px-4 pt-1 pb-2">
                        <ShoppingCart className="size-3 text-zinc-500" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 font-plus-jakarta">
                            Hasil
                        </span>
                    </div>
                }
            >
                <div className="px-2 space-y-0.5">
                    {products.map((product) => (
                        <CommandItem
                            key={product.produkId}
                            onSelect={() => {
                                if (searchValue.trim()) addSearch(searchValue.trim());
                                router.push(`/products/${product.produkId}`);
                                setIsSearchOpen(false);
                            }}
                            className="group/prod flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 data-[selected=true]:bg-white/5 cursor-pointer transition-colors"
                        >
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0">
                                <Image
                                    src={`${ASSET_URL}/img/produk_utama/${product.gambar}` || "/placeholder.png"}
                                    alt={product.namaProduk}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex flex-col min-w-0 gap-0.5">
                                <span className="font-semibold text-sm text-zinc-200 truncate font-plus-jakarta leading-tight">{product.namaProduk}</span>
                                <span className="text-[11px] text-zinc-500 font-inter">{product.kategori}</span>
                            </div>
                            <span className="ml-auto text-sm font-bold text-white shrink-0 font-inter tracking-tight">
                                {product.finalMinPrice ? formatCurrency(Number(product.finalMinPrice)) : "—"}
                            </span>
                        </CommandItem>
                    ))}
                </div>
            </CommandGroup>
        )}

        {/* Quick Links (idle only) */}
        {!searchQuery && (
            <>
                <div className="my-3 h-px bg-white/5 mx-4" />
                <CommandGroup
                    heading={
                        <div className="flex items-center gap-2 px-4 pt-1 pb-2">
                            <Compass className="size-3 text-zinc-500" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 font-plus-jakarta">Tautan cepat</span>
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
                                    setIsSearchOpen(false);
                                }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 data-[selected=true]:bg-white/5 cursor-pointer transition-colors"
                            >
                                <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 group-data-[selected=true]:bg-white/10 transition-colors">
                                    <link.icon className="size-4 text-zinc-400 group-hover:text-white group-data-[selected=true]:text-white" />
                                </div>
                                <span className="text-sm font-medium text-zinc-300 group-hover:text-white group-data-[selected=true]:text-white">{link.label}</span>
                                <ChevronRight className="ml-auto size-4 text-zinc-600 group-hover:text-zinc-400" />
                            </CommandItem>
                        ))}
                    </div>
                </CommandGroup>
            </>
        )}
    </CommandList>
);

/* ─── Props ─── */
interface SearchModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isMobile: boolean;
    setDirection: (dir: number) => void;
    setCurrentIndex: (idx: number) => void;
    currentIndex: number;
    router: any;
    collections: Collection[];
}

/* ─── Main Component ─── */
export default function SearchModal({
    isOpen,
    onOpenChange,
    isMobile,
    setDirection,
    setCurrentIndex,
    currentIndex,
    router,
    collections
}: SearchModalProps) {
    const [searchValue, setSearchValue] = useState("");
    const debouncedSearch = useDebounce(searchValue, 300);

    const { data: highlights = [] } = useHighlights();
    const { data: searchResults = [] } = useProducts({ search: debouncedSearch });
    const { data: categories = [] } = useCategories(8);
    const { searches: recentSearches, addSearch, removeSearch, clearAll } = useRecentSearches();

    const displayedProducts = debouncedSearch ? searchResults : highlights;

    const handleSelectRecent = (term: string) => {
        setSearchValue(term);
    };

    const handleSearchSubmit = (value?: string) => {
        const query = value || searchValue;
        if (query.trim()) {
            addSearch(query.trim());
            router.push(`/products?search=${encodeURIComponent(query.trim())}`);
            onOpenChange(false);
        }
    };

    const sharedProps = {
        setDirection,
        setCurrentIndex,
        currentIndex,
        setIsSearchOpen: onOpenChange,
        router,
        collections,
        products: displayedProducts,
        searchQuery: debouncedSearch,
        categories,
        recentSearches,
        onRemoveRecent: removeSearch,
        onClearRecent: clearAll,
        onSelectRecent: (term: string) => {
            setSearchValue(term);
            handleSearchSubmit(term);
        },
        searchValue,
        addSearch,
    };

    /* ── Mobile: Drawer ── */
    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onOpenChange}>
                <DrawerContent className="bg-zinc-950/90 backdrop-blur-xl text-white rounded-t-3xl h-[90vh] border-t border-white/10 p-0 overflow-hidden">
                    <DrawerHeader className="sr-only">
                        <DrawerTitle>Cari</DrawerTitle>
                    </DrawerHeader>

                    <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-stone-200" />

                    <Command shouldFilter={false} className="bg-transparent flex flex-col h-full overflow-hidden">
                        <div className="px-4 pt-4 pb-2 shrink-0 [&_svg]:text-zinc-400 [&_svg]:opacity-100 [&_svg]:shrink-0">
                            <CommandInput
                                placeholder="Cari produk..."
                                value={searchValue}
                                onValueChange={(val) => {
                                    setSearchValue(val);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSearchSubmit();
                                    }
                                }}
                                className="h-12 text-base bg-white/5 focus:bg-white/10 rounded-xl border border-white/10 focus:border-white/20 focus:ring-0 placeholder:text-zinc-600 text-white font-semibold w-full transition-all font-plus-jakarta tracking-tight"
                            />
                        </div>
                        <ScrollArea className="flex-1">
                            <SearchMenuContent {...sharedProps} />
                        </ScrollArea>
                    </Command>
                </DrawerContent>
            </Drawer>
        );
    }

    /* ── Desktop: CommandDialog ── */
    return (
        <CommandDialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open && searchValue.trim()) {
                    addSearch(searchValue.trim());
                }
                onOpenChange(open);
            }}
            className="bg-zinc-950/90 backdrop-blur-xl border border-white/10 text-white rounded-2xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)] max-w-lg"
            commandClassName="bg-transparent"
            showCloseButton={false}
            shouldFilter={false}
        >
            {/* Search Input */}
            <div className="px-4 pt-4 pb-3 bg-zinc-950/40 [&_svg]:text-zinc-400 [&_svg]:opacity-100 [&_svg]:shrink-0">
                <CommandInput
                    placeholder="Cari produk"
                    value={searchValue}
                    onValueChange={setSearchValue}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSearchSubmit();
                        }
                    }}
                    className="h-11 text-sm border-none focus:ring-0 placeholder:text-zinc-600 text-white font-semibold bg-white/5 focus:bg-white/7 rounded-xl px-4 w-full transition-all font-plus-jakarta tracking-tight"
                />
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Results */}
            <ScrollArea className="h-[440px]">
                <SearchMenuContent {...sharedProps} />
            </ScrollArea>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/5 bg-zinc-950/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-inter">
                        <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-bold text-zinc-500">ESC</kbd>
                        <span className="text-[10px] text-zinc-600">close</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-inter">
                        <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-bold text-zinc-500">↵</kbd>
                        <span className="text-[10px] text-zinc-600">select</span>
                    </div>
                </div>
                <span className="text-[10px] text-zinc-600 font-bold tracking-[0.3em] uppercase font-plus-jakarta">ÉNOMÉ</span>
            </div>
        </CommandDialog>
    );
}
