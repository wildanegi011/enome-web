"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Ruler, Truck, ShieldCheck, ShoppingBag, Plus, Minus, Loader2, Heart, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist, useToggleWishlist } from "@/hooks/use-wishlist";

interface ProductInfoProps {
    product: {
        id: string;
        name: string;
        price: string;
        originalPrice?: string;
        description: string;
        colors: { name: string; value: string; image: string | null; totalStock: number }[];
        sizes: string[];
        collection: string;
        detail: string | null;
        totalStock: string | null;
        matrix: { color: string; size: string; stock: number; price: string; image: string | null }[];
        commission?: string;
        hasCommission?: boolean;
    };
}

export default function ProductInfo({ product }: ProductInfoProps) {
    const [selectedColor, setSelectedColor] = useState(product.colors.find(c => c.totalStock > 0)?.name || product.colors[0]?.name || "");
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>("details");
    const { isAuthenticated } = useAuth();

    // Wishlist
    const { data: wishlistData } = useWishlist();
    const toggleWishlist = useToggleWishlist();
    const isWishlisted = wishlistData?.items?.includes(product.id) ?? false;

    const handleWishlist = () => {
        if (product.id) {
            toggleWishlist.mutate(product.id);
        }
    };

    // Matrix lookup
    const currentCombination = product.matrix.find(
        m => m.color === selectedColor && m.size === selectedSize
    );

    const isSoldOut = parseInt(product.totalStock || "0") === 0;
    const currentStock = currentCombination?.stock ?? 0;

    // Get stock for a specific size (given current color)
    const getStockForSize = (size: string) => {
        const variant = product.matrix.find(m => m.color === selectedColor && m.size === size);
        return variant?.stock ?? 0;
    };

    // Dynamic price based on selection
    const selectedPrice = currentCombination
        ? `Rp ${parseInt(currentCombination.price).toLocaleString('id-ID')}`
        : product.price;

    const handleQuantityChange = (type: "increase" | "decrease") => {
        if (type === "decrease" && quantity > 1) {
            setQuantity(q => q - 1);
        } else if (type === "increase" && quantity < currentStock) {
            setQuantity(q => q + 1);
        }
    };

    const toggleAccordion = (id: string) => {
        setOpenAccordion(prev => prev === id ? null : id);
    };

    const handleAddToCart = async () => {
        if (!selectedSize || !selectedColor) {
            toast.error("Silakan pilih ukuran dan warna terlebih dahulu");
            return;
        }

        setIsAdding(true);
        try {
            const response = await fetch("/api/cart/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_produk: product.id,
                    color_sylla: selectedColor,
                    size_sylla: selectedSize,
                    qty_produk: quantity,
                }),
            });

            const data = await response.json();

            if (data.message === "login") {
                toast.error("Silakan login terlebih dahulu untuk menambah ke keranjang");
                window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { tab: "login" } }));
            } else if (data.message === "success") {
                toast.success("Barang berhasil ditambahkan ke keranjang", {
                    icon: <Check className="w-4 h-4 text-emerald-500" />
                });
                window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: data.totalinlove } }));
            } else {
                toast.error(data.detail || data.pesan || "Terjadi kesalahan saat menambah ke keranjang");
            }
        } catch (error) {
            toast.error("Gagal terhubung ke server");
        } finally {
            setIsAdding(false);
        }
    };

    const AccordionItem = ({ id, title, icon: Icon, children }: { id: string, title: string, icon?: any, children: React.ReactNode }) => (
        <div className="border-b border-neutral-base-100 py-4">
            <button
                onClick={() => toggleAccordion(id)}
                className="w-full flex items-center justify-between text-left group"
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-4 h-4 text-neutral-base-400 group-hover:text-neutral-base-900 transition-colors" />}
                    <span className="text-[12px] md:text-[14px] font-bold uppercase tracking-widest text-neutral-base-900 group-hover:text-amber-800 transition-colors">
                        {title}
                    </span>
                </div>
                <motion.div
                    animate={{ rotate: openAccordion === id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="w-4 h-4 text-neutral-base-400" />
                </motion.div>
            </button>
            <AnimatePresence>
                {openAccordion === id && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 pb-2 text-[14px] text-neutral-base-500 leading-relaxed font-sans">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="flex flex-col lg:pl-8 xl:pl-12 font-sans min-w-0">
            {/* Header / Badges */}
            <div className="mb-4 md:mb-6">
                <span className="inline-block px-3 py-1 bg-neutral-base-100 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-base-500 mb-3 md:mb-4 font-sans">
                    {product.collection}
                </span>
                <h1 className="font-serif text-[24px] md:text-[36px] lg:text-[48px] text-neutral-base-900 leading-[1.2] mb-3 md:mb-6">
                    {product.name}
                </h1>

                <div className="flex flex-col gap-2">
                    {product.originalPrice && (
                        <p className="text-[14px] md:text-[16px] text-neutral-base-300 line-through font-medium">
                            {product.originalPrice}
                        </p>
                    )}
                    <p className="text-[20px] md:text-[28px] lg:text-[36px] font-black tracking-tighter text-neutral-base-900 leading-tight">
                        {selectedPrice}
                    </p>
                </div>
            </div>

            {/* Description */}
            <div className="mb-8 md:mb-10 min-w-0">
                <div
                    dangerouslySetInnerHTML={{ __html: product.description }}
                    className="text-[14px] md:text-[15px] leading-[1.8] text-neutral-base-500 italic prose prose-sm max-w-none line-clamp-3 overflow-hidden wrap-break-word"
                />
            </div>

            {/* Color Selection */}
            <div className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-base-900">
                        Warna: <span className="font-medium text-neutral-base-500 ml-1 normal-case">{selectedColor}</span>
                    </span>
                </div>
                <div className="flex flex-wrap gap-3 md:gap-4">
                    {product.colors.map(color => {
                        const isColorAvailable = color.totalStock > 0;
                        return (
                            <button
                                key={color.name}
                                onClick={() => {
                                    setSelectedColor(color.name);
                                    setSelectedSize(""); // reset size when color changes
                                    setQuantity(1);
                                }}
                                className={`relative flex flex-col items-center gap-2 group transition-opacity ${!isColorAvailable ? "opacity-30" : "opacity-100"}`}
                                aria-label={`Select ${color.name} ${!isColorAvailable ? "(Sold Out)" : ""}`}
                            >
                                <span
                                    className={`w-8 h-8 rounded-full border border-neutral-base-200 transition-all flex items-center justify-center ${selectedColor === color.name ? "ring-2 ring-offset-2 ring-neutral-base-900 scale-110 shadow-md" : "hover:scale-110 shadow-sm"
                                        }`}
                                    style={{ backgroundColor: color.value }}
                                >
                                    {selectedColor === color.name && <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />}
                                    {!isColorAvailable && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-px h-full bg-white rotate-45" />
                                        </div>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Size Selection with Inline Stock */}
            <div className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-base-900">
                        Ukuran: <span className="font-medium text-neutral-base-500 ml-1 normal-case">{selectedSize || "Pilih ukuran"}</span>
                    </span>
                    <button className="text-[11px] font-bold text-neutral-base-400 hover:text-neutral-base-900 underline flex items-center gap-1 transition-colors">
                        <Ruler className="w-3 h-3" />
                        Size Guide
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3">
                    {product.sizes.map(size => {
                        const isSelected = selectedSize === size;
                        const stock = getStockForSize(size);
                        const isAvailable = stock > 0;
                        const isLowStock = stock > 0 && stock <= 5;

                        return (
                            <button
                                key={size}
                                onClick={() => {
                                    setSelectedSize(size);
                                    setQuantity(1);
                                }}
                                className={`group relative px-4 py-2.5 md:px-5 md:py-3 flex items-center justify-center text-[11px] md:text-[13px] font-bold rounded-lg transition-all ${isSelected
                                    ? "bg-neutral-base-900 text-white shadow-lg ring-1 ring-neutral-base-900"
                                    : "border border-neutral-base-200 text-neutral-base-600 hover:border-neutral-base-900 hover:text-neutral-base-900 bg-white"
                                    } ${!isAvailable ? "opacity-30 line-through cursor-not-allowed" : "opacity-100"}`}
                                disabled={!isAvailable}
                            >
                                {size}
                                {/* Low stock dot indicator */}
                                {isLowStock && !isSelected && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

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
                                {currentStock === 0 && "Stok habis untuk kombinasi ini"}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Quantity and Actions */}
            <div className="flex flex-row gap-2 md:gap-3 mb-8 md:mb-12">
                {/* Quantity Selector */}
                <div className="flex items-center border border-neutral-base-200 h-11 md:h-14 w-[100px] md:w-[130px] shrink-0 justify-between rounded-lg">
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
                    whileHover={!isSoldOut && currentStock > 0 && !isAdding ? { scale: 1.02 } : {}}
                    whileTap={!isSoldOut && currentStock > 0 && !isAdding ? { scale: 0.98 } : {}}
                    disabled={isSoldOut || currentStock === 0 || isAdding || !selectedSize}
                    onClick={handleAddToCart}
                    className={`flex-1 h-11 md:h-14 text-[11px] md:text-[13px] font-bold uppercase tracking-widest md:tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 transition-colors rounded-lg ${(isSoldOut || currentStock === 0 || isAdding || !selectedSize)
                        ? "bg-neutral-base-200 text-neutral-base-400 cursor-not-allowed shadow-none"
                        : "bg-neutral-base-900 text-white hover:bg-neutral-base-800"
                        }`}
                >
                    {isAdding ? (
                        <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                    ) : (
                        <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    )}
                    {!selectedSize ? "Pilih Ukuran" : isSoldOut || currentStock === 0 ? "Stok Habis" : isAdding ? "Adding..." : "Keranjang"}
                </motion.button>

                {/* Wishlist Button */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleWishlist}
                    className={`w-11 h-11 md:w-14 md:h-14 shrink-0 flex items-center justify-center rounded-lg border transition-all duration-200 ${isWishlisted
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
                <AccordionItem id="details" title="Detail Produk">
                    <div
                        dangerouslySetInnerHTML={{ __html: product.detail || product.description }}
                        className="prose prose-sm font-sans text-neutral-base-500 max-w-none overflow-hidden wrap-break-word"
                    />
                </AccordionItem>
                <AccordionItem id="shipping" title="Pengiriman" icon={Truck}>
                    <p className="mb-2">Gratis ongkir untuk pembelian di atas Rp 2.000.000.</p>
                    <p>Pengembalian diterima dalam 14 hari setelah pengiriman. Barang harus dalam kondisi asli dengan label masih terpasang.</p>
                </AccordionItem>
                <AccordionItem id="care" title="Perawatan" icon={ShieldCheck}>
                    <p>Hanya dry clean. Jangan gunakan pemutih. Setrika dengan suhu rendah pada sisi belakang untuk menjaga warna alami.</p>
                </AccordionItem>
            </div>
        </div>
    );
}
