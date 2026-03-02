"use client";

import { motion, AnimatePresence } from "framer-motion";
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
        <div className="bg-neutral-base-50/20 rounded-xl md:rounded-[32px] border border-dashed border-neutral-base-100/80 p-4 md:p-8">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 ${isDropshipper ? "bg-amber-800 text-white shadow-xl shadow-amber-900/20 rotate-6" : "bg-neutral-base-50 text-neutral-base-400 shadow-sm shadow-neutral-base-900/5 hover:-rotate-3"}`}>
                        <Truck className={`w-5 h-5 md:w-6 md:h-6 ${isDropshipper ? "animate-pulse" : ""}`} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-900">Dropshipper?</span>
                            {isDropshipper && <span className="bg-amber-100 text-amber-800 text-[10px] md:text-[11px] font-black px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-widest">AKTIF</span>}
                        </div>
                        <span className="text-[10px] md:text-[11px] text-neutral-base-400 font-bold leading-tight hidden sm:block">Gunakan nama Anda sebagai pengirim paket ini.</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsDropshipper(!isDropshipper)}
                    className={`w-12 h-6 md:w-14 md:h-7 rounded-full transition-all relative shrink-0 ${isDropshipper ? "bg-amber-800 shadow-md shadow-amber-900/10" : "bg-neutral-base-200"}`}
                >
                    <motion.div
                        animate={{ x: isDropshipper ? 24 : 4 }}
                        className="absolute top-1 md:top-1.5 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                </button>
            </div>

            <AnimatePresence>
                {isDropshipper && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden border-t border-neutral-base-100/50 pt-6 md:pt-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 px-0 md:px-2">
                            <div className="flex flex-col gap-2 md:gap-3">
                                <div className="flex items-center gap-2 px-1">
                                    <User className="w-3.5 h-3.5 text-amber-800" />
                                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-900">Nama Pengirim</label>
                                </div>
                                <input
                                    type="text"
                                    value={dropshipperForm.name}
                                    onChange={(e) => {
                                        setDropshipperForm({ ...dropshipperForm, name: e.target.value });
                                        onFieldChange?.();
                                    }}
                                    className="h-12 md:h-14 bg-white border border-neutral-base-100 rounded-xl md:rounded-2xl px-4 md:px-6 outline-none focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 font-bold text-[13px] md:text-[14px] transition-all shadow-sm placeholder:text-neutral-base-200"
                                    placeholder="Nama Anda..."
                                />
                            </div>
                            <div className="flex flex-col gap-2 md:gap-3">
                                <div className="flex items-center gap-2 px-1">
                                    <Phone className="w-3.5 h-3.5 text-amber-800" />
                                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-900">Nomor Telepon</label>
                                </div>
                                <input
                                    type="text"
                                    value={dropshipperForm.phone}
                                    onChange={(e) => {
                                        setDropshipperForm({ ...dropshipperForm, phone: e.target.value });
                                        onFieldChange?.();
                                    }}
                                    className="h-12 md:h-14 bg-white border border-neutral-base-100 rounded-xl md:rounded-2xl px-4 md:px-6 outline-none focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 font-bold text-[13px] md:text-[14px] transition-all shadow-sm placeholder:text-neutral-base-200"
                                    placeholder="08..."
                                />
                            </div>
                            <div className="flex flex-col gap-2 md:gap-3 md:col-span-2">
                                <div className="flex items-center gap-2 px-1">
                                    <MapPin className="w-3.5 h-3.5 text-amber-800" />
                                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-neutral-base-900">Alamat Pengirim</label>
                                </div>
                                <input
                                    type="text"
                                    value={dropshipperForm.address}
                                    onChange={(e) => {
                                        setDropshipperForm({ ...dropshipperForm, address: e.target.value });
                                        onFieldChange?.();
                                    }}
                                    className="h-12 md:h-14 bg-white border border-neutral-base-100 rounded-xl md:rounded-2xl px-4 md:px-6 outline-none focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 font-bold text-[13px] md:text-[14px] transition-all shadow-sm placeholder:text-neutral-base-200"
                                    placeholder="Alamat asal (Opsional)..."
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
