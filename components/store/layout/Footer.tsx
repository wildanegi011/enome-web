"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function Footer() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-30px" });

    return (
        <motion.footer
            ref={ref}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="bg-white border-t border-gray-100"
        >
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                <div className="py-12 md:py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link href="/" className="font-serif text-2xl font-black tracking-[0.25em] text-neutral-base-900">
                            ÉNOMÉ
                        </Link>
                        <p className="text-neutral-base-500 text-[14px] mt-6 leading-[1.8] max-w-xs italic">
                            Handcrafted Batik and premium fashion pieces that honor heritage while embracing the modern silhouette.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-[11px] font-black tracking-[0.2em] uppercase text-neutral-base-900 mb-6 font-sans">Quick Links</h4>
                        <ul className="space-y-4">
                            {["Home", "Products", "New Arrivals", "Exclusive Deals"].map((item) => (
                                <li key={item}>
                                    <Link href="/" className="text-[14px] text-neutral-base-500 hover:text-neutral-base-900 transition-colors uppercase tracking-widest text-[11px] font-bold">{item}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <h4 className="text-[11px] font-black tracking-[0.2em] uppercase text-neutral-base-900 mb-6 font-sans">Support</h4>
                        <ul className="space-y-4">
                            {["FAQ", "Shipping Policy", "Returns", "Size Guide"].map((item) => (
                                <li key={item}>
                                    <Link href="/" className="text-[14px] text-neutral-base-500 hover:text-neutral-base-900 transition-colors uppercase tracking-widest text-[11px] font-bold">{item}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-[11px] font-black tracking-[0.2em] uppercase text-neutral-base-900 mb-6 font-sans">Contact</h4>
                        <ul className="space-y-4 text-[14px] text-neutral-base-500 italic">
                            <li>explore@enome.id</li>
                            <li>+62 812 3456 7890</li>
                            <li>Jakarta, ID</li>
                        </ul>
                        {/* Social Icons */}
                        <div className="flex gap-4 mt-8">
                            {[
                                { name: "facebook", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                                { name: "instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
                                { name: "twitter", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                            ].map((social) => (
                                <a
                                    key={social.name}
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-neutral-base-100 flex items-center justify-center text-neutral-base-400 hover:text-neutral-base-900 hover:bg-neutral-base-200 transition-all duration-300"
                                    aria-label={social.name}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d={social.path} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="py-6 border-t border-gray-100 text-center">
                    <p className="text-gray-400 text-[11px] tracking-[0.1em]">
                        &copy; {new Date().getFullYear()} ENOME. All Rights Reserved.
                    </p>
                </div>
            </div>
        </motion.footer>
    );
}
