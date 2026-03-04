import { motion } from "framer-motion";

interface Collection {
    id: string;
    title: string;
}

interface CollectionDotsProps {
    currentIndex: number;
    collections: Collection[];
    setDirection: (direction: number) => void;
    setCurrentIndex: (index: number) => void;
}

export default function CollectionDots({ currentIndex, collections, setDirection, setCurrentIndex }: CollectionDotsProps) {
    return (
        <div className="absolute top-1/2 -translate-y-1/2 right-5 md:right-10 z-50 flex flex-col gap-3">
            {collections.map((collection, idx) => (
                <div key={collection.id || idx} className="group relative flex items-center justify-end">
                    {/* Tooltip */}
                    <motion.span
                        initial={{ opacity: 0, x: 8 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        className="absolute right-6 text-[9px] font-medium uppercase tracking-[0.25em] text-white/30 whitespace-nowrap pointer-events-none"
                    >
                        {collection.title}
                    </motion.span>

                    <button
                        onClick={() => {
                            setDirection(idx > currentIndex ? 1 : -1);
                            setCurrentIndex(idx);
                        }}
                        className="relative p-1.5 cursor-pointer"
                    >
                        <motion.div
                            animate={{
                                height: currentIndex === idx ? 28 : 5,
                                backgroundColor: currentIndex === idx ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.2)",
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-px rounded-full"
                        />
                    </button>
                </div>
            ))}
        </div>
    );
}
