"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Mail, Phone, Lock, Save,
    Home, Camera, Shield, ChevronRight,
    Loader2, CheckCircle2, Hash, Store,
    Award, Ticket, Info, AlertCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/store/Navbar";
import UserSidebar from "@/components/store/UserSidebar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ASSET_URL } from "@/config/config";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ProfileData {
    id: number;
    username: string;
    email: string;
    nama: string;
    kodeCustomer: string;
    namaTipeCustomer: string;
    namaToko: string;
    noHandphone: string;
    gender: number;
    brithdate: string | null;
    photo: string | null;
    urlphoto: string | null;
    vouchers: any[];
}

export default function ProfilePage() {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        nama: "",
        brithdate: "",
        gender: 1,
        noHandphone: ""
    });
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: profile, isLoading } = useQuery<ProfileData>({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const res = await fetch("/api/user/profile");
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        }
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                nama: profile.nama || "",
                brithdate: profile.brithdate ? new Date(profile.brithdate).toISOString().split('T')[0] : "",
                gender: profile.gender || 1,
                noHandphone: profile.noHandphone?.replace(/^(\+62|62|0)/, "") || ""
            });
        }
    }, [profile]);

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Ukuran foto maksimal 2MB");
                return;
            }
            setSelectedPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const data = new FormData();
            data.append("nama", formData.nama);
            data.append("gender", formData.gender.toString());
            data.append("brithdate", formData.brithdate);
            data.append("noHandphone", "+62" + formData.noHandphone);
            if (selectedPhoto) {
                data.append("photo", selectedPhoto);
            }

            const response = await fetch("/api/user/profile", {
                method: "POST",
                body: data,
            });

            if (!response.ok) throw new Error("Gagal memperbarui profil");

            toast.success("Profil berhasil diperbarui");
            queryClient.invalidateQueries({ queryKey: ["user-profile"] });
            setSelectedPhoto(null);
            setPhotoPreview(null);
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans text-neutral-base-900">
            <Navbar />

            <main className="max-w-[1340px] mx-auto px-4 md:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="hidden lg:block">
                        <UserSidebar />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Mockup Header */}
                        <div className="mb-10">
                            <h1 className="text-[32px] font-black text-[#111827] tracking-tight mb-2">Profile Saya</h1>
                            <p className="text-[14px] text-neutral-base-400 font-medium">Kelola informasi profil Anda untuk keamanan akun ÉNOMÉ Anda.</p>
                        </div>

                        <div className="bg-white rounded-[32px] p-8 md:p-12 border border-neutral-base-100 shadow-sm space-y-12">
                            {/* Profile Photo Section */}
                            <div className="flex items-center gap-8">
                                <div className="relative group">
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-neutral-base-50 flex items-center justify-center">
                                        {photoPreview ? (
                                            <Image
                                                src={photoPreview}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (profile?.urlphoto || profile?.photo) ? (
                                            <Image
                                                src={profile.urlphoto || `${ASSET_URL}/img/user/${profile.photo}`}
                                                alt={profile.nama || "Profile"}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <User className="w-12 h-12 text-neutral-base-200" />
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-[16px] font-bold text-[#111827]">Foto Profil</h3>
                                        <p className="text-[13px] text-neutral-base-400 font-medium mt-1">Maksimal 2MB. Format JPG, PNG, atau GIF.</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handlePhotoClick}
                                        className="h-10 px-6 bg-[#111827] text-white rounded-xl text-[12px] font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10"
                                    >
                                        Ubah Foto
                                    </Button>
                                </div>
                            </div>

                            {/* Form Grid */}
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                    {/* Row 1 */}
                                    <div className="space-y-3">
                                        <label className="text-[13px] font-bold text-[#111827]">Nama Lengkap</label>
                                        <Input
                                            value={formData.nama}
                                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                            placeholder="Nama Lengkap"
                                            className="h-12 bg-white border-neutral-base-100/60 rounded-xl px-4 text-[14px] font-medium focus:ring-4 focus:ring-gray-900/5 transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[13px] font-bold text-[#111827]">Tanggal Lahir</label>
                                        <Input
                                            type="date"
                                            value={formData.brithdate}
                                            onChange={(e) => setFormData({ ...formData, brithdate: e.target.value })}
                                            className="h-12 bg-white border-neutral-base-100/60 rounded-xl px-4 text-[14px] font-medium focus:ring-4 focus:ring-gray-900/5 transition-all"
                                        />
                                    </div>

                                    {/* Row 2 */}
                                    <div className="space-y-3">
                                        <label className="text-[13px] font-bold text-[#111827]">Jenis Kelamin</label>
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, gender: 1 })}
                                                className={cn(
                                                    "flex-1 h-12 rounded-xl text-[13px] font-bold transition-all",
                                                    formData.gender === 1
                                                        ? "bg-[#111827] text-white shadow-lg shadow-gray-900/10"
                                                        : "bg-white text-neutral-base-500 border border-neutral-base-100 hover:bg-neutral-base-50"
                                                )}
                                            >
                                                Laki-laki
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, gender: 2 })}
                                                className={cn(
                                                    "flex-1 h-12 rounded-xl text-[13px] font-bold transition-all",
                                                    formData.gender === 2
                                                        ? "bg-[#111827] text-white shadow-lg shadow-gray-900/10"
                                                        : "bg-white text-neutral-base-500 border border-neutral-base-100 hover:bg-neutral-base-50"
                                                )}
                                            >
                                                Perempuan
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[13px] font-bold text-[#111827]">Email</label>
                                        <Input
                                            value={profile?.email || ""}
                                            disabled
                                            className="h-12 bg-neutral-base-50 border-neutral-base-100/60 rounded-xl px-4 text-[14px] font-medium opacity-60 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Row 3 - Phone Number */}
                                    <div className="space-y-3 md:col-span-1">
                                        <label className="text-[13px] font-bold text-[#111827]">Nomor HP</label>
                                        <div className="flex gap-3">
                                            <div className="h-12 px-4 flex items-center bg-neutral-base-50 border border-neutral-base-100 rounded-xl text-[14px] font-bold text-neutral-base-500">
                                                +62
                                            </div>
                                            <Input
                                                value={formData.noHandphone}
                                                onChange={(e) => setFormData({ ...formData, noHandphone: e.target.value.replace(/^0/, "").replace(/\D/g, "") })}
                                                placeholder="8123456789"
                                                className="h-12 bg-white border-neutral-base-100/60 rounded-xl px-4 text-[14px] font-medium flex-1 focus:ring-4 focus:ring-gray-900/5 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Action Buttons */}
                                <div className="flex items-center justify-end gap-4 pt-10">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 px-10 border-neutral-base-100 rounded-xl text-[14px] font-bold hover:bg-neutral-base-50 transition-all min-w-[140px]"
                                    >
                                        Batalkan
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="h-12 px-10 bg-[#111827] text-white rounded-xl text-[14px] font-bold shadow-xl shadow-gray-900/10 hover:bg-gray-800 transition-all min-w-[140px]"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("text-[10px] font-black uppercase tracking-widest border rounded-full px-2 py-0.5", className)}>
            {children}
        </span>
    );
}

function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <Navbar />
            <main className="max-w-[1340px] mx-auto px-4 md:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="hidden lg:block w-[280px] shrink-0">
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-xl" />
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 space-y-10">
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-48" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                        <div className="bg-white rounded-[32px] p-8 md:p-12 border border-neutral-base-100 shadow-sm space-y-12">
                            <div className="flex items-center gap-8">
                                <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full" />
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-10 w-28 rounded-xl" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="space-y-3">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
