import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ScrollIndicatorsProps {
    verticalIndex: number;
    totalImages: number;
    scrollVertical: (direction: number) => void;
}

export default function ScrollIndicators({ verticalIndex, totalImages, scrollVertical }: ScrollIndicatorsProps) {
    return (
        <div className="absolute inset-x-0 bottom-8 z-50 flex flex-col items-center pointer-events-none">
            <AnimatePresence mode="wait">
                {verticalIndex < totalImages - 1 ? (
                    <motion.button
                        key="down"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        onClick={() => scrollVertical(1)}
                        className="flex flex-col items-center gap-2 pointer-events-auto cursor-pointer p-2"
                    >
                        <span className="text-[10px] font-semibold text-white/70 tracking-[0.3em] uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                            Scroll Down
                        </span>
                        <motion.div
                            animate={{ y: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        >
                            <ChevronDown className="size-5 text-white/70 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
                        </motion.div>
                    </motion.button>
                ) : (
                    <motion.button
                        key="up"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        onClick={() => scrollVertical(-verticalIndex)}
                        className="flex flex-col items-center gap-2 pointer-events-auto cursor-pointer p-2"
                    >
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        >
                            <ChevronUp className="size-5 text-white/70 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
                        </motion.div>
                        <span className="text-[10px] font-semibold text-white/70 tracking-[0.3em] uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                            Back to Top
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
