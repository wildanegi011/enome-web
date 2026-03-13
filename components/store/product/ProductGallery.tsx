"use client";

import FallbackImage from "@/components/store/shared/FallbackImage";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface ProductGalleryProps {
    images: string[];
    isSoldOut?: boolean;
    isOnFlashSale?: boolean;
}

export default function ProductGallery({ images, isSoldOut, isOnFlashSale }: ProductGalleryProps) {
    return (
        <div className="flex flex-col gap-4 md:gap-8 w-full min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {images.map((img, idx) => {
                    const isFeatureImage = idx === 0;

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className={`relative bg-neutral-base-50 overflow-hidden min-w-0 rounded-3xl group shadow-sm transition-all duration-700 ${isFeatureImage ? "md:col-span-2 aspect-3/4" : "col-span-1 aspect-3/4"
                                }`}
                        >
                            <div className="absolute inset-0">
                                <FallbackImage
                                    src={img}
                                    alt={`Product image ${idx + 1}`}
                                    fill
                                    quality={90}
                                    unoptimized={true}
                                    className="object-cover object-center"
                                    sizes={isFeatureImage ? "(max-width: 1024px) 100vw, 80vw" : "(max-width: 1024px) 50vw, 40vw"}
                                    priority={idx === 0}
                                />
                            </div>

                            {/* Badges and Overlays for primary image */}
                            {idx === 0 && (
                                <>
                                    <div className="absolute top-6 left-6 z-20 flex flex-col gap-3">
                                        {isOnFlashSale && (
                                            <motion.div
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                className="bg-red-600 backdrop-blur-md px-5 py-2.5 rounded-full flex items-center gap-2.5 shadow-2xl border border-red-500/50"
                                            >
                                                <Zap className="w-4 h-4 text-white fill-white animate-pulse" />
                                                <span className="text-[12px] font-bold uppercase tracking-widest text-white drop-shadow-sm font-montserrat">Flash Sale</span>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Out of Stock Overlay - Matches ProductCard exactly */}
                                    {isSoldOut && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
                                            <span className="text-white text-[12px] md:text-[14px] font-bold uppercase tracking-widest font-montserrat">
                                                Habis
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
