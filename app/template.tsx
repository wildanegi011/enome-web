"use client";

import { m } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full min-h-screen"
        >
            {children}
        </m.div>
    );
}
