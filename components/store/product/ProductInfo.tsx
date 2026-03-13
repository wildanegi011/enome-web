/**
 * ProductInfo Component
 *
 * Panel informasi produk di halaman detail produk.
 * Menampilkan: nama, harga, deskripsi, pemilihan varian/warna/ukuran,
 * flash sale countdown, add-to-cart, wishlist, dan accordion spesifikasi.
 *
 * Logic sudah dipisahkan ke:
 * - lib/product-utils.ts    → kalkulasi stok & matrix
 * - hooks/use-flash-sale-timer.ts → countdown timer
 * - hooks/use-add-to-cart.tsx     → mutasi keranjang (Rich Toast)
 * - AccordionItem.tsx              → komponen accordion reusable
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Ruler, ShieldCheck, ShoppingBag, Plus, Minus, Loader2, Heart, Package, Info, Sparkles, Weight, List } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist, useToggleWishlist } from "@/hooks/use-wishlist";
import { useCartItems } from "@/hooks/use-cart-items";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { useFlashSaleTimer } from "@/hooks/use-flash-sale-timer";
import {
    findMatrixCombination,
    getQtyInCartForVariant,
    getStockForSize,
    getSelectedPrice,
    isColorAvailableForVariant,
} from "@/lib/product-utils";
import type { MatrixEntry, ProductColor } from "@/lib/product-utils";
import { ASSET_URL } from "@/config/config";
import AccordionItem from "./AccordionItem";

interface ProductInfoProps {
    product: {
        id: string;
        name: string;
        price: string;
        originalPrice?: string;
        description: string;
        colors: ProductColor[];
        sizes: string[];
        types: string[]; // <-- Added variant types
        collection: string;
        detail: string | null;
        totalStock: string | null;
        matrix: MatrixEntry[];
        commission?: string;
        hasCommission?: boolean;
        isOnFlashSale?: boolean;
        flashSaleEndTime?: string;
        discountPercentage?: number;
        jenisProduk?: string | null;
        jenisBahan?: string | null;
        isFuring?: number | null;
        berat?: number | null;
    };
    selectedVariant: string;
    setSelectedVariant: (variant: string) => void;
    selectedColor: string;
    setSelectedColor: (color: string) => void;
    activeImage?: string;
}

export default function ProductInfo({ product, selectedVariant, setSelectedVariant, selectedColor, setSelectedColor, activeImage }: ProductInfoProps) {
    // -- Local State --
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [openAccordion, setOpenAccordion] = useState<string | null>("details");
    const [shakeKey, setShakeKey] = useState(0);       // Trigger animasi shake saat validasi gagal
    const [hintType, setHintType] = useState<"motif" | "color" | "size" | null>(null); // Highlight section mana yang perlu diisi

    // -- Auth --
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    // Wishlist
    const { data: wishlistData } = useWishlist();
    const toggleWishlist = useToggleWishlist();
    const isWishlisted = wishlistData?.items?.includes(product.id) ?? false;

    // Cart
    const { cartItems } = useCartItems();
    const { addToCart, isAdding } = useAddToCart();

    // Flash sale timer
    const { timeLeft, formatTime } = useFlashSaleTimer(
        product.isOnFlashSale,
        product.flashSaleEndTime
    );

    const qtyInCartForVariant = getQtyInCartForVariant(
        cartItems, product.id, selectedColor, selectedSize, selectedVariant
    );

    const currentCombination = findMatrixCombination(
        product.matrix, selectedColor, selectedSize, selectedVariant
    );

    const isSoldOut = parseInt(product.totalStock || "0") === 0;
    const rawStock = currentCombination?.stock ?? 0;
    const currentStock = Math.max(0, rawStock - qtyInCartForVariant);

    const isSelectionComplete = (!!selectedVariant || !product.types || product.types.length === 0) && !!selectedColor && !!selectedSize;
    const isOutOfStockCombination = isSelectionComplete && currentStock <= 0;
    const canClickAddToCart = !isAdding; // Disable button saat request sedang berjalan

    const selectedPrice = getSelectedPrice(currentCombination, product.price);

    /** Toggle wishlist — redirect ke login jika belum authenticated */
    const handleWishlist = () => {
        if (!isAuthenticated) {
            router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
            return;
        }
        if (product.id) {
            toggleWishlist.mutate({ produkId: product.id });
        }
    };

    /** Tambah/kurangi quantity dengan validasi batas stok */
    const handleQuantityChange = (type: "increase" | "decrease") => {
        if (type === "decrease" && quantity > 1) {
            setQuantity(q => q - 1);
        } else if (type === "increase" && quantity < currentStock) {
            setQuantity(q => q + 1);
        }
    };

    /** Toggle accordion section */
    const toggleAccordion = (id: string) => {
        setOpenAccordion(prev => prev === id ? null : id);
    };

    /** Tampilkan hint validasi — shake animasi + toast + scroll ke section */
    const triggerHint = (type: "motif" | "color" | "size", message: string, elementId: string) => {
        setHintType(type);
        setShakeKey(prev => prev + 1);
        toast.error(message, { id: `hint-${type}` });
        const el = document.getElementById(elementId);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    /** Handler utama add-to-cart — validasi semua pilihan sebelum submit */
    const handleAddToCart = () => {
        if (!isAuthenticated) {
            router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
            return;
        }
        if (!selectedVariant && product.types && product.types.length > 0) {
            triggerHint("motif", "Silakan pilih Motif terlebih dahulu", "motif-selection");
            return;
        }
        if (!selectedColor) {
            triggerHint("color", "Silakan pilih Warna terlebih dahulu", "color-selection");
            return;
        }
        if (!selectedSize) {
            triggerHint("size", "Silakan pilih Ukuran terlebih dahulu", "size-selection");
            return;
        }
        if (isSoldOut) {
            toast.error("Maaf, produk ini sudah habis terjual secara keseluruhan", { id: "sold-out" });
            return;
        }
        if (isOutOfStockCombination) {
            toast.error("Maaf, stok untuk varian ini sudah habis terjual", { id: "out-of-stock" });
            return;
        }

        const selectedColorData = product.colors.find(c => c.id === selectedColor);
        const imageName = currentCombination?.image || selectedColorData?.image;
        const fullImageUrl = imageName ? `${ASSET_URL}/img/produk/${imageName}` : null;

        setHintType(null);
        addToCart({
            id_produk: product.id,
            color_sylla: selectedColor,
            size_sylla: selectedSize,
            variant: selectedVariant,
            qty_produk: quantity,
            is_flash_sale: product.isOnFlashSale,
            metadata: {
                name: product.name,
                image: activeImage || undefined
            }
        });
    };

    return (
        <div id="product-info-top" className="flex flex-col lg:pl-8 xl:pl-12 font-montserrat min-w-0">
            {/* Header / Badges */}
            <div className="mb-4 md:mb-6">
                <span className="inline-block px-2.5 py-0.5 bg-neutral-base-100 text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-base-500 mb-2 md:mb-3 font-montserrat">
                    {product.collection}
                </span>
                <h1 className="font-montserrat text-[24px] md:text-[32px] lg:text-[36px] font-bold text-neutral-base-900 leading-[1.15] mb-3 md:mb-6 tracking-tight">
                    {product.name}
                </h1>

                <div className="flex flex-col gap-2">
                    {product.originalPrice && (
                        <div className="flex items-center gap-2">
                            <p className="text-[13px] md:text-[15px] text-neutral-base-400 line-through font-medium">
                                {product.originalPrice}
                            </p>
                            {!!product.discountPercentage && product.discountPercentage > 0 && (
                                <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-sm">
                                    Hemat {product.discountPercentage}%
                                </span>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row md:items-baseline gap-3 md:gap-5">
                        <p className={`text-[22px] md:text-[26px] lg:text-[30px] font-semibold tracking-tight leading-none ${product.originalPrice ? 'text-red-600' : 'text-neutral-base-900'}`}>
                            {selectedPrice}
                        </p>
                    </div>
                </div>

                {/* Flash Sale Banner */}
                {product.isOnFlashSale && timeLeft && (
                    <div className="mt-4 md:mt-6 bg-neutral-base-900 rounded-xl overflow-hidden relative shadow-lg">
                        <div className="absolute inset-0 bg-red-900/20"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-linear-to-l from-red-600/10 to-transparent"></div>
                        <div className="relative px-4 py-3 md:px-5 md:py-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-white/90 text-[10px] md:text-[11px] uppercase tracking-widest font-bold mb-0.5 flex items-center gap-1.5">
                                    Penawaran Terbatas
                                </span>
                                <span className="text-white text-[12px] md:text-[14px] font-medium leading-tight">Flash Sale Sedang Berlangsung</span>
                            </div>

                            <div className="flex flex-col items-end">
                                <span className="text-amber-300 text-[9px] md:text-[10px] uppercase tracking-widest font-bold mb-1.5">Berakhir Dalam</span>
                                <div className="flex items-center gap-1 font-mono font-bold text-white text-[12px] md:text-[14px]">
                                    {timeLeft.days > 0 && (
                                        <>
                                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-1.5 py-0.5 md:py-1 rounded text-center min-w-[28px] shadow-inner">
                                                {timeLeft.days}
                                                <span className="text-[9px] ml-0.5 font-montserrat uppercase">Hr</span>
                                            </div>
                                            <span className="text-white/60">:</span>
                                        </>
                                    )}
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 w-8 md:w-9 py-0.5 md:py-1 rounded text-center shadow-inner">{formatTime(timeLeft.hours)}</div>
                                    <span className="text-white/60">:</span>
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 w-8 md:w-9 py-0.5 md:py-1 rounded text-center shadow-inner">{formatTime(timeLeft.minutes)}</div>
                                    <span className="text-white/60">:</span>
                                    <div className="bg-red-600 backdrop-blur-md border border-red-500 w-8 md:w-9 py-0.5 md:py-1 rounded relative overflow-hidden h-[24px] md:h-[28px] flex items-center justify-center shadow-md">
                                        <AnimatePresence mode="popLayout">
                                            <motion.span
                                                key={timeLeft.seconds}
                                                initial={{ y: 15, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -15, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute"
                                            >
                                                {formatTime(timeLeft.seconds)}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="mb-8 md:mb-10 min-w-0">
                <div
                    dangerouslySetInnerHTML={{ __html: product.description }}
                    className="text-[14px] md:text-[15px] leading-[1.75] text-neutral-base-500 prose prose-sm max-w-none line-clamp-4 overflow-hidden wrap-break-word font-montserrat"
                />
            </div>

            {/* Variant Selection */}
            {product.types && product.types.length > 0 && (
                <div id="motif-selection" className="mb-8 md:mb-10">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <span className={`text-[12px] font-bold uppercase tracking-[0.12em] transition-colors ${hintType === 'motif' ? 'text-red-500' : 'text-neutral-base-900'}`}>
                            Motif: <span className="font-medium text-neutral-base-500 ml-1 normal-case tracking-normal">{selectedVariant || "Pilih motif"}</span>
                        </span>
                    </div>
                    <motion.div
                        key={`motif-${shakeKey}`}
                        animate={hintType === 'motif' ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className="flex flex-wrap gap-2 md:gap-3"
                    >
                        {product.types.map(type => {
                            const isSelected = selectedVariant === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setSelectedVariant(type);
                                        setHintType(null);

                                        // Auto-select first available color for this motif
                                        const firstEntry = product.matrix.find(m =>
                                            (m.variant === type || (m.variant || "").includes(type)) && m.stock > 0
                                        );

                                        if (firstEntry) {
                                            setSelectedColor(firstEntry.color);
                                        } else {
                                            setSelectedColor("");
                                        }

                                        setSelectedSize("");
                                        setQuantity(1);
                                    }}
                                    className={`px-5 py-2.5 md:px-5 md:py-2.5 text-[12px] md:text-[13px] font-bold rounded-lg transition-all ${isSelected
                                        ? "bg-neutral-base-900 text-white shadow-lg"
                                        : "border border-neutral-base-200 text-neutral-base-600 hover:border-neutral-base-900 bg-white"
                                        }`}
                                >
                                    {type}
                                </button>
                            );
                        })}

                    </motion.div>
                </div>
            )}

            {/* Color Selection */}
            <div id="color-selection" className="mb-8 md:mb-10">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <span className={`text-[12px] font-bold uppercase tracking-[0.12em] transition-colors ${hintType === 'color' ? 'text-red-500' : 'text-neutral-base-900'}`}>
                        Warna: <span className="font-medium text-neutral-base-500 ml-1 normal-case tracking-normal">{product.colors.find(c => c.id === selectedColor)?.name || "Pilih warna"}</span>
                    </span>
                </div>
                <motion.div
                    key={`color-${shakeKey}`}
                    animate={hintType === 'color' ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="flex flex-wrap gap-3 md:gap-4"
                >
                    {product.colors.map(color => {
                        const hasGeneralStock = color.totalStock > 0;
                        let hasStockForSelectedVariant = true;

                        if (selectedVariant) {
                            hasStockForSelectedVariant = isColorAvailableForVariant(
                                product.matrix, color.id, selectedVariant
                            );
                        }

                        const isOutOfStock = !hasGeneralStock || (!!selectedVariant && !hasStockForSelectedVariant);
                        const needsMotifFirst = product.types && product.types.length > 0 && !selectedVariant;

                        return (
                            <button
                                key={color.id}
                                onClick={() => {
                                    if (needsMotifFirst) {
                                        triggerHint("motif", "Silakan pilih Motif terlebih dahulu", "motif-selection");
                                        return;
                                    }
                                    setSelectedColor(color.id);
                                    setSelectedSize("");
                                    setQuantity(1);
                                    setHintType(null);
                                }}
                                disabled={isOutOfStock}
                                className={`relative flex flex-col items-center gap-1 group transition-opacity ${isOutOfStock ? "opacity-40 cursor-not-allowed" : "opacity-100"}`}
                                aria-label={`Select ${color.name} ${isOutOfStock ? "(Sold Out)" : ""}`}
                            >
                                <span
                                    className={`w-8 h-8 rounded-full border border-neutral-base-200 transition-all flex items-center justify-center ${selectedColor === color.id ? "ring-2 ring-offset-2 ring-neutral-base-900 scale-110 shadow-md" : "hover:scale-110 shadow-sm"
                                        }`}
                                    style={{ backgroundColor: color.value }}
                                >
                                    {selectedColor === color.id && <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />}
                                    {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-px bg-red-500 rotate-45"></div></div>}
                                </span>
                                {isOutOfStock && (
                                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Habis</span>
                                )}
                            </button>
                        );
                    })}
                </motion.div>
            </div>

            {/* Size Selection with Inline Stock */}
            <div id="size-selection" className="mb-8 md:mb-10">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <span className={`text-[12px] font-bold uppercase tracking-[0.12em] transition-colors ${hintType === 'size' ? 'text-red-500' : 'text-neutral-base-900'}`}>
                        Ukuran: <span className="font-medium text-neutral-base-500 ml-1 normal-case tracking-normal">{selectedSize || "Pilih ukuran"}</span>
                    </span>
                    <button className="text-[11px] font-bold text-neutral-base-400 hover:text-neutral-base-900 underline flex items-center gap-1 transition-colors">
                        <Ruler className="w-3 h-3" />
                        Panduan ukuran
                    </button>
                </div>
                <motion.div
                    key={`size-${shakeKey}`}
                    animate={hintType === 'size' ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="flex flex-wrap gap-2 md:gap-3"
                >
                    {product.sizes.map(size => {
                        const isSelected = selectedSize === size;
                        const stock = getStockForSize(
                            product.matrix, cartItems, product.id,
                            selectedColor, size, selectedVariant
                        );
                        const isAvailable = stock > 0;
                        const isLowStock = stock > 0 && stock <= 5;

                        return (
                            <button
                                key={size}
                                onClick={() => {
                                    if (!selectedColor) {
                                        triggerHint("color", "Silakan pilih Warna terlebih dahulu", "color-selection");
                                        return;
                                    }
                                    setSelectedSize(size);
                                    setQuantity(1);
                                    setHintType(null);
                                }}
                                className={`group relative px-4 py-2.5 md:px-5 md:py-2.5 flex items-center justify-center text-[12px] md:text-[13px] font-bold rounded-lg transition-all ${isSelected
                                    ? "bg-neutral-base-900 text-white shadow-lg ring-1 ring-neutral-base-900"
                                    : "border border-neutral-base-200 text-neutral-base-600 hover:border-neutral-base-900 hover:text-neutral-base-900 bg-white"
                                    } ${(!isAvailable && !!selectedColor) ? "opacity-30 line-through cursor-not-allowed" : "opacity-100"}`}
                                disabled={!isAvailable && !!selectedColor}
                            >
                                {size}
                                {isLowStock && !isSelected && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </motion.div>

                {/* Elegant Stock Status Bar */}
                <AnimatePresence mode="wait">
                    {selectedSize && (
                        <motion.div
                            key={`${selectedColor}-${selectedSize}`}
                            initial={{ opacity: 0, y: -8, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -8, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="overflow-hidden"
                        >
                            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold ${currentStock >= 10
                                ? "bg-emerald-50 text-emerald-700"
                                : currentStock > 0
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-600"
                                }`}>
                                <Package className="w-3.5 h-3.5" />
                                {currentStock >= 10 && "Stok tersedia"}
                                {currentStock > 0 && currentStock < 10 && `Sisa ${currentStock} — segera dapatkan!`}
                                {currentStock === 0 && rawStock > 0 && `Sudah ada ${qtyInCartForVariant} di keranjang (Maksimal)`}
                                {currentStock === 0 && rawStock === 0 && "Stok habis untuk kombinasi ini"}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >

            {/* Quantity and Actions */}
            <div className="flex flex-row gap-2 md:gap-3 mb-8 md:mb-12">
                {/* Quantity Selector */}
                <div className="flex items-center border border-neutral-base-200 h-11 md:h-12 w-[100px] md:w-[120px] shrink-0 justify-between rounded-lg">
                    <button
                        onClick={() => handleQuantityChange("decrease")}
                        className="w-9 md:w-11 h-full flex items-center justify-center text-neutral-base-400 hover:text-neutral-base-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                    >
                        <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            if (val > currentStock) {
                                setQuantity(currentStock);
                                toast.error(`Stok tidak mencukupi (Maks. ${currentStock})`);
                            } else {
                                setQuantity(Math.max(1, val));
                            }
                        }}
                        className="flex-1 bg-transparent text-center text-[13px] md:text-[14px] font-bold text-neutral-base-900 outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                        onClick={() => handleQuantityChange("increase")}
                        className="w-9 md:w-11 h-full flex items-center justify-center text-neutral-base-400 hover:text-neutral-base-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity >= currentStock}
                        aria-label="Increase quantity"
                    >
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                </div>

                {/* Add to Cart Button */}
                <motion.button
                    id="add-to-cart-button"
                    whileHover={canClickAddToCart ? { scale: 1.02 } : {}}
                    whileTap={canClickAddToCart ? { scale: 0.98 } : {}}
                    disabled={!canClickAddToCart}
                    onClick={handleAddToCart}
                    className={`flex-1 h-11 md:h-12 text-[11px] md:text-[13px] font-bold uppercase tracking-widest md:tracking-[0.15em] shadow-xl flex items-center justify-center gap-2 transition-colors rounded-lg ${!canClickAddToCart
                        ? "bg-neutral-base-200 text-neutral-base-400 cursor-not-allowed shadow-none"
                        : "bg-neutral-base-900 text-white hover:bg-neutral-base-800"
                        }`}
                >
                    {isAdding ? (
                        <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                    ) : (
                        <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    )}
                    {isAdding ? "Menambahkan..." : "Tambah ke Keranjang"}
                </motion.button>

                {/* Wishlist Button */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleWishlist}
                    className={`w-11 h-11 md:w-12 md:h-12 shrink-0 flex items-center justify-center rounded-lg border transition-all duration-200 ${isWishlisted
                        ? "bg-rose-50 border-rose-200 text-rose-500"
                        : "border-neutral-base-200 text-neutral-base-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50"
                        }`}
                    aria-label={isWishlisted ? "Hapus dari Wishlist" : "Tambah ke Wishlist"}
                >
                    <Heart
                        className={`w-4 h-4 md:w-5 md:h-5 transition-all duration-200 ${isWishlisted ? "fill-rose-500" : ""}`}
                        strokeWidth={2}
                    />
                </motion.button>
            </div>

            {/* Accordions */}
            <div className="border-t border-neutral-base-100">
                <AccordionItem id="shipping" title="Spesifikasi Produk" icon={Info} openAccordion={openAccordion} toggleAccordion={toggleAccordion}>
                    <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-neutral-base-400">
                                <Package className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Kategori</span>
                            </div>
                            <span className="text-[13px] text-neutral-base-900 font-medium pl-[22px]">{product.collection || "-"}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-neutral-base-400">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Material</span>
                            </div>
                            <span className="text-[13px] text-neutral-base-900 font-medium pl-[22px]">{product.jenisBahan || "-"}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-neutral-base-400">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Lining / Furing</span>
                            </div>
                            <div className="pl-[22px] flex items-center gap-2">
                                <span className="text-[13px] text-neutral-base-900 font-medium">
                                    {product.isFuring ? "Full Furing" : "Tanpa Furing"}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-neutral-base-400">
                                <Weight className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Berat</span>
                            </div>
                            <span className="text-[13px] text-neutral-base-900 font-medium pl-[22px]">{product.berat ? `${product.berat}g` : "-"}</span>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem id="details" title="Detail Produk" icon={List} openAccordion={openAccordion} toggleAccordion={toggleAccordion}>
                    <div className="relative">
                        <div
                            dangerouslySetInnerHTML={{ __html: product.detail || product.description }}
                            className="prose prose-sm font-montserrat text-neutral-base-500 max-w-none leading-relaxed prose-p:mb-4 prose-li:mb-2"
                        />
                    </div>
                </AccordionItem>
            </div>
        </div >
    );
}
