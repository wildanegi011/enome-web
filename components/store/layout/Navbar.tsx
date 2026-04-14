"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, User, Settings, LogOut, Package, Wallet, ChevronDown, Menu, X, MapPin, Heart, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useLogo } from "@/hooks/use-logo";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const AuthModal = dynamic(() => import("@/components/store/auth/AuthModal"), { ssr: false });
const SearchModal = dynamic(() => import("@/components/store/shared/SearchModal"), { ssr: false });
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import router from "next/router";
import FallbackImage from "@/components/store/shared/FallbackImage";

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [authModal, setAuthModal] = useState<{ open: boolean; tab: "login" | "register" }>({ open: false, tab: "login" });
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    const { count: cartCount } = useCart();
    const { data: wishlistData } = useWishlist();
    const wishlistCount = wishlistData?.items?.length || 0;
    const { data: logoUrl } = useLogo();

    useEffect(() => {
        const handleOpenAuth = (e: any) => {
            setAuthModal({ open: true, tab: e.detail?.tab || "login" });
        };
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsSearchOpen((open) => !open);
            }
        };
        window.addEventListener("open-auth-modal", handleOpenAuth);
        document.addEventListener("keydown", down);
        return () => {
            window.removeEventListener("open-auth-modal", handleOpenAuth);
            document.removeEventListener("keydown", down);
        };
    }, []);

    const navLinks = [
        { name: "Beranda", path: "/" },
        { name: "Produk", path: "/products" },
    ];

    return (
        <m.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-neutral-base-50/50"
        >
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                <div className="flex items-center justify-between h-[80px]">
                    <Link href="/" className="relative flex items-center h-full">
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 landscape:w-10 landscape:h-10 landscape:sm:w-12 landscape:sm:h-12 landscape:md:w-14 landscape:md:h-14 landscape:lg:w-18 landscape:lg:h-18 transition-all duration-500 hover:scale-105 active:scale-95 group">
                            <FallbackImage
                                src={logoUrl || "/logo-enome.png"}
                                alt="Logo Enome"
                                fill
                                className="object-contain"
                                quality={100}
                            />
                        </div>
                    </Link>

                    {/* Right - Navigation + Actions */}
                    <div className="hidden md:flex items-center gap-8">
                        {/* Nav Links */}
                        <nav className="flex items-center gap-10">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.path;
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.path}
                                        className={cn(
                                            "text-[12px] font-bold tracking-[0.15em] uppercase transition-all duration-300 relative font-montserrat",
                                            isActive ? "text-neutral-base-900" : "text-neutral-base-500 hover:text-amber-800"
                                        )}
                                    >
                                        {link.name}
                                        {isActive && (
                                            <m.div
                                                layoutId="activeNav"
                                                className="absolute -bottom-2 left-0 right-0 h-[2px] bg-neutral-base-900"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Separator */}
                        <div className="w-px h-5 bg-gray-200" />

                        {/* Search Action */}
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="text-neutral-base-500 hover:text-neutral-base-900 transition-colors p-1 relative"
                                aria-label="Search"
                            >
                                <Search className="w-[18px] h-[18px]" strokeWidth={1.2} />
                            </button>
                        </div>

                        {/* Wishlist Action */}
                        <div className="flex items-center">
                            <Link
                                href="/account/wishlist"
                                className="text-neutral-base-500 hover:text-neutral-base-900 transition-colors p-1 relative"
                                aria-label="Wishlist"
                            >
                                <Heart className="w-[18px] h-[18px]" strokeWidth={1.2} />
                                <AnimatePresence>
                                    {wishlistCount > 0 && (
                                        <m.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                                        >
                                            {wishlistCount}
                                        </m.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        </div>

                        {/* Separator */}
                        {/* <div className="w-px h-5 bg-gray-200" /> */}

                        {/* Cart Action */}
                        <div className="flex items-center gap-5">
                            <Link
                                href="/cart"
                                className="text-neutral-base-500 hover:text-neutral-base-900 transition-colors p-1 relative"
                                aria-label="Cart"
                            >
                                <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={1.2} />
                                <AnimatePresence>
                                    {cartCount > 0 && (
                                        <m.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                                        >
                                            {cartCount}
                                        </m.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        </div>

                        {/* Separator */}
                        <div className="w-px h-5 bg-gray-200" />

                        {/* Account Action */}
                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 group outline-none">
                                            <div className="w-9 h-9 rounded-full bg-neutral-base-100 flex items-center justify-center border-2 border-white shadow-sm group-hover:bg-neutral-base-200 transition-all overflow-hidden">
                                                <User className="w-5 h-5 text-neutral-base-600" />
                                            </div>
                                            <div className="text-left hidden lg:block font-montserrat">
                                                <p className="text-[13px] font-bold text-neutral-base-900 leading-none truncate max-w-[100px] mb-1">{user?.name}</p>
                                                <p className="text-[10px] text-neutral-base-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                    Akun <ChevronDown className="w-2.5 h-2.5" />
                                                </p>
                                            </div>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[240px] mt-4 p-2 rounded-[24px] shadow-2xl border-neutral-base-100/60 bg-white/95 backdrop-blur-xl">
                                        <div className="px-4 py-4 mb-2 bg-neutral-base-50 rounded-[20px]">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-base-400 mb-1">Masuk sebagai</p>
                                            <p className="text-[14px] font-bold text-neutral-base-900 truncate">{user?.email}</p>
                                        </div>

                                        <DropdownMenuItem asChild>
                                            <Link href="/account/profile" className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-neutral-base-50">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                    <Settings className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <span className="text-[13px] font-bold">Kelola akun</span>
                                            </Link>
                                        </DropdownMenuItem>

                                        {/* <Link href="/account/addresses">
                                            <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-emerald-50/50">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                    <MapPin className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <span className="text-[13px] font-bold">Daftar Alamat</span>
                                            </DropdownMenuItem>
                                        </Link> */}

                                        {/* <Link href="/account/orders">
                                            <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-amber-50/50">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                                    <Package className="w-4 h-4 text-amber-800" />
                                                </div>
                                                <span className="text-[13px] font-bold">Riwayat Pesanan</span>
                                            </DropdownMenuItem>
                                        </Link> */}

                                        <DropdownMenuSeparator className="my-2 bg-neutral-base-100/60" />

                                        <DropdownMenuItem
                                            onClick={() => logout()}
                                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                                <LogOut className="w-4 h-4 text-red-600" />
                                            </div>
                                            <span className="text-[13px] font-bold">Keluar Akun</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <>
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="text-[12px] font-bold tracking-[0.1em] text-neutral-base-500 hover:text-neutral-base-900 transition-colors font-montserrat"
                                    >
                                        MASUK
                                    </button>
                                    <span className="text-neutral-base-200 text-xs">/</span>
                                    <button
                                        onClick={() => router.push("/register")}
                                        className="text-[13px] font-bold bg-neutral-base-900 text-white px-6 py-2.5 hover:bg-neutral-base-800 transition-all tracking-widest uppercase shadow-lg shadow-neutral-base-900/10 font-montserrat"
                                    >
                                        DAFTAR
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile section */}
                    <div className="flex md:hidden items-center gap-4">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-1 hover:text-neutral-base-900 transition-colors"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                        <Link href="/account/wishlist" className="p-1 hover:text-neutral-base-900 transition-colors relative">
                            <Heart className="w-5 h-5" strokeWidth={1.5} />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white shadow-sm px-1">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>
                        <Link href="/cart" className="p-1 hover:text-neutral-base-900 transition-colors relative">
                            <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white shadow-sm px-1">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <button
                            className="p-1 hover:text-neutral-base-900 transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {mobileOpen && (
                    <m.nav
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="md:hidden overflow-hidden border-t border-gray-100 bg-white"
                    >
                        <div className="px-8 py-6 flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.path}
                                    className={cn(
                                        "text-[12px] font-bold uppercase tracking-[0.15em] py-3 px-5 rounded-xl transition-all font-montserrat",
                                        pathname === link.path ? "text-neutral-base-900 bg-neutral-base-50" : "text-neutral-base-400"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="h-px bg-neutral-base-100/60 my-2" />
                            {isAuthenticated ? (
                                <div className="space-y-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-neutral-base-100 flex items-center justify-center">
                                            <User className="w-5 h-5 text-neutral-base-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-neutral-base-900">{user?.name}</p>
                                            <p className="text-[10px] text-neutral-base-400 font-bold uppercase tracking-widest">{user?.email}</p>
                                        </div>
                                    </div>
                                    <Link href="/account/orders" className="flex items-center gap-3 text-[12px] font-black uppercase tracking-widest text-neutral-base-900">
                                        <Package className="w-4 h-4 text-amber-800" /> Kelola akun
                                    </Link>
                                    <button
                                        onClick={() => logout()}
                                        className="text-[12px] font-black uppercase tracking-widest text-red-600"
                                    >
                                        Keluar Akun
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => { setMobileOpen(false); router.push("/login"); }}
                                        className="text-[12px] font-bold uppercase tracking-[0.1em] text-neutral-base-900 py-4 border border-neutral-base-200 rounded-xl font-montserrat"
                                    >
                                        Masuk
                                    </button>
                                    <button
                                        onClick={() => { setMobileOpen(false); router.push("/register"); }}
                                        className="text-[12px] font-bold uppercase tracking-[0.1em] text-white py-4 bg-neutral-base-900 rounded-xl shadow-lg shadow-neutral-base-900/10 font-montserrat"
                                    >
                                        Daftar
                                    </button>
                                </div>
                            )}
                        </div>
                    </m.nav>
                )}
            </AnimatePresence>

            <AuthModal
                isOpen={authModal.open}
                onClose={() => setAuthModal({ ...authModal, open: false })}
                defaultTab={authModal.tab}
            />
            <SearchModal
                isOpen={isSearchOpen}
                onOpenChange={setIsSearchOpen}
                router={router}
            />
        </m.header>
    );
}
