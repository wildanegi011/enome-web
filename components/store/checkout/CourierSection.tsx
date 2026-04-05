"use client";

import { useState, useMemo, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Clock, Truck, Loader2, Zap, AlertCircle, MapPin, ShoppingBag } from "lucide-react";
import { cn, toTitleCase } from "@/lib/utils";

interface CourierSectionProps {
    shippingForm: any;
    setShippingForm: (form: any) => void;
    shippingOptions: any[];
    isLoadingShipping: boolean;
    totalWeight: number;
    formatPrice: (price: number) => string;
    hasError?: boolean;
    onFieldChange?: () => void;
    onRefresh?: () => void;
    originName?: string;
}

// Sub-component to handle individual courier group state correctly
function CourierGroup({
    group,
    groupIdx,
    shippingForm,
    setShippingForm,
    onFieldChange,
    formatPrice
}: {
    group: any,
    groupIdx: number,
    shippingForm: any,
    setShippingForm: (form: any) => void,
    onFieldChange?: () => void,
    formatPrice: (price: number) => string
}) {
    const isCourierSelected = group.options.some((opt: any) =>
        shippingForm.service === opt.service &&
        shippingForm.courier === (opt.courierCode || opt.courierName)
    );

    // State for expansion - managed correctly at the top of this component
    const [isExpanded, setIsExpanded] = useState(isCourierSelected || groupIdx === 0);

    // Sync with selection changes
    useEffect(() => {
        if (isCourierSelected) setIsExpanded(true);
    }, [isCourierSelected]);

    return (
        <div className={cn(
            "flex flex-col rounded-[24px] md:rounded-[32px] border transition-all duration-300 overflow-hidden",
            isExpanded ? "border-neutral-base-200 bg-neutral-base-50/30 shadow-sm" : "border-neutral-base-100 hover:border-neutral-base-200"
        )}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 md:p-6 text-left group transition-colors hover:bg-neutral-base-50"
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                        isCourierSelected ? "bg-neutral-base-900 text-white" : "bg-white text-neutral-base-400 border border-neutral-base-100 group-hover:bg-neutral-base-100 group-hover:text-neutral-base-600 shadow-xs"
                    )}>
                        <Truck className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <h4 className="text-[12px] md:text-[15px] font-bold text-neutral-base-900 tracking-widest leading-none mb-1">
                            {group.name.toUpperCase()}
                        </h4>
                        <span className="text-[10px] md:text-[12px] font-medium text-neutral-base-400 tracking-widest">
                            {group.options.length} Layanan • Mulai {formatPrice(group.minPrice)}
                        </span>
                    </div>
                </div>
                <m.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="text-neutral-base-300"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </m.div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="px-4 pb-4 md:px-6 md:pb-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {group.options.map((opt: any, i: number) => {
                                const isSelected = shippingForm.service === opt.service && shippingForm.courier === (opt.courierCode || opt.courierName);
                                const isManual = opt.type === 'manual' || (opt.type !== 'automated' && opt.cost[0].value === 0);

                                return (
                                    <button
                                        key={`${groupIdx}-${i}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const courierId = (opt.courierCode || opt.courierName || "Kurir").toUpperCase();
                                            setShippingForm((prev: any) => ({
                                                ...prev,
                                                service: opt.service,
                                                courier: courierId,
                                                courierName: opt.courierName || opt.courierCode || "Kurir",
                                                shippingPrice: opt.cost[0].value,
                                                shippingType: opt.type
                                            }));
                                            onFieldChange?.();
                                        }}
                                        className={cn(
                                            "flex p-4 md:p-5 rounded-2xl md:rounded-[24px] border transition-all duration-300 items-start gap-4 text-left relative",
                                            isSelected
                                                ? "border-neutral-base-900 bg-white shadow-lg ring-1 ring-neutral-base-900/10"
                                                : "border-neutral-base-100 bg-white/50 hover:bg-white hover:border-neutral-base-200"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0 pr-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-[11px] md:text-[14px] font-bold text-neutral-base-900 tracking-tight truncate leading-tight">
                                                    {opt.service.toUpperCase()}
                                                </h4>
                                            </div>

                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-neutral-base-300" />
                                                    <span className="text-[10px] md:text-[12px] font-bold text-neutral-base-500 tracking-widest">
                                                        Est: {opt.cost[0].etd ? `${opt.cost[0].etd.replace(" HARI", "").replace(" Hari", "")} Hari` : (isManual ? 'Cek Manual' : '-')}
                                                    </span>
                                                </div>
                                                <div className="mt-1">
                                                    <span className={cn(
                                                        "text-[13px] md:text-[16px] font-bold tabular-nums",
                                                        isSelected ? "text-neutral-base-950" : "text-neutral-base-900"
                                                    )}>
                                                        {!isManual ? formatPrice(opt.cost[0].value) : "Rp. 0"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                                            isSelected ? "border-neutral-base-900" : "border-neutral-base-200"
                                        )}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-neutral-base-900" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function CourierSection({
    shippingForm,
    setShippingForm,
    shippingOptions,
    isLoadingShipping,
    totalWeight,
    formatPrice,
    hasError,
    onFieldChange,
    onRefresh,
    originName,
}: CourierSectionProps) {
    const groupedOptions = useMemo(() => {
        if (!shippingOptions.length) return [];

        const groups: Record<string, any[]> = {};
        shippingOptions.forEach(opt => {
            const key = opt.courierName || opt.courierCode || "Lainnya";
            if (!groups[key]) groups[key] = [];
            groups[key].push(opt);
        });

        return Object.entries(groups).map(([name, options]) => ({
            name,
            options,
            minPrice: Math.min(...options.map(o => o.cost[0]?.value || 0))
        })).sort((a, b) => a.minPrice - b.minPrice);
    }, [shippingOptions]);

    return (
        <section className={cn(
            "flex flex-col gap-3 bg-white/80 backdrop-blur-sm border border-neutral-base-100/50 p-4 md:p-5 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300",
            hasError ? "ring-2 ring-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : ""
        )}>
            <div className="flex items-center justify-between border-b border-neutral-base-50 pb-2 md:pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800">
                        <Truck className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <h2 className="text-[14px] md:text-[15px] font-bold uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900">
                        Pilihan Pengiriman
                    </h2>
                </div>
            </div>

            <div className="flex flex-col gap-4 px-3 md:px-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 md:p-4 bg-neutral-base-50/50 rounded-[20px] border border-neutral-base-100/50 mb-0.5 shadow-sm">
                    <div className="flex items-center gap-2.5 md:gap-3.5 px-0.5">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-neutral-base-100 shrink-0">
                            <MapPin className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-neutral-base-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] md:text-[10px] font-bold text-neutral-base-400 uppercase tracking-widest mb-0.5">Dikirim Dari</span>
                            <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden">
                                <span className="text-[11px] md:text-[14px] font-bold text-neutral-base-900 truncate">
                                    {toTitleCase(originName || "Pilih Asal")}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="h-px w-full bg-neutral-base-200/30 md:hidden" />
                    <div className="flex items-center gap-2.5 md:gap-3.5 px-0.5 md:border-l md:border-neutral-base-200/50 md:pl-5">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-neutral-base-100 shrink-0">
                            <ShoppingBag className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-neutral-base-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] font-bold text-neutral-base-400 uppercase tracking-widest mb-0.5">Total Berat</span>
                            <span className="text-[11px] md:text-[14px] font-bold text-neutral-base-900 tabular-nums">
                                {totalWeight < 1000 ? `${totalWeight}g` : `${(totalWeight / 1000).toFixed(1)}kg`}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col px-1.5 pt-1">
                    <label className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest text-neutral-base-400">
                        Pilih Layanan Ekspedisi
                    </label>
                </div>

                {isLoadingShipping ? (
                    <div className="h-32 md:h-40 rounded-xl md:rounded-[32px] border-2 border-dashed border-neutral-base-100 flex flex-col items-center justify-center gap-2 md:gap-3 bg-white/50">
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-amber-800/20" />
                        <p className="text-[11px] md:text-[12px] font-medium text-neutral-base-400">Menghitung ongkos kirim...</p>
                    </div>
                ) : groupedOptions.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {groupedOptions.map((group, groupIdx) => (
                            <CourierGroup
                                key={groupIdx}
                                group={group}
                                groupIdx={groupIdx}
                                shippingForm={shippingForm}
                                setShippingForm={setShippingForm}
                                onFieldChange={onFieldChange}
                                formatPrice={formatPrice}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-40 md:h-48 rounded-xl md:rounded-[32px] border-2 border-dashed border-rose-100 flex flex-col items-center justify-center gap-4 bg-rose-50/10 px-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-400">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-[13px] md:text-[14px] font-bold text-rose-500 uppercase tracking-widest">Pilihan pengiriman tidak tersedia</p>
                            <p className="text-[11px] text-neutral-base-400 font-medium whitespace-normal max-w-[250px] mx-auto">Kurir mungkin tidak mendukung area ini atau terjadi gangguan koneksi.</p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onRefresh?.();
                            }}
                            className="flex items-center gap-2 bg-neutral-base-900 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-neutral-base-800 transition-all shadow-lg active:scale-95 group"
                        >
                            <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                            Muat ulang Ekspedisi
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
