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
        <nav className={cn("flex items-center gap-2 text-[14px] text-neutral-base-400 font-montserrat", className)}>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <span className="text-neutral-base-300">›</span>}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-neutral-base-900 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-neutral-base-900 font-bold">{item.label}</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}
