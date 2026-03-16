"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const resetPasswordSchema = z.object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password tidak cocok"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const { resetPassword, verifyResetToken } = useAuth();

    const [isVerifying, setIsVerifying] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        const checkToken = async () => {
            if (!token) {
                router.push("/reset-password-expired?type=invalid");
                return;
            }
            try {
                const res = await verifyResetToken(token);
                if (!res.valid) {
                    router.push(`/reset-password-expired?type=${res.type || "invalid"}`);
                    return;
                }
                setIsVerifying(false);
            } catch (err) {
                toast.error("Terjadi kesalahan teknis");
                router.push("/reset-password-expired?type=invalid");
            }
        };
        checkToken();
    }, [token, verifyResetToken, router]);

    const onSubmit = async (values: ResetPasswordValues) => {
        if (!token) return;
        try {
            await resetPassword({
                token,
                password: values.password,
            });
            setIsSuccess(true);
            toast.success("Kata sandi diperbarui!");
            setTimeout(() => router.push("/login"), 3000);
        } catch (error: any) {
            toast.error(error.message || "Gagal mengatur ulang kata sandi");
        }
    };

    if (isVerifying) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center space-y-6 bg-[#FAF9F6]">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-neutral-base-900 opacity-20" />
                    <motion.div 
                        className="absolute inset-0 border-t-2 border-neutral-base-900 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                </div>
                <div className="space-y-2 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-base-900 animate-pulse">Memverifikasi Keamanan</p>
                    <p className="text-[9px] font-medium italic text-neutral-base-400">Mohon tunggu sebentar...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FAF9F6] px-4 py-12 text-center">
            {/* Background Decorative Batik Patterns */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-5">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute -top-1/4 -left-1/4 rotate-12 transform scale-150">
                    <defs>
                        <pattern id="batik-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                            <path d="M100 0 L200 100 L100 200 L0 100 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                            <circle cx="100" cy="100" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
                            <path d="M50 50 L150 150 M150 50 L50 150" stroke="currentColor" strokeWidth="0.5" />
                            <circle cx="50" cy="50" r="5" fill="currentColor" />
                            <circle cx="150" cy="50" r="5" fill="currentColor" />
                            <circle cx="50" cy="150" r="5" fill="currentColor" />
                            <circle cx="150" cy="150" r="5" fill="currentColor" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#batik-pattern)" />
                </svg>
            </div>

            <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-200/50 blur-[120px] opacity-50" />

            <div className="relative z-10 w-full max-w-[450px] space-y-8">
                {isSuccess ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.08)] border border-neutral-base-100/50 space-y-6"
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-lg sm:text-xl font-bold text-neutral-base-900 uppercase tracking-tight text-center">Sukses!</h4>
                            <p className="text-neutral-base-500 text-xs sm:text-sm leading-relaxed text-center">
                                Kata sandi Anda telah berhasil diperbarui. Halaman akan dialihkan secara otomatis.
                            </p>
                        </div>
                        <Button asChild className="w-full h-14 bg-neutral-base-900 hover:bg-neutral-base-800 text-white rounded-2xl uppercase tracking-[0.2em] text-[10px] font-bold shadow-lg shadow-neutral-base-900/10 transition-all">
                            <Link href="/login">Kembali ke Masuk</Link>
                        </Button>
                    </motion.div>
                ) : (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <Link href="/" className="inline-block mb-4">
                                <span className="text-3xl font-bold tracking-tighter text-neutral-base-900 uppercase">Énome</span>
                            </Link>
                            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-base-900 tracking-tight text-center">
                                Atur Ulang Kata Sandi
                            </h2>
                            <p className="text-neutral-base-500 text-base leading-relaxed text-center">
                                Masukkan kata sandi baru untuk mengamankan kembali akun Énome Anda.
                            </p>
                        </motion.div>

                        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.08)] border border-neutral-base-100/50">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-left">
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1 text-left">
                                                    <FormLabel className="ml-1 text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400">
                                                        Password Baru
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Lock className={cn(
                                                                "absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-all duration-300",
                                                                form.formState.errors.password ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                                            )} />
                                                            <Input
                                                                type={showPassword ? "text" : "password"}
                                                                placeholder="••••••••"
                                                                className={cn(
                                                                    "h-14 rounded-2xl border-neutral-base-200 bg-neutral-base-50/50 pl-12 pr-12 text-base transition-all focus:border-neutral-base-900 focus:bg-white focus:ring-4 focus:ring-neutral-base-900/5 placeholder:text-neutral-base-300 shadow-sm",
                                                                    form.formState.errors.password && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                                                )}
                                                                {...field}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-base-300 hover:text-neutral-base-900 transition-colors"
                                                            >
                                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="ml-1 mt-0.5 text-[11px] font-medium text-red-500" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1 text-left">
                                                    <FormLabel className="ml-1 text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400">
                                                        Konfirmasi Password Baru
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Lock className={cn(
                                                                "absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-all duration-300",
                                                                form.formState.errors.confirmPassword ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                                            )} />
                                                            <Input
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                placeholder="••••••••"
                                                                className={cn(
                                                                    "h-14 rounded-2xl border-neutral-base-200 bg-neutral-base-50/50 pl-12 pr-12 text-base transition-all focus:border-neutral-base-900 focus:bg-white focus:ring-4 focus:ring-neutral-base-900/5 placeholder:text-neutral-base-300 shadow-sm",
                                                                    form.formState.errors.confirmPassword && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                                                )}
                                                                {...field}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-base-300 hover:text-neutral-base-900 transition-colors"
                                                            >
                                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="ml-1 mt-0.5 text-[11px] font-medium text-red-500" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={form.formState.isSubmitting}
                                        className="h-14 w-full rounded-2xl bg-neutral-base-900 font-bold uppercase tracking-[0.2em] text-xs text-white shadow-xl shadow-neutral-base-900/10 transition-all hover:bg-neutral-base-800 hover:shadow-neutral-base-900/20 group"
                                    >
                                        {form.formState.isSubmitting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Ubah Kata Sandi
                                                <motion.span
                                                    animate={{ x: [0, 5, 0] }}
                                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                                >
                                                    →
                                                </motion.span>
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Link href="/login" className="inline-flex items-center gap-2 font-bold text-neutral-base-900 transition-colors hover:text-neutral-base-700 group">
                                Kembali ke Halaman Masuk
                            </Link>
                        </motion.div>
                    </>
                )}
            </div>

            <div className="absolute bottom-12 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-base-400">
                The Art of ÉNOMÉ &copy; 2026
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen flex-col items-center justify-center space-y-6 bg-[#FAF9F6]">
                <Loader2 className="h-12 w-12 animate-spin text-neutral-base-900 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-base-900 animate-pulse">Memasang Keamanan...</p>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
