"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";
import { ImageOff } from "lucide-react";

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

    useEffect(() => {
        setError(false);
    }, [src]);

    if (error || !src) {
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
        <Image
            {...props}
            src={src}
            alt={alt}
            fill={fill}
            className={className}
            onError={() => {
                setError(true);
            }}
        />
    );
}
