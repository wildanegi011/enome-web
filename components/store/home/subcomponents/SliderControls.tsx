import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SliderControlsProps {
    currentIndex: number;
    totalCollections: number;
    paginate: (direction: number) => void;
}

export default function SliderControls({ currentIndex, totalCollections, paginate }: SliderControlsProps) {
    return (
        <div className="absolute inset-y-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-10 pointer-events-none">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => paginate(-1)}
                disabled={currentIndex === 0}
                className={cn(
                    "size-10 md:size-12 flex items-center justify-center rounded-full bg-black/75 backdrop-blur-md text-white border border-white/30 hover:bg-black/95 transition-all pointer-events-auto cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)]",
                    currentIndex === 0 && "opacity-0 pointer-events-none"
                )}
            >
                <ChevronLeft className="size-5 stroke-[1px]" />
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => paginate(1)}
                disabled={currentIndex === totalCollections - 1}
                className={cn(
                    "size-10 md:size-12 flex items-center justify-center rounded-full bg-black/75 backdrop-blur-md text-white border border-white/30 hover:bg-black/95 transition-all pointer-events-auto cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)]",
                    currentIndex === totalCollections - 1 && "opacity-0 pointer-events-none"
                )}
            >
                <ChevronRight className="size-5 stroke-[1px]" />
            </motion.button>
        </div>
    );
}
