"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Truck, Loader2, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourierSectionProps {
    shippingForm: any;
    setShippingForm: (form: any) => void;
    shippingOptions: any[];
    isLoadingShipping: boolean;
    totalWeight: number;
    formatPrice: (price: number) => string;
    hasError?: boolean;
    onFieldChange?: () => void;
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
}: CourierSectionProps) {
    const [activeTab, setActiveTab] = useState<'automated' | 'manual'>('automated');

    // Filter options based on tab
    const filteredOptions = useMemo(() => {
        if (activeTab === 'automated') {
            return shippingOptions.filter(o => o.type === 'automated' || (o.type !== 'manual' && o.cost[0].value > 0));
        } else {
            return shippingOptions.filter(o => o.type === 'manual' || (o.type !== 'automated' && o.cost[0].value === 0));
        }
    }, [shippingOptions, activeTab]);

    // Auto-switch tab if selection is already in a specific tab
    useEffect(() => {
        const selected = shippingOptions.find(o => o.service === shippingForm.service && (o.courierCode || o.courierName) === shippingForm.courier);
        if (selected) {
            const type = (selected.type === 'manual' || (selected.type !== 'automated' && selected.cost[0].value === 0)) ? 'manual' : 'automated';
            if (type !== activeTab) {
                setActiveTab(type);
            }
        }
    }, [shippingForm.service, shippingForm.courier, shippingOptions]);

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4 border-b border-neutral-base-50 pb-4 md:pb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center font-black text-amber-800 text-[14px] md:text-[18px]">3</div>
                <h2 className="text-[14px] md:text-[16px] font-black uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900">
                    Pilihan Pengiriman
                </h2>
            </div>

            <div className={`p-1 rounded-[32px] transition-all duration-300 ${hasError ? "ring-2 ring-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : ""}`}>
                <div className="flex flex-col gap-6 md:gap-8 bg-neutral-base-50/20 p-4 md:p-8 rounded-[28px] md:rounded-[30px] border border-neutral-base-100/40">
                    <div className="flex flex-col gap-6">
                        {/* Segmented Control / Tabs */}
                        <div className="bg-neutral-base-100/50 p-1.5 rounded-[20px] flex gap-1 shadow-inner">
                            <button
                                onClick={() => setActiveTab('automated')}
                                className={cn(
                                    "flex-1 h-10 md:h-12 rounded-[16px] transition-all duration-300 flex items-center justify-center gap-2",
                                    activeTab === 'automated'
                                        ? "bg-white text-neutral-base-900 shadow-md font-black"
                                        : "text-neutral-base-400 hover:text-neutral-base-600 font-bold"
                                )}
                            >
                                <Truck className={cn("w-3.5 h-3.5", activeTab === 'manual' ? "text-rose-800" : "text-neutral-base-300")} />
                                <span className="text-[10px] md:text-[11px] uppercase tracking-widest">Ekspedisi Reguler</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('manual')}
                                className={cn(
                                    "flex-1 h-10 md:h-12 rounded-[16px] transition-all duration-300 flex items-center justify-center gap-2",
                                    activeTab === 'manual'
                                        ? "bg-white text-neutral-base-900 shadow-md font-black"
                                        : "text-neutral-base-400 hover:text-neutral-base-600 font-bold"
                                )}
                            >
                                <Zap className={cn("w-3.5 h-3.5", activeTab === 'automated' ? "text-amber-800" : "text-neutral-base-300")} />
                                <span className="text-[10px] md:text-[11px] uppercase tracking-widest">Ambil Sendiri</span>
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-400">
                                    Pilih Opsi {activeTab === 'automated' ? 'Reguler' : 'Kargo'}
                                </label>
                            </div>
                            <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-white border border-neutral-base-100 rounded-full shadow-sm w-fit">
                                <span className="text-[10px] md:text-[11px] text-neutral-base-300 font-bold uppercase tracking-widest">Berat:</span>
                                <span className="text-[10px] md:text-[11px] font-black text-neutral-base-900">{(totalWeight / 1000).toFixed(1)}kg</span>
                            </div>
                        </div>
                    </div>

                    {isLoadingShipping ? (
                        <div className="h-32 md:h-40 rounded-xl md:rounded-[32px] border-2 border-dashed border-neutral-base-100 flex flex-col items-center justify-center gap-2 md:gap-3 bg-white/50">
                            <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-amber-800/20" />
                            <p className="text-[12px] md:text-[13px] font-bold text-neutral-base-300">Menghitung ongkos kirim...</p>
                        </div>
                    ) : shippingOptions.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {filteredOptions.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {filteredOptions.map((opt, i) => {
                                        const isSelected = shippingForm.service === opt.service && shippingForm.courier === (opt.courierCode || opt.courierName);
                                        const isManual = opt.type === 'manual' || (opt.type !== 'automated' && opt.cost[0].value === 0);

                                        return (
                                            <div className="flex flex-col gap-3" key={i}>
                                                <button
                                                    onClick={() => {
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
                                                        "flex p-4 md:p-6 rounded-[24px] md:rounded-[28px] border transition-all duration-300 items-center gap-3 md:gap-5",
                                                        isSelected
                                                            ? "border-neutral-base-900 bg-white shadow-xl shadow-neutral-base-900/5 ring-1 ring-neutral-base-900/20"
                                                            : "border-neutral-base-100/50 bg-white hover:bg-neutral-base-50/20"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-xl md:rounded-2xl shrink-0 transition-colors",
                                                        isSelected
                                                            ? "bg-neutral-base-900 text-white"
                                                            : "bg-neutral-base-50 text-neutral-base-400"
                                                    )}>
                                                        {activeTab === 'automated' ? <Zap className="w-5 h-5 md:w-6 md:h-6" /> : <Truck className="w-5 h-5 md:w-6 md:h-6" />}
                                                    </div>

                                                    <div className="flex-1 text-left min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-8">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                                                                <h4 className="text-[13px] md:text-[15px] font-black text-neutral-base-900 uppercase tracking-tight truncate">
                                                                    {opt.courierCode ? `${opt.courierCode.toUpperCase()} - ` : ""}{opt.service}
                                                                </h4>
                                                            </div>
                                                            <p className="text-[10px] md:text-[11px] font-bold text-neutral-base-400 uppercase tracking-widest truncate">
                                                                {opt.description || opt.cost[0].note}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <Clock className="w-3.5 h-3.5 text-neutral-base-200" />
                                                                <span className="text-[10px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-widest">
                                                                    Est: {opt.cost[0].etd ? `${opt.cost[0].etd.replace(" HARI", "").replace(" Hari", "")} Hari` : (isManual ? 'Cek Manual' : 'Menyusul')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="md:text-right shrink-0 mt-1 md:mt-0">
                                                            <span className={cn(
                                                                "text-[15px] md:text-[18px] font-black tabular-nums",
                                                                "text-neutral-base-900"
                                                            )}>
                                                                {!isManual ? formatPrice(opt.cost[0].value) : "Rp. 0"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>


                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-40 rounded-[32px] border-2 border-dashed border-neutral-base-100 flex flex-col items-center justify-center gap-2 bg-white/50 px-8 text-center">
                                    <AlertCircle className="w-8 h-8 text-neutral-base-200" />
                                    <div>
                                        <p className="text-[13px] font-bold text-neutral-base-900">Opsi tidak tersedia</p>
                                        <p className="text-[11px] text-neutral-base-400 font-medium leading-relaxed max-w-[240px] mt-1">
                                            {activeTab === 'automated'
                                                ? "Layanan ekspedisi reguler belum tersedia untuk area tujuan Anda. Silakan cek tab Cargo."
                                                : "Layanan Cargo belum tersedia. Silakan hubungi Admin untuk bantuan pengiriman."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-32 md:h-40 rounded-xl md:rounded-[32px] border-2 border-dashed border-rose-100 flex flex-col items-center justify-center gap-2 md:gap-3 bg-rose-50/10">
                            <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-rose-300" />
                            <p className="text-[12px] md:text-[13px] font-bold text-rose-400">Pilihan pengiriman tidak tersedia</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
