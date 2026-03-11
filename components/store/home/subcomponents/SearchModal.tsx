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
        <CommandEmpty className="py-16 flex flex-col items-center justify-center gap-4 text-zinc-400">
            <div className="size-14 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200/50">
                <Search className="size-6 text-zinc-300" />
            </div>
            <div className="text-center space-y-1">
                <p className="text-zinc-600 text-sm font-semibold">Tidak ada hasil ditemukan</p>
                <p className="text-zinc-400 text-xs">Coba dengan kata kunci lain</p>
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
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 font-montserrat">Recent</span>
                                </div>
                                <button
                                    onClick={onClearRecent}
                                    className="text-[10px] font-medium text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
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
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 data-[selected=true]:bg-zinc-200 text-[13px] font-medium text-zinc-600 hover:text-zinc-900 data-[selected=true]:text-zinc-900 cursor-pointer transition-colors group/item font-montserrat"
                                >
                                    {term}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemoveRecent(term); }}
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
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 font-montserrat">Kategori</span>
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
                                    className="inline-flex items-center px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 data-[selected=true]:bg-zinc-50 text-[13px] font-semibold text-zinc-500 hover:text-zinc-900 data-[selected=true]:text-zinc-900 cursor-pointer transition-colors font-montserrat"
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
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 font-montserrat">
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
                            <div className="flex flex-col min-w-0 gap-0.5">
                                <span className="font-bold text-[16px] text-zinc-900 truncate font-montserrat leading-tight tracking-tight">{product.namaProduk}</span>
                                <span className="text-[12px] text-zinc-500 font-montserrat">{product.kategori}</span>
                            </div>
                            <span className="ml-auto text-[16px] font-medium text-zinc-950 shrink-0 font-montserrat tracking-tight">
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
                <div className="my-3 h-px bg-zinc-100 mx-4" />
                <CommandGroup
                    heading={
                        <div className="flex items-center gap-2 px-4 pt-1 pb-2">
                            <Compass className="size-3 text-zinc-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 font-montserrat">Tautan cepat</span>
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
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 data-[selected=true]:bg-zinc-50 cursor-pointer transition-colors"
                            >
                                <div className="size-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-200 group-data-[selected=true]:bg-zinc-200 transition-colors">
                                    <link.icon className="size-4 text-zinc-500 group-hover:text-zinc-900 group-data-[selected=true]:text-zinc-900" />
                                </div>
                                <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900 group-data-[selected=true]:text-zinc-900">{link.label}</span>
                                <ChevronRight className="ml-auto size-4 text-zinc-300 group-hover:text-zinc-500" />
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
                <DrawerContent className="bg-white text-zinc-900 rounded-t-3xl h-[90vh] border-t border-zinc-100 p-0 overflow-hidden">
                    <DrawerHeader className="sr-only">
                        <DrawerTitle>Cari</DrawerTitle>
                    </DrawerHeader>

                    <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-zinc-100" />

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
                                className="h-12 text-base bg-zinc-50 focus:bg-zinc-100/50 rounded-xl border border-zinc-200 focus:border-zinc-300 focus:ring-0 placeholder:text-zinc-400 text-zinc-900 font-semibold w-full transition-all font-montserrat tracking-tight"
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
            className="bg-white border border-zinc-200 text-zinc-900 rounded-2xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] max-w-lg"
            commandClassName="bg-transparent"
            showCloseButton={false}
            shouldFilter={false}
        >
            {/* Search Input */}
            <div className="px-4 pt-4 pb-3 bg-zinc-50/50 [&_svg]:text-zinc-400 [&_svg]:opacity-100 [&_svg]:shrink-0">
                <CommandInput
                    placeholder="Cari produk"
                    value={searchValue}
                    onValueChange={setSearchValue}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSearchSubmit();
                        }
                    }}
                    className="h-11 text-sm border-none focus:ring-0 placeholder:text-zinc-400 text-zinc-900 font-semibold bg-white focus:bg-zinc-50 rounded-xl px-4 w-full transition-all font-montserrat tracking-tight shadow-sm"
                />
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-100" />

            {/* Results */}
            <ScrollArea className="h-[440px]">
                <SearchMenuContent {...sharedProps} />
            </ScrollArea>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-montserrat">
                        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] font-bold text-zinc-400">ESC</kbd>
                        <span className="text-[10px] text-zinc-400">close</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-montserrat">
                        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] font-bold text-zinc-400">↵</kbd>
                        <span className="text-[10px] text-zinc-400">select</span>
                    </div>
                </div>
                <span className="text-[10px] text-zinc-300 font-bold tracking-[0.3em] uppercase font-montserrat">ÉNOMÉ</span>
            </div>
        </CommandDialog>
    );
}
