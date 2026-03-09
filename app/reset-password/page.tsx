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
import { useAuth } from "@/hooks/use-auth";

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
    const { resetPassword } = useAuth();
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
        if (!token) return;
        try {
            await resetPassword({
                token,
                password: values.password,
            });

            setIsSuccess(true);
            toast.success("Kata sandi berhasil diperbarui!");
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (error: any) {
            toast.error(error.message || "Gagal mengatur ulang kata sandi");
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
                    <div className="space-y-3">
                        <h4 className="text-lg sm:text-xl font-bold text-neutral-base-900">Kata Sandi Diperbarui</h4>
                        <p className="text-neutral-base-500 text-xs sm:text-sm leading-relaxed">
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
                            <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                    Password Baru
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
                                                "h-14 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-2xl transition-all pl-12 pr-12 text-base placeholder:text-neutral-base-300 shadow-sm",
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
                                <FormMessage className="text-[11px] font-medium text-red-500 mt-0.5 ml-1" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                    Konfirmasi Password Baru
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
                                                "h-14 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-2xl transition-all pl-12 pr-12 text-base placeholder:text-neutral-base-300 shadow-sm",
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
                                <FormMessage className="text-[11px] font-medium text-red-500 mt-0.5 ml-1" />
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
        <div className="min-h-screen flex flex-col items-center justify-start lg:justify-center p-0 sm:p-8 md:p-12 bg-[#FAF9F6] font-montserrat overflow-x-hidden relative selection:bg-neutral-base-900/10">
            {/* Main Content Card */}
            <div className="w-full max-w-[1100px] bg-white rounded-none sm:rounded-[2.5rem] shadow-none sm:shadow-[0_20px_80px_-15px_rgba(0,0,0,0.08)] overflow-hidden flex h-auto lg:h-[720px] lg:max-h-[95vh] relative z-10 border-none sm:border border-neutral-base-100/80">

                {/* Left Side - Hero Content */}
                <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-neutral-base-950 items-end p-12">
                    <Image
                        src="/bg-login2.png"
                        alt="Luxury Interior"
                        fill
                        className="object-cover transition-transform duration-[20s] ease-out hover:scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-neutral-base-950/90 via-neutral-base-950/20 to-transparent" />
                    <div className="relative z-10 w-full text-white">
                        <Link href="/" className="inline-block mb-6 group">
                            <span className="text-3xl font-bold tracking-tighter text-white uppercase group-hover:text-neutral-base-100 transition-colors">Énome</span>
                        </Link>
                        <p className="text-white/80 text-base max-w-[90%] leading-relaxed">
                            Koleksi interior mewah untuk mendefinisikan kembali ruang hidup Anda.
                        </p>
                    </div>
                </div>

                {/* Right Side - Form Section */}
                <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-8 md:p-10 bg-white relative overflow-visible">
                    {/* Subtle Geometric Polish */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neutral-base-900/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-neutral-base-900/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="w-full max-w-[420px] space-y-8 relative z-10"
                    >
                        <motion.div variants={itemVariants} className="space-y-4">
                            <Link href="/" className="inline-block mb-4">
                                <span className="text-2xl font-bold tracking-tighter text-neutral-base-900 uppercase">Énome</span>
                            </Link>
                            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-base-900 tracking-tight">
                                Atur Ulang Kata Sandi
                            </h2>
                            <p className="text-neutral-base-500 text-base sm:text-lg leading-relaxed">
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
                {/* End Main Content Card */}
            </div>
        </div>
    );
}
