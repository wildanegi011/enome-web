"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Package } from "lucide-react";

export const statusSteps = [
    { label: "Pesanan dibuat", status: "OPEN" },
    { label: "Dikemas", status: "PROSES PACKING" },
    { label: "Dikirim", status: "KIRIM" },
    { label: "Selesai", status: "CLOSE" },
];

interface OrderTimelineProps {
    statusOrder: string;
}

export default function OrderTimeline({ statusOrder }: OrderTimelineProps) {
    const currentStatusIndex = statusSteps.findIndex((s) => s.status === statusOrder);

    return (
        <div className="bg-white border border-neutral-base-100 rounded-[28px] md:rounded-[32px] p-6 md:p-10 mb-8 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-4 relative overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
                {statusSteps.map((step, idx) => {
                    const isCompleted =
                        idx <= currentStatusIndex || statusOrder === "SELESAI" || statusOrder === "CLOSE";

                    return (
                        <div
                            key={step.label}
                            className="flex flex-col items-center relative z-10 min-w-[70px] md:flex-1"
                        >
                            <div
                                className={cn(
                                    "w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500",
                                    isCompleted
                                        ? "bg-neutral-base-900 text-white shadow-xl shadow-neutral-base-900/20"
                                        : "bg-neutral-base-50 text-neutral-base-200"
                                )}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6" />
                                ) : (
                                    <Package className="w-4 h-4 md:w-6 md:h-6" />
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] md:text-[11px] font-black mt-2.5 md:mt-4 tracking-[0.12em] text-center uppercase font-montserrat",
                                    isCompleted ? "text-neutral-base-900" : "text-neutral-base-300"
                                )}
                            >
                                {step.label}
                            </span>

                            {/* Connector line for desktop */}
                            {idx < statusSteps.length - 1 && (
                                <div className="hidden md:block absolute left-1/2 top-6 w-full h-[2px] bg-neutral-base-50 -translate-y-1/2 ml-6 pr-12">
                                    <div
                                        className={cn(
                                            "h-full bg-neutral-base-900 transition-all duration-700",
                                            idx < currentStatusIndex ? "w-full" : "w-0"
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
