/**
 * AccordionItem Component
 *
 * Komponen accordion reusable untuk menampilkan section yang bisa
 * dibuka/tutup dengan animasi. Digunakan di halaman product detail
 * untuk "Spesifikasi Produk" dan "Detail Produk".
 *
 * @example
 * <AccordionItem
 *   id="details"
 *   title="Detail Produk"
 *   icon={List}
 *   openAccordion={openId}
 *   toggleAccordion={setOpenId}
 * >
 *   <p>Konten detail...</p>
 * </AccordionItem>
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
    /** ID unik untuk identifikasi section mana yang terbuka */
    id: string;
    /** Judul yang tampil di header accordion */
    title: string;
    /** Icon opsional di sebelah kiri judul */
    icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    /** Konten yang ditampilkan saat accordion terbuka */
    children: React.ReactNode;
    /** ID accordion yang sedang terbuka (null = semua tertutup) */
    openAccordion: string | null;
    /** Callback untuk toggle buka/tutup */
    toggleAccordion: (id: string) => void;
}

export default function AccordionItem({
    id,
    title,
    icon: Icon,
    children,
    openAccordion,
    toggleAccordion,
}: AccordionItemProps) {
    const isOpen = openAccordion === id;

    return (
        <div className="border-b border-neutral-base-100 py-4">
            {/* Header — klik untuk toggle */}
            <button
                onClick={() => toggleAccordion(id)}
                className="w-full flex items-center justify-between text-left group"
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <Icon className="w-4 h-4 text-neutral-base-400 group-hover:text-neutral-base-900 transition-colors" />
                    )}
                    <span className="text-[12px] md:text-[13px] font-bold uppercase tracking-widest text-neutral-base-900 group-hover:text-amber-800 transition-colors">
                        {title}
                    </span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="w-4 h-4 text-neutral-base-400" />
                </motion.div>
            </button>

            {/* Konten — animasi slide in/out */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 pb-2 text-[14px] text-neutral-base-500 leading-relaxed font-montserrat">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
