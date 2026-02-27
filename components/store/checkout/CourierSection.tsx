"use client";

import { Loader2, Truck, Zap, Clock } from "lucide-react";

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
}

export default function CourierSection({
    couriers,
    isLoadingCouriers,
    shippingForm,
    setShippingForm,
    shippingOptions,
    isLoadingShipping,
    setShippingPrice,
    setShippingOptions,
    totalWeight,
    formatPrice
}: CourierSectionProps) {
    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex items-center justify-between border-b border-neutral-base-50 pb-4 md:pb-6">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-sky-50 flex items-center justify-center font-black text-sky-800 text-[14px] md:text-[18px]">3</div>
                    <h2 className="text-[13px] md:text-[16px] font-black uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900">
                        Pilihan Pengiriman
                    </h2>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[9px] md:text-[10px] font-black text-neutral-base-400 uppercase tracking-widest">Total Berat</span>
                    <span className="text-[12px] md:text-[14px] font-black text-neutral-base-900">{(totalWeight / 1000).toFixed(2)} Kg</span>
                </div>
            </div>

            {isLoadingCouriers || isLoadingShipping ? (
                <div className="flex flex-col items-center justify-center py-8 md:py-12 gap-3 md:gap-4 bg-neutral-base-50/30 rounded-xl md:rounded-[32px] border border-dashed border-neutral-base-100">
                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-sky-800 animate-spin" />
                    <p className="text-[10px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-[0.15em] md:tracking-[0.2em]">Menghitung Ongkos Kirim...</p>
                </div>
            ) : shippingOptions.length > 0 ? (
                <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] md:text-[11px] font-black text-neutral-base-400 uppercase tracking-widest md:tracking-[0.15em]">Opsi Pengiriman</h3>
                        <span className="text-[9px] md:text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 md:py-1 rounded-full">{shippingOptions.length} Layanan</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:gap-3">
                        {shippingOptions.map((opt, idx) => {
                            const isSelected = shippingForm.service === opt.service;
                            const isExpress = opt.service?.toLowerCase().includes('yes') || opt.service?.toLowerCase().includes('express') || opt.service?.toLowerCase().includes('ons') || opt.service?.toLowerCase().includes('best') || opt.service?.toLowerCase().includes('sameday') || opt.service?.toLowerCase().includes('nextday');
                            const Icon = isExpress ? Zap : Clock;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setShippingPrice(opt.cost[0].value);
                                        setShippingForm({
                                            ...shippingForm,
                                            service: opt.service,
                                            courier: opt.courierCode || shippingForm.courier
                                        });
                                    }}
                                    className={`flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-[16px] border transition-all ${isSelected
                                        ? "border-black border-2 bg-white text-black"
                                        : "border-neutral-base-200 bg-white hover:border-neutral-base-300"
                                        }`}
                                >
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className={`w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all shrink-0 ${isSelected
                                            ? "bg-black text-white"
                                            : "bg-neutral-base-50 text-neutral-base-400"
                                            }`}>
                                            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isSelected && isExpress ? "fill-white" : ""}`} />
                                        </div>
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className="text-[13px] md:text-[15px] font-bold text-neutral-base-900 capitalize tracking-tight">
                                                {opt.service}
                                            </span>
                                            <span className="text-[11px] md:text-[13px] font-medium text-neutral-base-400">
                                                {opt.cost[0].etd ? `${opt.cost[0].etd.replace(" HARI", "").replace(" Hari", "")} Hari` : '1-3 Hari'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[13px] md:text-[15px] font-bold text-black tabular-nums">
                                        {formatPrice(opt.cost[0].value)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : !shippingForm.kecamatan ? (
                <div className="bg-neutral-base-50/50 rounded-xl md:rounded-[32px] p-6 md:p-10 flex flex-col items-center justify-center gap-3 md:gap-4 border border-dashed border-neutral-base-100 italic">
                    <Truck className="w-6 h-6 md:w-8 md:h-8 text-neutral-base-200" />
                    <p className="text-[10px] md:text-[11px] font-bold text-neutral-base-400 uppercase tracking-widest text-center">Silakan pilih alamat pengiriman terlebih dahulu <br /><span className="text-[9px] md:text-[10px] font-medium normal-case">(Lengkapi Data di bagian 2)</span></p>
                </div>
            ) : (
                <div className="bg-rose-50 rounded-xl md:rounded-[32px] p-6 md:p-10 flex flex-col items-center justify-center gap-3 md:gap-4 border border-rose-100">
                    <p className="text-[10px] md:text-[11px] font-black text-rose-600 uppercase tracking-widest text-center">Tidak ada kurir yang menjangkau lokasi ini atau terjadi kesalahan.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-2 md:mt-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[9px] md:text-[10px] font-black text-neutral-base-400 uppercase tracking-widest ml-1">Nomor Resi (Opsional)</label>
                    <input
                        type="text"
                        value={shippingForm.resi}
                        onChange={(e) => setShippingForm({ ...shippingForm, resi: e.target.value })}
                        placeholder="Masukkan nomor resi jika ada"
                        className="bg-neutral-base-50 border border-neutral-base-100 p-3 md:p-4 rounded-xl md:rounded-2xl text-[12px] md:text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[9px] md:text-[10px] font-black text-neutral-base-400 uppercase tracking-widest ml-1">Catatan Pengiriman</label>
                    <input
                        type="text"
                        value={shippingForm.catatan}
                        onChange={(e) => setShippingForm({ ...shippingForm, catatan: e.target.value })}
                        placeholder="Contoh: Titip ke satpam"
                        className="bg-neutral-base-50 border border-neutral-base-100 p-3 md:p-4 rounded-xl md:rounded-2xl text-[12px] md:text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                </div>
            </div>
        </div>
    );
}
