"use client";

import { Plus, User, Phone, MapPin } from "lucide-react";
import AddressSelectionModal from "@/components/store/AddressSelectionModal";
import AddAddressModal from "@/components/store/AddAddressModal";
import AddressCard from "@/components/store/AddressCard";
import { Address } from "@/hooks/use-addresses";

interface AddressSectionProps {
    addresses: Address[];
    shippingForm: any;
    setShippingForm: (form: any) => void;
    isSelectionModalOpen: boolean;
    setIsSelectionModalOpen: (open: boolean) => void;
    isAddAddressModalOpen: boolean;
    setIsAddAddressModalOpen: (open: boolean) => void;
    handleSelectAddress: (addr: Address) => void;
}

export default function AddressSection({
    addresses,
    shippingForm,
    setShippingForm,
    isSelectionModalOpen,
    setIsSelectionModalOpen,
    isAddAddressModalOpen,
    setIsAddAddressModalOpen,
    handleSelectAddress
}: AddressSectionProps) {
    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-base-50 pb-4 md:pb-6">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center font-black text-amber-800 text-[14px] md:text-[18px]">2</div>
                    <h2 className="text-[13px] md:text-[16px] font-black uppercase tracking-widest md:tracking-[0.15em] text-neutral-base-900">
                        Informasi Pengiriman
                    </h2>
                </div>
                {addresses.length > 0 ? (
                    <div className="flex gap-2 ml-11 sm:ml-0">
                        <button
                            onClick={() => setIsAddAddressModalOpen(true)}
                            className="text-[9px] font-black text-neutral-base-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-neutral-base-900 transition-all"
                        >
                            <Plus className="w-3 h-3" />
                            Tambah
                        </button>
                        <div className="w-px h-3 bg-neutral-base-200 self-center" />
                        <button
                            onClick={() => setIsSelectionModalOpen(true)}
                            className="text-[9px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1.5 hover:opacity-70 transition-all"
                        >
                            Ubah Alamat
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAddAddressModalOpen(true)}
                        className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 hover:bg-neutral-base-800 transition-all bg-neutral-base-900 px-3 md:px-4 py-2 rounded-full shadow-lg shadow-neutral-base-900/10 self-start ml-11 sm:ml-0"
                    >
                        <Plus className="w-3 h-3" />
                        Tambah Alamat
                    </button>
                )}
            </div>

            <AddressSelectionModal
                isOpen={isSelectionModalOpen}
                onClose={() => setIsSelectionModalOpen(false)}
                onSelect={handleSelectAddress}
            />

            <AddAddressModal
                open={isAddAddressModalOpen}
                onOpenChange={setIsAddAddressModalOpen}
            />

            <div className="flex flex-col gap-6 md:gap-8">
                {shippingForm.addressId > 0 && addresses.find(a => a.id === shippingForm.addressId) ? (
                    <div className="bg-neutral-base-50/30 p-1 rounded-xl md:rounded-[32px] border border-neutral-base-100/60 overflow-hidden">
                        <AddressCard
                            address={addresses.find(a => a.id === shippingForm.addressId)!}
                            variant="checkout"
                            onReset={() => {
                                setShippingForm({
                                    ...shippingForm,
                                    addressId: 0,
                                    name: "",
                                    phone: "",
                                    address: "",
                                    kecamatan: "",
                                    kota: "",
                                    provinsi: "",
                                    kodePos: "",
                                });
                            }}
                            className="p-4 md:p-6"
                        />
                    </div>
                ) : (
                    <div className="bg-neutral-base-50/30 rounded-xl md:rounded-[32px] p-4 md:p-8 border border-neutral-base-100/60 flex flex-col gap-6 md:gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                            <div className="flex flex-col gap-2 md:gap-3">
                                <div className="flex items-center gap-2 px-1">
                                    <User className="w-3.5 h-3.5 text-amber-800" />
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-base-900">Nama Penerima</label>
                                </div>
                                <input
                                    type="text"
                                    value={shippingForm.name}
                                    onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                                    className="h-12 md:h-14 bg-white border border-neutral-base-100 rounded-xl md:rounded-2xl px-4 md:px-6 outline-none focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 font-bold text-[13px] md:text-[14px] transition-all shadow-sm placeholder:text-neutral-base-200"
                                    placeholder="Masukkan nama..."
                                />
                            </div>
                            <div className="flex flex-col gap-2 md:gap-3">
                                <div className="flex items-center gap-2 px-1">
                                    <Phone className="w-3.5 h-3.5 text-amber-800" />
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-base-900">Nomor Telepon</label>
                                </div>
                                <input
                                    type="text"
                                    value={shippingForm.phone}
                                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                                    className="h-12 md:h-14 bg-white border border-neutral-base-100 rounded-xl md:rounded-2xl px-4 md:px-6 outline-none focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 font-bold text-[13px] md:text-[14px] transition-all shadow-sm placeholder:text-neutral-base-200"
                                    placeholder="08..."
                                />
                            </div>
                            <div className="flex flex-col gap-2 md:gap-3 md:col-span-2">
                                <div className="flex items-center gap-2 px-1">
                                    <MapPin className="w-3.5 h-3.5 text-amber-800" />
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-base-900">Alamat Lengkap</label>
                                </div>
                                <textarea
                                    value={shippingForm.address}
                                    onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                                    className="min-h-[100px] md:min-h-[120px] bg-white border border-neutral-base-100 rounded-xl md:rounded-2xl p-4 md:p-6 outline-none focus:border-amber-800 focus:ring-4 focus:ring-amber-50/50 font-bold text-[13px] md:text-[14px] transition-all shadow-sm resize-none placeholder:text-neutral-base-200"
                                    placeholder="Jalan, No Rumah, RT/RW..."
                                ></textarea>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
