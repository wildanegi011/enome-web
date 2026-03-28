"use client";

import React from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
    label: string;
    value: string;
}

interface OrderTabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (value: string) => void;
}

const OrderTabs = ({ tabs, activeTab, onChange }: OrderTabsProps) => {
    return (
        <div className="w-[350px] md:w-full overflow-hidden mb-6">
            <div className="overflow-x-auto scrollbar-hide touch-pan-x pb-1">
                <div className="inline-flex items-center min-w-full bg-white border border-neutral-base-100 rounded-3xl md:rounded-[32px] p-1 shadow-sm">
                    <div className="flex items-center w-full">
                        {tabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => onChange(tab.value)}
                                className={cn(
                                    "flex-1 min-w-[120px] py-4 text-[13px] font-bold transition-all relative",
                                    activeTab === tab.value
                                        ? "text-neutral-base-900"
                                        : "text-neutral-base-400 hover:text-neutral-base-600"
                                )}
                            >
                                {tab.label}
                                {activeTab === tab.value && (
                                    <m.div
                                        layoutId="activeStatus"
                                        className="absolute bottom-0 left-6 right-6 h-0.5 bg-neutral-base-900"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTabs;
