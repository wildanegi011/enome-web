"use client";

import { useState } from "react";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChangePassword } from "@/hooks/use-profile";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const changePasswordSchema = z.object({
    newPassword: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
});

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordForm() {
    const [showPasswords, setShowPasswords] = useState({
        new: false,
        confirm: false
    });

    const [isFocused, setIsFocused] = useState<string | null>(null);

    const changePasswordMutation = useChangePassword();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ChangePasswordValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: ""
        }
    });

    const onSubmit = (data: ChangePasswordValues) => {
        changePasswordMutation.mutate(data, {
            onSuccess: () => {
                reset();
            }
        });
    };

    const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] md:rounded-[32px] p-6 sm:p-8 md:p-12 border border-neutral-base-100 shadow-sm transition-all duration-300 hover:shadow-md"
        >
            <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-16">
                {/* Header Info */}
                <div className="lg:w-1/3 space-y-4">
                    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-neutral-base-900/5 rounded-full border border-neutral-base-900/10">
                        <Lock className="w-3.5 h-3.5 text-neutral-base-900" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-base-900">Keamanan Akun</span>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-[20px] md:text-[24px] font-black text-[#111827] leading-tight">Ubah Password</h3>
                        <p className="text-[14px] leading-relaxed text-neutral-base-500 font-medium">
                            Jaga keamanan akun Anda dengan memperbarui password secara rutin. Gunakan kombinasi yang kuat dan unik.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-[12px] font-bold text-blue-700 leading-tight">
                            Password minimal 6 karakter.
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="flex-1 max-w-xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-5">
                            {/* New Password */}
                            <div className="space-y-2.5">
                                <label className="text-[13px] font-bold text-[#111827] ml-1">Password Baru</label>
                                <div className="relative group">
                                    <div className={`absolute -inset-0.5 bg-neutral-base-900 rounded-[14px] opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${isFocused === 'newPassword' ? 'opacity-10' : ''}`} />
                                    <Input
                                        type={showPasswords.new ? "text" : "password"}
                                        {...register("newPassword")}
                                        onFocus={() => setIsFocused('newPassword')}
                                        onBlur={() => setIsFocused(null)}
                                        placeholder="Masukkan password baru"
                                        className={`relative h-13 bg-white border-neutral-base-100/80 rounded-[14px] px-5 pr-12 text-[14px] font-medium focus:border-neutral-base-900 focus:ring-0 transition-all duration-300 ${errors.newPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("new")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-base-400 hover:text-neutral-base-900 transition-colors z-10"
                                    >
                                        {showPasswords.new ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {errors.newPassword && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-[12px] text-red-500 font-bold flex items-center gap-1.5 ml-1 mt-1"
                                        >
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            {errors.newPassword.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2.5">
                                <label className="text-[13px] font-bold text-[#111827] ml-1">Konfirmasi Password Baru</label>
                                <div className="relative group">
                                    <div className={`absolute -inset-0.5 bg-neutral-base-900 rounded-[14px] opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${isFocused === 'confirmPassword' ? 'opacity-10' : ''}`} />
                                    <Input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        {...register("confirmPassword")}
                                        onFocus={() => setIsFocused('confirmPassword')}
                                        onBlur={() => setIsFocused(null)}
                                        placeholder="Ulangi password baru"
                                        className={`relative h-13 bg-white border-neutral-base-100/80 rounded-[14px] px-5 pr-12 text-[14px] font-medium focus:border-neutral-base-900 focus:ring-0 transition-all duration-300 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("confirm")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-base-400 hover:text-neutral-base-900 transition-colors z-10"
                                    >
                                        {showPasswords.confirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {errors.confirmPassword && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-[12px] text-red-500 font-bold flex items-center gap-1.5 ml-1 mt-1"
                                        >
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            {errors.confirmPassword.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex pt-4">
                            <AnimatePresence mode="wait">
                                <Button
                                    key={changePasswordMutation.isPending ? "loading" : "idle"}
                                    type="submit"
                                    disabled={changePasswordMutation.isPending}
                                    className="h-12 md:h-13 px-10 bg-[#111827] text-white rounded-2xl text-[14px] font-bold shadow-xl shadow-gray-900/10 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full flex items-center justify-center gap-3 group"
                                >
                                    {changePasswordMutation.isPending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <span>Simpan Password Baru</span>
                                            <motion.div
                                                animate={{ x: [0, 4, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                            >
                                                <Lock className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            </motion.div>
                                        </>
                                    )}
                                </Button>
                            </AnimatePresence>
                        </div>
                    </form>
                </div>
            </div>
        </motion.div>
    );
}
