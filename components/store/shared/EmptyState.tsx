"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onActionClick?: () => void;
    className?: string;
}

const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onActionClick,
    className
}: EmptyStateProps) => {
    return (
        <div className={cn("py-32 text-center bg-white border border-neutral-base-100 rounded-[32px]", className)}>
            <Icon className="w-12 h-12 text-neutral-base-100 mx-auto mb-6" />
            <h2 className="text-[20px] font-bold text-neutral-base-900 mb-2">{title}</h2>
            <p className="text-[14px] text-neutral-base-400 font-medium mb-8">{description}</p>
            {actionLabel && (
                <>
                    {actionHref ? (
                        <Link
                            href={actionHref}
                            onClick={onActionClick}
                            className="inline-flex h-12 items-center px-8 bg-neutral-base-900 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-neutral-base-800 transition-all font-sans"
                        >
                            {actionLabel}
                        </Link>
                    ) : (
                        <button
                            onClick={onActionClick}
                            className="inline-flex h-12 items-center px-8 bg-neutral-base-900 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-neutral-base-800 transition-all font-sans"
                        >
                            {actionLabel}
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default EmptyState;
