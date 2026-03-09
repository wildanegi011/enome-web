"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function Newsletter() {
    const [email, setEmail] = useState("");
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <section ref={ref} className="py-20 lg:py-24 bg-gray-900">
            <div className="max-w-2xl mx-auto px-8 lg:px-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="font-montserrat text-[42px] lg:text-[56px] text-white italic leading-[1.1]">
                        Join The Énome Circle
                    </h2>
                    <p className="text-neutral-base-400 mt-6 max-w-lg mx-auto text-[16px] leading-relaxed">
                        Be the first to know about our latest artisan collections, exclusive early access, and stories of Indonesian heritage.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-12 flex flex-col sm:flex-row gap-0 max-w-xl mx-auto overflow-hidden rounded-lg shadow-2xl"
                >
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 px-8 py-4 bg-white/10 backdrop-blur-md border-none text-white placeholder:text-neutral-base-500 text-sm focus:outline-none focus:bg-white/15 transition-all w-full"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white text-neutral-base-900 px-10 py-5 text-[12px] font-black tracking-[0.2em] uppercase shrink-0 transition-all border-none"
                    >
                        Subscribe
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
}
