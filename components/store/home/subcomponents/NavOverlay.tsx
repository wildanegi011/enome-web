
import { motion } from "framer-motion";
import { Search, User, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";

interface NavOverlayProps {
    setIsSearchOpen: (open: boolean) => void;
}

export default function NavOverlay({ setIsSearchOpen }: NavOverlayProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { count } = useCart();

    return (
        <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
            <div className="flex items-center justify-between px-6 py-6 md:px-12 md:py-10">

                {/* Icon Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex items-center gap-3"
                >
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="pointer-events-auto size-10 rounded-full bg-black/75 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-black/95 hover:border-white/60 transition-all duration-300 cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                    >
                        <Search className="size-[17px] stroke-[1.5px]" />
                    </button>
                    <button
                        onClick={() => router.push(isAuthenticated ? "/account/profile" : "/login")}
                        className="pointer-events-auto size-10 rounded-full bg-black/75 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-black/95 hover:border-white/60 transition-all duration-300 cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                    >
                        <User className="size-[17px] stroke-[1.5px]" />
                    </button>
                    <button
                        onClick={() => router.push("/cart")}
                        className="relative pointer-events-auto size-10 rounded-full bg-black/75 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-black/95 hover:border-white/60 transition-all duration-300 cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                    >
                        <ShoppingCart className="size-[17px] stroke-[1.5px]" />
                        {count > 0 && (
                            <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black/10">
                                {count}
                            </span>
                        )}
                    </button>

                </motion.div>

                <div></div>

            </div>
        </div>
    );
}
