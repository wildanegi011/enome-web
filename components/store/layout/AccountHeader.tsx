"use client";

import React from "react";
import AccountSidebarMobile from "./AccountSidebarMobile";
import { cn } from "@/lib/utils";

interface AccountHeaderProps {
    title: string;
    description: string;
    children?: React.ReactNode;
    className?: string;
}

const AccountHeader = ({ title, description, children, className }: AccountHeaderProps) => {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8", className)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-[26px] md:text-[32px] font-black text-neutral-base-900 tracking-tight leading-tight">
                        {title}
                    </h1>
                    <p className="text-[12px] md:text-[14px] text-neutral-base-400 font-medium">
                        {description}
                    </p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <AccountSidebarMobile />
                </div>
            </div>
            {children}
        </div>
    );
};

export default AccountHeader;
