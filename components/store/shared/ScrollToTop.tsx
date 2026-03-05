"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ScrollToTop() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Aggressive reset: ensure it happens after browser scroll restoration
        const resetScroll = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
            document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
            document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
        };

        // Try immediately
        resetScroll();

        // Try again on next frame
        const rafId = requestAnimationFrame(resetScroll);

        // Final fallback after a small delay (useful for some browsers/devices)
        const timeoutId = setTimeout(resetScroll, 50);

        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
        };
    }, [pathname, searchParams]);

    return null;
}
