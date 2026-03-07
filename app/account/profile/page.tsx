"use client";

import { useState, useEffect, useRef } from "react";
import { User, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Image from "next/image";
import Navbar from "@/components/store/layout/Navbar";
import UserSidebar from "@/components/store/layout/UserSidebar";
import AccountHeader from "@/components/store/layout/AccountHeader";
import { toast } from "sonner";
import { ASSET_URL } from "@/config/config";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
    const [formData, setFormData] = useState({
        nama: "",
        brithdate: "",
        gender: 1,
        noHandphone: ""
    });
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: profile, isLoading } = useProfile();
    const updateProfileMutation = useUpdateProfile();

    useEffect(() => {
        if (profile) {
            setFormData({
                nama: profile.nama || "",
                brithdate: profile.brithdate ? format(new Date(profile.brithdate), "yyyy-MM-dd") : "",
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

        const data = new FormData();
        data.append("nama", formData.nama);
        data.append("gender", formData.gender.toString());
        data.append("brithdate", formData.brithdate);
        data.append("noHandphone", "+62" + formData.noHandphone);
        if (selectedPhoto) {
            data.append("photo", selectedPhoto);
        }

        updateProfileMutation.mutate(data, {
            onSuccess: () => {
                setSelectedPhoto(null);
                setPhotoPreview(null);
            }
        });
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
                        <AccountHeader
                            title="Profil Saya"
                            description="Kelola informasi profil Anda untuk keamanan akun ÉNOMÉ Anda."
                        />

                        <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 sm:p-8 md:p-12 border border-neutral-base-100 shadow-sm space-y-10 md:space-y-12">
                            {/* Profile Photo Section */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8">
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
                                            <User className="w-10 h-10 md:w-12 md:h-12 text-neutral-base-200" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-[16px] font-bold text-[#111827]">Foto Profil</h3>
                                        <p className="text-[12px] md:text-[13px] text-neutral-base-400 font-medium">Maksimal 2MB. Format JPG, PNG, atau GIF.</p>
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
                                        className="h-9 md:h-10 px-6 bg-[#111827] text-white rounded-xl text-[11px] md:text-[12px] font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10"
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
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full h-12 justify-start text-left font-medium text-[14px] bg-white border-neutral-base-100/60 rounded-xl px-4 focus:ring-4 focus:ring-gray-900/5 transition-all",
                                                        !formData.brithdate && "text-neutral-base-400"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-neutral-base-400" />
                                                    {formData.brithdate ? format(new Date(formData.brithdate), "dd MMMM yyyy", { locale: id }) : <span>Pilih Tanggal</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-neutral-base-100 shadow-2xl" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={formData.brithdate ? new Date(formData.brithdate) : undefined}
                                                    onSelect={(date) => setFormData({ ...formData, brithdate: date ? format(date, "yyyy-MM-dd") : "" })}
                                                    captionLayout="dropdown"
                                                    startMonth={new Date(1900, 0)}
                                                    endMonth={new Date(new Date().getFullYear(), 11)}
                                                    className="p-3"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="space-y-3">
                                        <label className="text-[13px] font-bold text-[#111827]">Jenis Kelamin</label>
                                        <RadioGroup
                                            value={formData.gender.toString()}
                                            onValueChange={(val) => setFormData({ ...formData, gender: parseInt(val) })}
                                            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                                        >
                                            <div
                                                className={cn(
                                                    "flex items-center space-x-3 bg-white border rounded-xl px-4 py-3 cursor-pointer transition-all flex-1",
                                                    formData.gender === 1 ? "border-amber-800 bg-amber-50/10 shadow-sm" : "border-neutral-base-100 hover:bg-neutral-base-50"
                                                )}
                                            >
                                                <RadioGroupItem value="1" id="gender-male" className="border-neutral-base-300 text-amber-800" />
                                                <Label htmlFor="gender-male" className="font-bold text-[13px] cursor-pointer w-full py-1 text-neutral-base-900">Laki-laki</Label>
                                            </div>
                                            <div
                                                className={cn(
                                                    "flex items-center space-x-3 bg-white border rounded-xl px-4 py-3 cursor-pointer transition-all flex-1",
                                                    formData.gender === 2 ? "border-amber-800 bg-amber-50/10 shadow-sm" : "border-neutral-base-100 hover:bg-neutral-base-50"
                                                )}
                                            >
                                                <RadioGroupItem value="2" id="gender-female" className="border-neutral-base-300 text-amber-800" />
                                                <Label htmlFor="gender-female" className="font-bold text-[13px] cursor-pointer w-full py-1 text-neutral-base-900">Perempuan</Label>
                                            </div>
                                        </RadioGroup>
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
                                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 pt-10">
                                    <Button
                                        type="submit"
                                        disabled={updateProfileMutation.isPending}
                                        className="h-11 md:h-12 px-10 bg-[#111827] text-white rounded-xl text-[13px] md:text-[14px] font-bold shadow-xl shadow-gray-900/10 hover:bg-gray-800 transition-all w-full sm:min-w-[140px] sm:w-auto flex items-center justify-center gap-2"
                                    >
                                        {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Simpan Perubahan
                                    </Button>
                                </div>
                            </form >
                        </div >
                    </div >
                </div >
            </main >
        </div >
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
                        <div className="bg-white rounded-[32px] p-5 sm:p-8 md:p-12 border border-neutral-base-100 shadow-sm space-y-12">
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
