"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import React from "react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
    return (
        <nav className={cn("flex items-center gap-2 text-[12px] md:text-[14px] text-neutral-base-400 font-montserrat", className)}>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <span className="text-neutral-base-300">›</span>}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-neutral-base-900 transition-colors truncate max-w-[120px] md:max-w-none"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-neutral-base-900 font-bold truncate max-w-[150px] md:max-w-[300px] lg:max-w-[400px] shrink-0">{item.label}</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}
