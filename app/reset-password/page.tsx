"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
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

const resetPasswordSchema = z.object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
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
        if (!token) {
            toast.error("Token pemulihan tidak ditemukan");
            router.push("/login");
        }
    }, [token, router]);

    const onSubmit = async (values: ResetPasswordValues) => {
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    password: values.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Gagal mengatur ulang kata sandi");
                return;
            }

            setIsSuccess(true);
            toast.success("Kata sandi berhasil diperbarui!");
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 15 }
        }
    };

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
            >
                <div className="p-8 rounded-3xl bg-neutral-base-50 border border-neutral-base-100 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xl font-bold text-neutral-base-900">Kata Sandi Diperbarui</h4>
                        <p className="text-neutral-base-500 text-sm leading-relaxed">
                            Kata sandi baru Anda telah berhasil ditetapkan. Anda kini dapat kembali masuk ke akun Anda.
                        </p>
                    </div>
                    <Button asChild className="w-full h-12 bg-neutral-base-900 hover:bg-neutral-base-800 text-white rounded-xl uppercase tracking-[0.2em] text-[10px] font-bold shadow-lg shadow-neutral-base-900/10 transition-all">
                        <Link href="/login">Kembali ke Halaman Masuk</Link>
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                    Kata Sandi Baru
                                </FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <Lock className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300",
                                            form.formState.errors.password ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                        )} />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className={cn(
                                                "h-12 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-xl transition-all pl-12 pr-12 text-base placeholder:text-neutral-base-300 shadow-sm",
                                                form.formState.errors.password && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                            )}
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-base-300 hover:text-neutral-base-900 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-[11px] font-medium text-red-500 mt-1 ml-1" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                    Konfirmasi Kata Sandi Baru
                                </FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <Lock className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300",
                                            form.formState.errors.confirmPassword ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                        )} />
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className={cn(
                                                "h-12 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-xl transition-all pl-12 pr-12 text-base placeholder:text-neutral-base-300 shadow-sm",
                                                form.formState.errors.confirmPassword && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                            )}
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-base-300 hover:text-neutral-base-900 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-[11px] font-medium text-red-500 mt-1 ml-1" />
                            </FormItem>
                        )}
                    />
                </div>

                <motion.div variants={itemVariants} className="pt-4">
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className="w-full h-14 bg-neutral-base-900 hover:bg-neutral-base-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-neutral-base-900/10 hover:shadow-neutral-base-900/20 uppercase tracking-[0.2em] text-xs group"
                    >
                        {form.formState.isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
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
                </motion.div>
            </form>
        </Form>
    );
}

export default function ResetPasswordPage() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 15 }
        }
    };

    return (
        <div className="min-h-screen flex bg-[#FAF9F6] font-sans overflow-hidden relative selection:bg-neutral-base-900/10">
            {/* Left Side - Hero Content (Consistent with Login) */}
            <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-neutral-base-950">
                <Image
                    src="/bg-login2.png"
                    alt="Luxury Interior"
                    fill
                    className="object-cover transition-transform duration-[10s] ease-out"
                    priority
                />
                <div className="absolute inset-0 bg-linear-to-tr from-neutral-base-950/80 via-neutral-base-950/40 to-transparent" />
                <div className="relative z-10 w-full h-full flex flex-col justify-end p-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="max-w-xl space-y-6"
                    >
                        <div className="w-12 h-1 bg-white" />
                        <h1 className="text-5xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                            Tentukan <span className="text-neutral-base-400">Standar Baru.</span>
                        </h1>
                        <p className="text-xl text-neutral-base-200/90 leading-relaxed font-light">
                            Mengamankan perjalanan Anda dengan protokol yang ditingkatkan dan estetika yang halus.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form Section */}
            <div className="w-full lg:w-[580px] xl:w-[680px] flex items-center justify-center p-8 md:p-12 lg:p-20 bg-white/80 backdrop-blur-sm relative border-l border-neutral-base-100 overflow-hidden">
                {/* Subtle Geometric Polish */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-neutral-base-900/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-neutral-base-900/5 rounded-full blur-3xl -ml-32 -mb-32" />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-[420px] space-y-10 relative z-10"
                >
                    <motion.div variants={itemVariants} className="space-y-4">
                        <Link href="/" className="inline-block mb-4">
                            <span className="text-2xl font-bold tracking-tighter text-neutral-base-900 uppercase">Énome</span>
                        </Link>
                        <h2 className="text-4xl font-bold text-neutral-base-900 tracking-tight">
                            Atur Ulang Kata Sandi
                        </h2>
                        <p className="text-neutral-base-500 text-lg leading-relaxed">
                            Masukkan kata sandi baru untuk mengamankan kembali akun Énome Anda.
                        </p>
                    </motion.div>

                    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-neutral-base-900 shadow-sm" /></div>}>
                        <ResetPasswordForm />
                    </Suspense>

                    <motion.div variants={itemVariants} className="text-center pt-6">
                        <Link href="/login" className="inline-flex items-center gap-2 font-bold text-neutral-base-900 hover:text-neutral-base-700 transition-colors group">
                            Kembali ke Halaman Masuk
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div >
    );
}
