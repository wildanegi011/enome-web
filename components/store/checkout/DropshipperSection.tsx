"use client";

import { m, AnimatePresence } from "framer-motion";
import { Truck, User, Phone, MapPin } from "lucide-react";

interface DropshipperSectionProps {
    isDropshipper: boolean;
    setIsDropshipper: (is: boolean) => void;
    dropshipperForm: any;
    setDropshipperForm: (form: any) => void;
    onFieldChange?: () => void;
}

export default function DropshipperSection({
    isDropshipper,
    setIsDropshipper,
    dropshipperForm,
    setDropshipperForm,
    onFieldChange
}: DropshipperSectionProps) {
    return (
        <div className="bg-white/40 backdrop-blur-sm rounded-[28px] md:rounded-[32px] border border-dashed border-neutral-base-200/60 p-4 md:p-8">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className={`w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 ${isDropshipper ? "bg-amber-800 text-white shadow-xl shadow-amber-900/20 rotate-6" : "bg-neutral-base-50 text-neutral-base-400 shadow-sm shadow-neutral-base-900/5 hover:-rotate-3"}`}>
                        <Truck className={`w-4.5 h-4.5 md:w-6 md:h-6 ${isDropshipper ? "animate-pulse" : ""}`} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] md:text-[12px] font-bold uppercase tracking-widest text-neutral-base-900">Dropshipper?</span>
                            {isDropshipper && <span className="bg-amber-100 text-amber-800 text-[10px] md:text-[12px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">AKTIF</span>}
                        </div>
                        <span className="text-[10px] md:text-[11px] text-neutral-base-400 font-bold leading-tight hidden xs:block">Kirim paket atas nama Anda sendiri.</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsDropshipper(!isDropshipper)}
                    className={`w-11 h-5.5 md:w-14 md:h-7 rounded-full transition-all relative shrink-0 ${isDropshipper ? "bg-amber-800 shadow-md shadow-amber-900/10" : "bg-neutral-base-200"}`}
                >
                    <m.div
                        animate={{ x: isDropshipper ? 22 : 4 }}
                        className="absolute top-1 w-3.5 h-3.5 md:w-4.5 md:h-4.5 bg-white rounded-full shadow-sm"
                    />
                </button>
            </div>

            <AnimatePresence>
                {isDropshipper && (
                    <m.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden border-t border-neutral-base-100/50 pt-3 md:pt-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 px-0 md:px-1">
                            <div className="flex flex-col gap-1 md:gap-2">
                                <div className="flex items-center gap-2 px-1">
                                    <User className="w-3 h-3 text-amber-800" />
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-neutral-base-400">Nama Pengirim</label>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={dropshipperForm.name}
                                    onChange={(e) => {
                                        setDropshipperForm({ ...dropshipperForm, name: e.target.value });
                                        onFieldChange?.();
                                    }}
                                    className="h-10 md:h-12 bg-white border border-neutral-base-100 rounded-xl md:rounded-2xl px-4 md:px-5 outline-none focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 font-bold text-[12px] md:text-[13px] transition-all shadow-sm shadow-neutral-base-900/5 placeholder:text-neutral-base-200"
                                    placeholder="Nama Anda..."
                                />
                            </div>
                            <div className="flex flex-col gap-1 md:gap-2">
                                <div className="flex items-center gap-2 px-1">
                                    <Phone className="w-3 h-3 text-amber-800" />
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-neutral-base-400">Nomor Telepon</label>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={dropshipperForm.phone}
                                    onChange={(e) => {
                                        setDropshipperForm({ ...dropshipperForm, phone: e.target.value });
                                        onFieldChange?.();
                                    }}
                                    className="h-10 md:h-12 bg-white border border-neutral-base-100 rounded-xl md:rounded-2xl px-4 md:px-5 outline-none focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 font-bold text-[12px] md:text-[13px] transition-all shadow-sm shadow-neutral-base-900/5 placeholder:text-neutral-base-200"
                                    placeholder="08..."
                                />
                            </div>
                            <div className="flex flex-col gap-1 md:gap-2 md:col-span-2">
                                <div className="flex items-center gap-2 px-1">
                                    <MapPin className="w-3 h-3 text-amber-800" />
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-neutral-base-400">Alamat Pengirim</label>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={dropshipperForm.address}
                                    onChange={(e) => {
                                        setDropshipperForm({ ...dropshipperForm, address: e.target.value });
                                        onFieldChange?.();
                                    }}
                                    className="h-10 md:h-12 bg-white border border-neutral-base-100 rounded-xl md:rounded-2xl px-4 md:px-5 outline-none focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 font-bold text-[12px] md:text-[13px] transition-all shadow-sm shadow-neutral-base-900/5 placeholder:text-neutral-base-200"
                                    placeholder="Alamat asal (Opsional)..."
                                />
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
