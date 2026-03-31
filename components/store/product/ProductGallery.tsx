"use client";

import FallbackImage from "@/components/store/shared/FallbackImage";
import { m } from "framer-motion";
import { Zap } from "lucide-react";

interface ProductGalleryProps {
    images: string[];
    isSoldOut?: boolean;
    isOnFlashSale?: boolean;
    isOnPreOrder?: boolean;
}

export default function ProductGallery({ images, isSoldOut, isOnFlashSale, isOnPreOrder }: ProductGalleryProps) {
    return (
        <div className="flex flex-col gap-4 md:gap-8 w-full min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {images.map((img, idx) => {
                    const isFeatureImage = idx === 0;

                    return (
                        <m.div
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
                                    {/* Out of Stock Overlay - Matches ProductCard exactly */}
                                    {isSoldOut && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
                                            <span className="text-white text-[12px] md:text-[14px] font-bold uppercase tracking-widest font-montserrat">
                                                Out Of Stock
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </m.div>
                    );
                })}
            </div>
        </div>
    );
}
