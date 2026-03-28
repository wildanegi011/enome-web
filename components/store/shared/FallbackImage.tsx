"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";


interface FallbackImageProps extends ImageProps {
    fallbackSrc?: string;
}

export default function FallbackImage({
    src,
    alt,
    className,
    fill,
    ...props
}: FallbackImageProps) {
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setError(false);
        setIsLoading(true);
    }, [src]);

    if (error || !src) {
        // ... (existing error state logic remains the same)
        const style: React.CSSProperties = {};
        if (!fill) {
            if (props.width && props.height && typeof props.width === 'number' && typeof props.height === 'number') {
                style.aspectRatio = `${props.width} / ${props.height}`;
                style.width = '100%';
                style.height = 'auto';
            } else {
                if (props.width) style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
                if (props.height) style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
            }
        }

        return (
            <div
                style={style}
                className={`flex flex-col items-center justify-center bg-[#FDFDFD] border border-neutral-base-50 text-neutral-base-300 gap-4 ${className} ${fill ? "absolute inset-0" : "min-h-[200px]"}`}
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-neutral-base-200/30 blur-2xl rounded-full" />
                    <div className="relative w-12 h-12 rounded-full border border-neutral-base-100 flex items-center justify-center bg-white shadow-xs">
                        <ImageOff className="w-5 h-5 text-neutral-base-200" strokeWidth={1.2} />
                    </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase text-neutral-base-900/10">ÉNOMÉ</span>
                    <span className="text-[9px] font-bold tracking-widest uppercase text-neutral-base-900/5">No image</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full overflow-hidden ${fill ? "absolute inset-0" : ""}`}>
            {/* Shimmer / Skeleton Loader */}
            <AnimatePresence>
                {isLoading && (
                    <m.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="absolute inset-0 z-10 bg-neutral-base-50 overflow-hidden"
                    >
                        <m.div
                            animate={{
                                x: ["-100%", "100%"],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "linear",
                            }}
                            className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent w-full h-full"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 text-neutral-base-300 animate-spin" strokeWidth={1.5} />
                            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-neutral-base-900 opacity-20 font-montserrat">Loading</span>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            <m.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{
                    opacity: isLoading ? 0 : 1,
                    scale: isLoading ? 1.05 : 1
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full h-full"
            >
                <Image
                    {...props}
                    src={typeof src === 'string' ? src.replace(/ /g, '%20') : src}
                    alt={alt}
                    fill={fill}
                    className={className}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setError(true);
                        setIsLoading(false);
                    }}
                />
            </m.div>
        </div>
    );
}
