"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
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
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { User as UserIcon, Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const registerSchema = z.object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const handleGoogleLogin = () => {
        setIsGoogleLoading(true);
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_KEY_ID;
        const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/auth/google`;
        const nonce = Math.random().toString(36).substring(2);
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=email%20profile&response_mode=form_post&nonce=${nonce}`;
        window.location.href = url;
    };

    const onRegister = async (data: RegisterFormValues) => {
        try {
            const payload = {
                name: data.name,
                email: data.email,
                password: data.password
            };

            await register(payload);

            setIsSuccess(true);
            toast.success("Akun berhasil dibuat! Silakan cek email Anda untuk aktivasi akun.", {
                duration: 6000,
            });

            setTimeout(() => {
                router.push("/login");
            }, 10000);
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan sistem. Silakan coba lagi.");
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
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
            <div className="w-full max-w-[1100px] bg-white rounded-none sm:rounded-[2.5rem] shadow-none sm:shadow-[0_20px_80px_-15px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col lg:flex-row h-auto lg:min-h-[850px] lg:h-auto relative z-10 border-none sm:border border-neutral-base-100/80">
                <AnimatePresence>
                    {isSuccess && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-100 bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", damping: 20 }}
                                className="space-y-6"
                            >
                                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto ring-1 ring-emerald-100">
                                    <motion.div
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 0.8, delay: 0.5 }}
                                    >
                                        <svg viewBox="0 0 24 24" className="w-12 h-12 text-emerald-600 fill-none stroke-current" strokeWidth={2.5}>
                                            <motion.path
                                                d="M20 6L9 17L4 12"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 0.6, delay: 0.4 }}
                                            />
                                        </svg>
                                    </motion.div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-bold text-neutral-base-900 tracking-tight">Pendaftaran Berhasil</h3>
                                    <p className="text-neutral-base-500 text-lg">Silakan cek email Anda untuk mengaktifkan akun sebelum login.</p>
                                    <p className="text-neutral-base-400 text-sm italic">Kami telah mengirimkan tautan aktivasi ke email terdaftar Anda.</p>
                                </div>
                                <Button
                                    onClick={() => router.push("/login")}
                                    className="w-full h-14 bg-neutral-base-900 hover:bg-neutral-base-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-neutral-base-900/10 uppercase tracking-[0.2em] text-xs"
                                >
                                    Lanjutkan ke Login
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Left Side - Hero Content */}
                <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-neutral-base-950 items-end p-12 self-stretch">
                    <Image
                        src="/bg-login2.png"
                        alt="Luxury Interior"
                        fill
                        className="object-cover transition-transform duration-[20s] ease-out hover:scale-105"
                        priority
                    />
                    {/* <div className="absolute inset-0 bg-linear-to-t from-neutral-base-950/90 via-neutral-base-950/20 to-transparent" />
                    <div className="relative z-10 w-full text-white">
                        <Link href="/" className="inline-block mb-6 group">
                            <span className="text-3xl font-bold tracking-tighter text-white uppercase group-hover:text-neutral-base-100 transition-colors">Énome</span>
                        </Link>
                        <p className="text-white/80 text-base max-w-[90%] leading-relaxed">
                            Koleksi interior mewah untuk mendefinisikan kembali ruang hidup Anda.
                        </p>
                    </div> */}
                </div>

                {/* Right Side - Form Section */}
                <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-10 md:p-12 lg:p-16 bg-white relative overflow-visible">
                    {/* Subtle Geometric Polish */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neutral-base-900/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-neutral-base-900/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="w-full max-w-[440px] space-y-10 relative z-10"
                    >
                        <motion.div variants={itemVariants} className="space-y-4">
                            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-base-900 tracking-tight">
                                Buat Akun
                            </h2>
                            <p className="text-neutral-base-500 text-base sm:text-lg leading-relaxed">
                                Mulailah perjalanan Anda dengan Énome untuk pengalaman belanja premium.
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-4">
                            <motion.button
                                whileHover={{ scale: 1.01, backgroundColor: "#f9f9f9" }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleGoogleLogin}
                                disabled={isGoogleLoading || isSuccess}
                                className="w-full h-14 rounded-2xl border border-neutral-base-200 flex items-center justify-center gap-4 bg-white transition-all shadow-sm relative group overflow-hidden"
                            >
                                {isGoogleLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-neutral-base-900" />
                                ) : (
                                    <>
                                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335" />
                                        </svg>
                                        <span className="font-semibold text-neutral-base-700 tracking-tight">Daftar dengan Google</span>
                                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-neutral-base-900/5 rounded-2xl transition-all" />
                                    </>
                                )}
                            </motion.button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-neutral-base-100" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-white px-6 text-neutral-base-400 font-bold tracking-[0.3em]">
                                        Atau lengkapi detail berikut
                                    </span>
                                </div>
                            </div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onRegister)} className="space-y-6">
                                    <div className="space-y-3">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                                        Nama
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <UserIcon className={cn(
                                                                "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300",
                                                                form.formState.errors.name ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                                            )} />
                                                            <Input
                                                                placeholder="j.edwards"
                                                                className={cn(
                                                                    "h-14 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-2xl transition-all pl-12 pr-6 text-base placeholder:text-neutral-base-300 shadow-sm",
                                                                    form.formState.errors.name && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                                                )}
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-[11px] font-medium text-red-500 mt-0.5 ml-1" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                                        Email
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Mail className={cn(
                                                                "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300",
                                                                form.formState.errors.email ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                                            )} />
                                                            <Input
                                                                type="email"
                                                                placeholder="residence@domain.com"
                                                                className={cn(
                                                                    "h-14 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-2xl transition-all pl-12 pr-6 text-base placeholder:text-neutral-base-300 shadow-sm",
                                                                    form.formState.errors.email && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                                                )}
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-[11px] font-medium text-red-500 mt-0.5 ml-1" />
                                                </FormItem>
                                            )}
                                        />


                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-5 gap-y-3">
                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1">
                                                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                                            Password
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
                                                        <div className="min-h-[16px]">
                                                            <FormMessage className="text-[11px] font-medium text-red-500 mt-0.5 ml-1" />
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="confirmPassword"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1">
                                                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                                            Konfirmasi Password
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
                                                        <div className="min-h-[16px]">
                                                            <FormMessage className="text-[11px] font-medium text-red-500 mt-0.5 ml-1" />
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <motion.div variants={itemVariants} className="pt-2">
                                        <Button
                                            type="submit"
                                            disabled={form.formState.isSubmitting || isSuccess}
                                            className="w-full h-14 bg-neutral-base-900 hover:bg-neutral-base-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-neutral-base-900/10 hover:shadow-neutral-base-900/20 uppercase tracking-[0.2em] text-xs group"
                                        >
                                            {form.formState.isSubmitting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Daftar
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

                            <motion.div variants={itemVariants} className="text-center pt-6 pb-4">
                                <p className="text-neutral-base-500 text-sm">
                                    Sudah memiliki akun?{" "}
                                    <Link href="/login" className="font-bold text-neutral-base-900 hover:text-neutral-base-700 transition-colors relative group">
                                        Login
                                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-base-900 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                                    </Link>
                                </p>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
            {/* End Main Content Card */}
        </div>
    );
}
