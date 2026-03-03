"use client";

import { Clock, Truck, Loader2, Zap, AlertCircle } from "lucide-react";

interface CourierSectionProps {
    couriers: any[];
    isLoadingCouriers: boolean;
    shippingForm: any;
    setShippingForm: (form: any) => void;
    shippingOptions: any[];
    isLoadingShipping: boolean;
    setShippingPrice: (price: number) => void;
    setShippingOptions: (options: any[]) => void;
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
    setShippingPrice,
    totalWeight,
    formatPrice,
    hasError,
    onFieldChange,
    // Unused but passed props
    couriers,
    isLoadingCouriers,
    setShippingOptions
}: CourierSectionProps) {
    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4 border-b border-neutral-base-50 pb-4 md:pb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center font-black text-amber-800 text-[14px] md:text-[18px]">3</div>
                <h2 className="text-[14px] md:text-[16px] font-black uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900">
                    Pilihan Pengiriman
                </h2>
            </div>

            <div className={`p-1 rounded-[32px] transition-all duration-300 ${hasError ? "ring-2 ring-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : ""}`}>
                <div className="flex flex-col gap-6 md:gap-8 bg-neutral-base-50/20 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[30px] border border-neutral-base-100/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-amber-800" />
                            <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-900">Opsi Pengiriman</label>
                        </div>
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-white border border-neutral-base-100 rounded-full shadow-sm w-fit">
                            <span className="text-[10px] md:text-[11px] text-neutral-base-400 font-bold uppercase tracking-widest">Total Berat:</span>
                            <span className="text-[10px] md:text-[11px] font-black text-neutral-base-900">{(totalWeight / 1000).toFixed(1)}kg</span>
                        </div>
                    </div>

                    {isLoadingShipping ? (
                        <div className="h-32 md:h-40 rounded-xl md:rounded-[32px] border-2 border-dashed border-neutral-base-100 flex flex-col items-center justify-center gap-2 md:gap-3 bg-white/50">
                            <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-amber-800/20" />
                            <p className="text-[12px] md:text-[13px] font-bold text-neutral-base-300">Menghitung ongkos kirim...</p>
                        </div>
                    ) : shippingOptions.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {shippingOptions.map((opt, i) => {
                                const isSelected = shippingForm.service === opt.service && shippingForm.courier === (opt.courierCode || opt.courierName);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            const courierId = (opt.courierCode || opt.courierName || "Kurir").toUpperCase();
                                            setShippingForm((prev: any) => ({
                                                ...prev,
                                                service: opt.service,
                                                courier: courierId,
                                                courierName: opt.courierName || opt.courierCode || "Kurir",
                                                shippingPrice: opt.cost[0].value
                                            }));
                                            onFieldChange?.();
                                        }}
                                        className={`flex p-4 md:p-6 rounded-[28px] border transition-all duration-500 items-center gap-4 ${isSelected
                                            ? "border-neutral-base-900 bg-white/50 backdrop-blur-sm ring-4 ring-neutral-base-900/5 shadow-[0_10px_30px_rgb(0,0,0,0.06)] scale-[1.01] z-10"
                                            : "border-neutral-base-100/50 bg-white/30 hover:bg-white hover:shadow-md"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl transition-all duration-500 shrink-0 ${isSelected
                                            ? "bg-neutral-base-900 text-white shadow-lg shadow-neutral-base-900/20"
                                            : "bg-white/80 backdrop-blur-sm text-neutral-base-400 group-hover:bg-white shadow-sm border border-neutral-base-100/50"
                                            }`}>
                                            <Truck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                        </div>

                                        <div className="flex-1 text-left min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-8">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-[13px] md:text-[15px] font-black text-neutral-base-900 uppercase tracking-tight">
                                                        {opt.courierCode ? `${opt.courierCode.toUpperCase()} - ` : ""}{opt.service}
                                                    </h4>
                                                    {isSelected && (
                                                        <span className="bg-neutral-base-900 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Dipilih</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] md:text-[11px] font-bold text-neutral-base-400 uppercase tracking-widest truncate">
                                                    {opt.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-neutral-base-300" />
                                                    <span className="text-[10px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-widest">
                                                        Est: {opt.cost[0].etd ? `${opt.cost[0].etd.replace(" HARI", "").replace(" Hari", "")} Hari` : '1-3 Hari'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-base-100/50">
                                                <span className="text-[16px] md:text-[18px] font-black text-neutral-base-900 tabular-nums">
                                                    {formatPrice(opt.cost[0].value)}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-32 md:h-40 rounded-xl md:rounded-[32px] border-2 border-dashed border-rose-100 flex flex-col items-center justify-center gap-2 md:gap-3 bg-rose-50/10">
                            <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-rose-300" />
                            <p className="text-[12px] md:text-[13px] font-bold text-rose-400">Pilihan pengiriman tidak tersedia</p>
                        </div>
                    )}
                    {/* <p className="px-1 text-[9px] md:text-[10px] text-neutral-base-400 font-bold italic text-center md:text-left">
                        * Pengiriman dikirim dari <span className="text-neutral-base-900">Gudang Jakarta</span>.
                    </p> */}
                </div>
            </div>
        </div>
    );
}
