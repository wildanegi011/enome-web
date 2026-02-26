"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronDown, Check, Ruler, Truck, ShieldCheck, ShoppingBag, Plus, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

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

    // Memoize matrix for quick lookup
    const currentCombination = product.matrix.find(
        m => m.color === selectedColor && m.size === selectedSize
    );

    const isSoldOut = parseInt(product.totalStock || "0") === 0;
    const currentStock = currentCombination?.stock ?? 0;

    // Derived stock status message
    let stockStatus = "";
    let stockColorClass = "text-neutral-base-500";

    if (selectedColor && selectedSize) {
        if (currentStock >= 10) {
            stockStatus = "Tersedia";
            stockColorClass = "text-emerald-600";
        } else if (currentStock > 0) {
            stockStatus = `Sisa stok ${currentStock}`;
            stockColorClass = "text-amber-600";
        } else {
            stockStatus = "Stok habis";
            stockColorClass = "text-rose-600";
        }
    }

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
                // Optional: trigger login modal via window event
                window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { tab: "login" } }));
            } else if (data.message === "success") {
                toast.success("Barang berhasil ditambahkan ke keranjang", {
                    icon: <Check className="w-4 h-4 text-emerald-500" />
                });
                // Invalidate cart queries
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
                    <span className="text-[14px] font-bold uppercase tracking-widest text-neutral-base-900 group-hover:text-amber-800 transition-colors">
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
        <div className="flex flex-col lg:pl-8 xl:pl-12 font-sans">
            {/* Header / Badges */}
            <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-neutral-base-100 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-base-500 mb-4 font-sans">
                    {product.collection}
                </span>
                <h1 className="font-serif text-[36px] md:text-[48px] text-neutral-base-900 leading-[1.1] mb-6">
                    {product.name}
                </h1>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col">
                        {product.originalPrice && (
                            <p className="text-[16px] text-neutral-base-300 line-through font-medium mb-1">
                                {product.originalPrice}
                            </p>
                        )}
                        <div className="flex items-center gap-4">
                            <p className="text-[28px] md:text-[36px] font-black tracking-tighter text-neutral-base-900 leading-tight">
                                {product.price}
                            </p>
                        </div>
                    </div>
                    {/* TODO: uncomment if need Potensi Komisi */}
                    {/* {product.hasCommission && product.commission && (
                        <div className="bg-red-50/50 border-l-2 border-red-500 px-4 py-2 w-fit">
                            <p className="text-[13px] text-red-600 font-bold italic tracking-wide">
                                Potensi Komisi Anda: {product.commission}
                            </p>
                        </div>
                    )} */}
                </div>
            </div>

            {/* Description */}
            <div className="mb-10">
                <div
                    dangerouslySetInnerHTML={{ __html: product.description }}
                    className="text-[15px] leading-[1.8] text-neutral-base-500 italic prose prose-sm max-w-none line-clamp-3"
                />
            </div>

            {/* Color Selection */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-base-900">
                        Color: <span className="font-medium text-neutral-base-500 ml-1">{selectedColor}</span>
                    </span>
                </div>
                <div className="flex gap-4">
                    {product.colors.map(color => {
                        const isColorAvailable = color.totalStock > 0;
                        return (
                            <button
                                key={color.name}
                                onClick={() => setSelectedColor(color.name)}
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

            {/* Size Selection */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-base-900">
                        Size: <span className="font-medium text-neutral-base-500 ml-1">{selectedSize}</span>
                    </span>
                    <button className="text-[11px] font-bold text-neutral-base-400 hover:text-neutral-base-900 underline flex items-center gap-1 transition-colors">
                        <Ruler className="w-3 h-3" />
                        Size Guide
                    </button>
                </div>
                <div className="flex flex-wrap gap-3">
                    {product.sizes.map(size => {
                        const isSelected = selectedSize === size;
                        // Check availability for this specific color-size combo
                        const variant = product.matrix.find(m => m.color === selectedColor && m.size === size);
                        const isAvailable = (variant?.stock ?? 0) > 0;

                        return (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`group relative w-14 h-14 flex items-center justify-center text-[13px] font-bold rounded-full transition-all ${isSelected
                                    ? "bg-neutral-base-900 text-white shadow-lg ring-2 ring-offset-2 ring-neutral-base-900"
                                    : "border border-neutral-base-200 text-neutral-base-500 hover:border-neutral-base-900 hover:text-neutral-base-900 bg-white"
                                    } ${!isAvailable ? "opacity-40" : "opacity-100"}`}
                            >
                                {size}
                                {!isAvailable && (
                                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full pointer-events-none">
                                        <div className="w-[120%] h-px bg-neutral-base-300 rotate-45" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                {stockStatus && (
                    <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`mt-4 text-[12px] font-bold uppercase tracking-widest ${stockColorClass}`}
                    >
                        {stockStatus}
                    </motion.p>
                )}
            </div>

            {/* Quantity and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                {/* Quantity Selector */}
                <div className="flex items-center border border-neutral-base-200 h-14 sm:w-[140px] shrink-0">
                    <button
                        onClick={() => handleQuantityChange("decrease")}
                        className="w-12 h-full flex items-center justify-center text-neutral-base-400 hover:text-neutral-base-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                    >
                        <Minus className="w-4 h-4" />
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
                        className="flex-1 bg-transparent text-center text-[14px] font-bold text-neutral-base-900 outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                        onClick={() => handleQuantityChange("increase")}
                        className="w-12 h-full flex items-center justify-center text-neutral-base-400 hover:text-neutral-base-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity >= 10}
                        aria-label="Increase quantity"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Add to Cart Button */}
                <motion.button
                    whileHover={!isSoldOut && currentStock > 0 && !isAdding ? { scale: 1.02 } : {}}
                    whileTap={!isSoldOut && currentStock > 0 && !isAdding ? { scale: 0.98 } : {}}
                    disabled={isSoldOut || currentStock === 0 || isAdding}
                    onClick={handleAddToCart}
                    className={`flex-1 h-14 text-[13px] font-bold uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-colors ${(isSoldOut || currentStock === 0 || isAdding)
                        ? "bg-neutral-base-200 text-neutral-base-400 cursor-not-allowed shadow-none"
                        : "bg-neutral-base-900 text-white hover:bg-neutral-base-800"
                        }`}
                >
                    {isAdding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ShoppingBag className="w-4 h-4" />
                    )}
                    {isSoldOut || currentStock === 0 ? "Sold Out" : isAdding ? "Adding..." : "Add to Cart"}
                </motion.button>
            </div>

            {/* Accordions */}
            <div className="border-t border-neutral-base-100">
                <AccordionItem id="details" title="Product Details">
                    <div
                        dangerouslySetInnerHTML={{ __html: product.detail || product.description }}
                        className="prose prose-sm font-sans text-neutral-base-500 max-w-none"
                    />
                </AccordionItem>
                <AccordionItem id="shipping" title="Shipping & Returns" icon={Truck}>
                    <p className="mb-2">Free standard shipping on orders over Rp 2.000.000.</p>
                    <p>Returns accepted within 14 days of delivery. Items must be in original condition with tags attached.</p>
                </AccordionItem>
                <AccordionItem id="care" title="Care Instructions" icon={ShieldCheck}>
                    <p>Dry clean only. Do not bleach. Iron on low heat on the reverse side to preserve the natural dyes.</p>
                </AccordionItem>
            </div>
        </div>
    );
}
