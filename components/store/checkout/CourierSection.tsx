"use client";

import { Loader2, Truck } from "lucide-react";

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
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-neutral-base-50 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center font-black text-sky-800 text-[18px]">3</div>
                    <h2 className="text-[16px] font-black uppercase tracking-[0.15em] text-neutral-base-900">
                        Pilihan Pengiriman
                    </h2>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-neutral-base-400 uppercase tracking-widest">Total Berat</span>
                    <span className="text-[14px] font-black text-neutral-base-900">{(totalWeight / 1000).toFixed(2)} Kg</span>
                </div>
            </div>

            {isLoadingCouriers ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <Loader2 className="w-8 h-8 text-sky-800 animate-spin" />
                    <p className="text-[12px] font-bold text-neutral-base-400 uppercase tracking-widest">Memuat Layanan Pengiriman...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {couriers.map((courier) => (
                            <button
                                key={courier.id}
                                onClick={() => {
                                    setShippingForm({ ...shippingForm, courier: courier.code });
                                    setShippingOptions([]);
                                    setShippingPrice(0);
                                }}
                                className={`bg-white border p-5 rounded-[28px] flex flex-col gap-3 items-center text-center hover:shadow-xl hover:shadow-neutral-base-900/5 transition-all group relative overflow-hidden ${shippingForm.courier === courier.code ? "border-sky-800 bg-sky-50/10" : "border-neutral-base-100"}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${shippingForm.courier === courier.code ? "bg-sky-100 text-sky-800 rotate-6" : "bg-neutral-base-50 text-neutral-base-400 group-hover:bg-sky-50 group-hover:text-sky-800 group-hover:-rotate-3"}`}>
                                    <Truck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-[13px] font-black text-neutral-base-900 leading-tight uppercase">{courier.name}</h4>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${shippingForm.courier === courier.code ? "border-sky-800" : "border-neutral-base-200"}`}>
                                    {shippingForm.courier === courier.code && <div className="w-2 h-2 rounded-full bg-sky-800" />}
                                </div>
                            </button>
                        ))}
                    </div>

                    {(shippingForm.courier && (isLoadingShipping || shippingOptions.length > 0)) && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                            <h3 className="text-[11px] font-black text-neutral-base-400 uppercase tracking-widest ml-1">Pilih Layanan {shippingForm.courier}</h3>
                            {isLoadingShipping ? (
                                <div className="bg-neutral-base-50/50 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 border border-dashed border-neutral-base-100">
                                    <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
                                    <p className="text-[10px] font-bold text-neutral-base-400 uppercase tracking-widest">Menghitung Ongkir...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {shippingOptions.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setShippingPrice(opt.cost[0].value);
                                                setShippingForm({ ...shippingForm, service: opt.service });
                                            }}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${shippingForm.service === opt.service ? "border-sky-600 bg-sky-50 shadow-sm" : "border-neutral-base-100 bg-white hover:border-sky-200"}`}
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className="text-[13px] font-black text-neutral-base-900">{opt.service}</span>
                                                <span className="text-[10px] font-bold text-neutral-base-400 uppercase tracking-widest">{opt.cost[0].etd || '1-3'} Hari</span>
                                            </div>
                                            <span className="text-[14px] font-black text-sky-800">{formatPrice(opt.cost[0].value)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-neutral-base-400 uppercase tracking-widest ml-1">Nomor Resi (Opsional)</label>
                            <input
                                type="text"
                                value={shippingForm.resi}
                                onChange={(e) => setShippingForm({ ...shippingForm, resi: e.target.value })}
                                placeholder="Masukkan nomor resi jika ada"
                                className="bg-neutral-base-50 border border-neutral-base-100 p-4 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-neutral-base-400 uppercase tracking-widest ml-1">Catatan Pengiriman</label>
                            <input
                                type="text"
                                value={shippingForm.catatan}
                                onChange={(e) => setShippingForm({ ...shippingForm, catatan: e.target.value })}
                                placeholder="Contoh: Titip ke satpam, depan pagar"
                                className="bg-neutral-base-50 border border-neutral-base-100 p-4 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
