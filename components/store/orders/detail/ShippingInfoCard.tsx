import React, { useState } from "react";
import { Truck, Copy, Check, Search, MapPin, Phone, User } from "lucide-react";
import TrackingModal from "./TrackingModal";
import { CONFIG } from "@/lib/config";
import { cn, toTitleCase } from "@/lib/utils";

interface ShippingInfoCardProps {
    ekspedisi: string;
    service: string;
    noResi: string;
    phone: string;
    statusOrder?: string;
    namaPenerima?: string;
    alamatKirim?: string;
    distrikKirim?: string;
    kotaKirim?: string;
    provinsiKirim?: string;
    trackableCouriers?: string[];
}

export default function ShippingInfoCard({
    ekspedisi,
    service,
    noResi,
    phone,
    statusOrder,
    namaPenerima,
    alamatKirim,
    distrikKirim,
    kotaKirim,
    provinsiKirim,
    trackableCouriers = [],
}: ShippingInfoCardProps) {
    const [copiedResi, setCopiedResi] = useState(false);
    const [isTrackingOpen, setIsTrackingOpen] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedResi(true);
        setTimeout(() => setCopiedResi(false), 2000);
    };

    const isTrackable = noResi && trackableCouriers.includes(ekspedisi?.toLowerCase());
    const showTrackingButton = isTrackable && statusOrder === "KIRIM";

    return (
        <div className="bg-white border border-neutral-base-100 rounded-[32px] md:rounded-[40px] p-5 md:p-10 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 md:gap-5 mb-10">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-[14px] md:rounded-[18px] bg-neutral-base-900 flex items-center justify-center shadow-lg shadow-neutral-base-900/10 shrink-0">
                    <Truck className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h2 className="text-[16px] md:text-[18px] font-bold text-neutral-base-900 tracking-tight font-montserrat">Informasi Pengiriman</h2>
            </div>

            <div className="space-y-5">
                {/* 1. Penerima */}
                <div className="flex items-start gap-4 md:gap-5">
                    <div className="w-10 h-10 rounded-xl bg-neutral-base-50 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-neutral-base-400" />
                    </div>
                    <div>
                        <p className="text-[11px] md:text-[12px] font-bold text-neutral-base-400 uppercase tracking-[0.12em] font-montserrat mb-1.5">Penerima</p>
                        <p className="text-[13px] md:text-[14px] font-semibold text-neutral-base-800 font-montserrat tracking-tight">{toTitleCase(namaPenerima || "")}</p>
                        <div className="flex items-center gap-2 mt-2 text-neutral-base-800">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-[13px] md:text-[14px] font-semibold text-neutral-base-800 font-montserrat tracking-tight">{phone}</span>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-neutral-base-100 ml-12.5 md:ml-14" />

                {/* 2. Alamat Tujuan */}
                <div className="flex items-start gap-4 md:gap-5">
                    <div className="w-10 h-10 rounded-xl bg-neutral-base-50 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-neutral-base-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[11px] md:text-[12px] font-bold text-neutral-base-400 uppercase tracking-[0.12em] font-montserrat mb-1.5">Alamat tujuan</p>
                        <p className="text-[13px] md:text-[14px] font-semibold text-neutral-base-800 leading-relaxed font-montserrat tracking-tight max-w-[500px]">
                            {toTitleCase(alamatKirim || "")}, {toTitleCase(distrikKirim || "")}, {toTitleCase(kotaKirim || "")}, {toTitleCase(provinsiKirim || "")}
                        </p>
                    </div>
                </div>

                <div className="h-px bg-neutral-base-100 ml-12.5 md:ml-14" />

                {/* 3. Ekspedisi & Layanan */}
                <div className="flex items-start gap-4 md:gap-5">
                    <div className="w-10 h-10 rounded-xl bg-neutral-base-50 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-neutral-base-400" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-[12px] font-bold text-neutral-base-400 uppercase tracking-[0.12em] font-montserrat mb-1.5">Ekspedisi & layanan</p>
                        <p className="text-[13px] md:text-[14px] font-semibold text-neutral-base-800 flex items-center gap-2 font-montserrat tracking-tight">
                            {ekspedisi}
                            <span className="w-1 h-1 rounded-full bg-neutral-base-200" />
                            <span className="font-semibold text-neutral-base-800">{service}</span>
                        </p>
                    </div>
                </div>

                <div className="h-px bg-neutral-base-100 ml-12.5 md:ml-14" />

                {/* 4. Nomor Resi & Tombol Lacak */}
                <div className="flex items-start gap-4 md:gap-5">
                    <div className="w-10 h-10 rounded-xl bg-neutral-base-50 flex items-center justify-center shrink-0">
                        <Search className="w-5 h-5 text-neutral-base-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] md:text-[12px] font-bold text-neutral-base-400 uppercase tracking-[0.12em] font-montserrat mb-2">Nomor resi</p>
                        <div className="flex items-center gap-3">
                            <p className={cn(
                                "text-[13px] md:text-[14px] font-black tracking-widest font-mono",
                                noResi ? "text-neutral-base-800" : "text-neutral-base-300 font-montserrat font-bold tracking-tight"
                            )}>
                                {noResi || "menunggu update"}
                            </p>
                            {noResi && (
                                <button
                                    onClick={() => handleCopy(noResi)}
                                    className="p-1.5 rounded-xl bg-white border border-neutral-base-100 shadow-sm hover:bg-neutral-base-900 hover:text-white transition-all active:scale-95"
                                    title="Salin Resi"
                                >
                                    {copiedResi ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            )}
                        </div>

                        {showTrackingButton && (
                            <div className="mt-4">
                                <button
                                    onClick={() => setIsTrackingOpen(true)}
                                    className="w-full md:w-auto px-10 h-14 bg-neutral-base-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-base-800 transition-all shadow-xl shadow-neutral-base-900/10 active:scale-[0.98]"
                                >
                                    <Search className="w-4 h-4" />
                                    Lacak Pesanan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <TrackingModal
                isOpen={isTrackingOpen}
                onClose={() => setIsTrackingOpen(false)}
                awb={noResi}
                courier={ekspedisi}
                phone={phone}
            />
        </div>
    );
}
