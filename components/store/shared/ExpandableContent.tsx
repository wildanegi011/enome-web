"use client";

import { useState, useRef, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableContentProps {
    content: string;
    maxHeight?: number;
}

export default function ExpandableContent({ content, maxHeight = 400 }: ExpandableContentProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [shouldShowButton, setShouldShowButton] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            setShouldShowButton(contentRef.current.scrollHeight > maxHeight);
        }
    }, [content, maxHeight]);

    return (
        <div className="relative">
            <m.div
                initial={false}
                animate={{ height: isExpanded ? "auto" : maxHeight }}
                className="overflow-hidden relative"
            >
                <div
                    ref={contentRef}
                    className="prose prose-neutral max-w-none 
                        prose-headings:font-heading prose-headings:font-semibold prose-headings:text-neutral-base-900
                        prose-p:text-neutral-base-600 prose-p:leading-relaxed
                        prose-img:rounded-2xl prose-img:shadow-sm"
                    dangerouslySetInnerHTML={{ __html: content }}
                />

                {!isExpanded && shouldShowButton && (
                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none" />
                )}
            </m.div>

            {shouldShowButton && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="group relative flex items-center gap-3 py-4 text-neutral-base-900 transition-all duration-300"
                    >
                        <span className="text-[11px] font-black tracking-[0.3em] uppercase">
                            {isExpanded ? "Tampilkan Lebih Sedikit" : "Selengkapnya"}
                        </span>
                        <div className="relative flex items-center justify-center size-8 rounded-full border border-neutral-base-200 group-hover:border-neutral-base-900 transition-colors">
                            {isExpanded ? (
                                <ChevronUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
                            ) : (
                                <ChevronDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                            )}
                        </div>

                        {/* Underline animation */}
                        <div className="absolute bottom-3 left-0 w-0 h-px bg-neutral-base-900 transition-all duration-500 group-hover:w-[calc(100%-2.5rem)]" />
                    </button>
                </div>
            )}
        </div>
    );
}
