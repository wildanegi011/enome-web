
import { motion } from "framer-motion";
import { Search, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavOverlayProps {
    setIsSearchOpen: (open: boolean) => void;
    setAuthModal: (modal: { open: boolean; tab: "login" | "register" }) => void;
}

export default function NavOverlay({ setIsSearchOpen, setAuthModal }: NavOverlayProps) {
    const router = useRouter();

    return (
        <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
            <div className="flex items-center justify-between px-6 py-6 md:px-12 md:py-10">
                {/* Brand Wordmark */}
                <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="pointer-events-auto cursor-pointer font-serif text-[15px] md:text-[17px] font-semibold tracking-[0.3em] text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]"
                    onClick={() => router.push("/")}
                >
                    ÉNOMÉ
                </motion.span>

                {/* Icon Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex items-center gap-3"
                >
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="pointer-events-auto size-10 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all duration-300 cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                    >
                        <Search className="size-[17px] stroke-[1.5px]" />
                    </button>
                    <button
                        onClick={() => router.push("/login")}
                        className="pointer-events-auto size-10 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all duration-300 cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                    >
                        <User className="size-[17px] stroke-[1.5px]" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
