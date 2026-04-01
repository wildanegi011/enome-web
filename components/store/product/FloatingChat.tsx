import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa6";

interface FloatingChatProps {
    whatsappNomor?: string;
    productName: string;
    selectedVariant?: string;
    selectedColorName?: string;
    selectedSize?: string;
}

export default function FloatingChat({ whatsappNomor, productName, selectedVariant, selectedColorName, selectedSize }: FloatingChatProps) {
    const [currentUrl, setCurrentUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCurrentUrl(window.location.href);
        }
    }, []);

    if (!whatsappNomor) return null;

    const details = [
        selectedVariant ? `- Varian: ${selectedVariant}` : null,
        selectedColorName ? `- Warna: ${selectedColorName}` : null,
        selectedSize ? `- Ukuran: ${selectedSize}` : null,
    ].filter(Boolean).join("\n");

    const message = `Halo Admin Énomé, saya tertarik dengan produk *${productName}*.\n\n` +
        (details ? `Detail Pilihan:\n${details}\n\n` : "") +
        `Link: ${currentUrl}\n\n`;

    const whatsappUrl = `https://wa.me/${whatsappNomor.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

    return (
        <AnimatePresence>
            <m.a
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-40 bg-emerald-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-600 transition-colors duration-300"
                aria-label="Chat WhatsApp"
                style={{ filter: "drop-shadow(0 10px 15px rgba(16, 185, 129, 0.4))" }}
            >
                <FaWhatsapp className="w-5 h-5 md:w-6 md:h-6" />
                <m.div
                    initial={{ width: 0, opacity: 0 }}
                    whileInView={{ width: "auto", opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="overflow-hidden whitespace-nowrap hidden md:block"
                >
                    <span className="ml-2 font-bold text-[14px]">Tanya Produk Ini</span>
                </m.div>
            </m.a>
        </AnimatePresence>
    );
}
