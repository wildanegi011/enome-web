import React, { useState } from "react";
import { userApi } from "@/lib/api/user-api";
import { Loader2, Package, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface TrackingManifestProps {
    awb: string;
    courier: string;
    phone: string;
    showTitle?: boolean;
    isCollapsible?: boolean;
}

export default function TrackingManifest({ awb, courier, phone, showTitle = false, isCollapsible = false }: TrackingManifestProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const { data: trackingResponse, isLoading: loading, error: queryError, refetch } = useQuery({
        queryKey: ["tracking", awb, courier, phone],
        queryFn: () => userApi.trackWaybill(awb, courier, phone),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!awb,
    });

    const trackingData = trackingResponse?.data;
    const error = (queryError as any)?.message || (trackingResponse?.meta?.status !== "success" && trackingResponse?.meta?.message) || null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-base-900" />
                <p className="text-[13px] font-medium text-neutral-base-400">Memuat info pengiriman...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                    <h3 className="text-[15px] font-bold text-neutral-base-900">Oops! Terjadi Masalah</h3>
                    <p className="text-[12px] text-neutral-base-400 mt-1">{error}</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="text-[12px] font-bold text-neutral-base-900 underline underline-offset-4"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    const allManifest = trackingData?.manifest || [];
    const displayedManifest = isCollapsible && !isExpanded ? allManifest.slice(0, 3) : allManifest;
    const hasMore = allManifest.length > 3;

    return (
        <div className="space-y-6">
            {showTitle && (
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-neutral-base-900 flex items-center justify-center shadow-lg shadow-neutral-base-900/10 shrink-0">
                        <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-[15px] md:text-[16px] font-bold text-neutral-base-900 uppercase tracking-tight">Riwayat Pengiriman</h2>
                    </div>
                </div>
            )}

            {!allManifest || allManifest.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <Package className="w-10 h-10 text-neutral-base-100" />
                    <p className="text-[13px] text-neutral-base-400 font-medium">Belum ada data manifest tersedia.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="relative space-y-0 pb-4">
                        {/* Connecting line */}
                        <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-neutral-base-50" />

                        {displayedManifest.map((step: any, idx: number) => {
                            const isLatest = idx === 0;
                            return (
                                <div key={idx} className="relative pl-12 pb-8 last:pb-0 group">
                                    {/* Timeline Dot */}
                                    <div
                                        className={cn(
                                            "absolute left-0 top-1.5 w-10 h-10 rounded-xl flex items-center justify-center z-10 transition-all border-4 border-white shadow-sm",
                                            isLatest ? "bg-neutral-base-900 text-white scale-110" : "bg-neutral-base-50 text-neutral-base-200"
                                        )}
                                    >
                                        {isLatest ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <MapPin className="w-4 h-4" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className={cn(
                                        "space-y-1.5 transition-all p-4 rounded-2xl border",
                                        isLatest ? "bg-neutral-base-900/5 border-neutral-base-900/10" : "border-transparent"
                                    )}>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <p className={cn(
                                                "text-[13px] font-bold leading-tight",
                                                isLatest ? "text-neutral-base-900" : "text-neutral-base-600"
                                            )}>
                                                {step.manifest_description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400">
                                                {step.manifest_date}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-neutral-base-200" />
                                            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400">
                                                {step.manifest_time}
                                            </span>
                                        </div>
                                        {step.city_name && (
                                            <div className="flex items-center gap-1.5 pt-0.5">
                                                <MapPin className="w-3 h-3 text-neutral-base-300" />
                                                <span className="text-[12px] font-medium text-neutral-base-400">{step.city_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {isCollapsible && hasMore && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full py-4 border border-neutral-base-100 rounded-2xl text-[12px] font-bold text-neutral-base-900 hover:bg-neutral-base-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isExpanded ? "Tampilkan Lebih Sedikit" : `Tampilkan Semua`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
