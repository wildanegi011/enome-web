"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Script from "next/script";
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
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const handleGoogleCallback = async (response: any) => {
        setIsGoogleLoading(true);
        try {
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
            });

            if (!res.ok) throw new Error("Gagal login dengan Google");

            const data = await res.json();

            if (data.requiresVerification) {
                setIsSuccess(true);
                toast.success(data.message || "Akun berhasil dibuat! Silakan cek email Anda untuk aktivasi.", {
                    duration: 6000,
                });
                // Let the success state show for a bit, no redirect needed since they are on login 
                // but we could just stay here or reload
                setTimeout(() => {
                    window.location.reload();
                }, 10000);
                return;
            }

            setIsSuccess(true);
            toast.success("Berhasil masuk dengan Google!");

            await queryClient.invalidateQueries({ queryKey: ["auth-me"] });

            setTimeout(() => {
                router.push("/");
            }, 1200);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        if (typeof window !== "undefined" && (window as any).google) {
            (window as any).google.accounts.id.prompt();
        }
    };

    const onLogin = async (data: LoginFormValues) => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });
            const result = await res.json();

            if (!res.ok || result.msg !== "success") {
                throw new Error(result.pesan || "Login failed");
            }

            setIsSuccess(true);
            toast.success("Selamat datang kembali!");

            await queryClient.invalidateQueries({ queryKey: ["auth-me"] });

            setTimeout(() => {
                router.push("/");
            }, 1200);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

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
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => {
                    if ((window as any).google) {
                        (window as any).google.accounts.id.initialize({
                            client_id: process.env.NEXT_PUBLIC_GOOGLE_KEY_ID,
                            callback: handleGoogleCallback,
                            ux_mode: 'popup',
                        });
                        (window as any).google.accounts.id.renderButton(
                            document.getElementById("google-hidden-btn"),
                            { theme: "outline", size: "large", width: "100%" }
                        );
                    }
                }}
            />

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
                                <h3 className="text-3xl font-bold text-neutral-base-900 tracking-tight">Otentikasi Berhasil</h3>
                                <p className="text-neutral-base-500 text-lg">Mempersiapkan pengalaman belanja eksklusif Anda...</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left Side - Hero Content */}
            <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-neutral-base-950">
                <Image
                    src="/bg-login2.png"
                    alt="Luxury Interior"
                    fill
                    className="object-cover transition-transform duration-[10s] ease-out"
                    priority
                />
                {/* <div className="absolute inset-0 bg-linear-to-tr from-neutral-base-950/80 via-neutral-base-950/40 to-transparent" /> */}
            </div>

            {/* Right Side - Form Section */}
            <div className="w-full lg:w-[580px] xl:w-[680px] flex items-center justify-center p-8 md:p-12 lg:p-20 bg-white/80 backdrop-blur-sm relative border-l border-neutral-base-100">
                {/* Subtle Geometric Polish */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-neutral-base-900/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-neutral-base-900/5 rounded-full blur-3xl -ml-32 -mb-32" />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-[440px] space-y-12 relative z-10"
                >
                    <motion.div variants={itemVariants} className="space-y-4">
                        {/* <Link href="/" className="inline-block mb-8">
                            <span className="text-2xl font-bold tracking-tighter text-neutral-base-900 uppercase">Énome</span>
                        </Link> */}
                        <h2 className="text-4xl font-bold text-neutral-base-900 tracking-tight">
                            Selamat Datang Kembali
                        </h2>
                        <p className="text-neutral-base-500 text-lg leading-relaxed">
                            Masuk untuk melanjutkan perjalanan belanja eksklusif Anda.
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-8">
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
                                    <span className="font-semibold text-neutral-base-700 tracking-tight">Lanjutkan dengan Google</span>
                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-neutral-base-900/5 rounded-2xl transition-all" />
                                </>
                            )}
                            <div id="google-hidden-btn" className="absolute inset-0 opacity-0 pointer-events-none" />
                        </motion.button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-neutral-base-100" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-white px-6 text-neutral-base-400 font-bold tracking-[0.3em]">
                                    Atau masuk menggunakan email
                                </span>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onLogin)} className="space-y-6">
                                <div className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
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
                                                            placeholder="yourname@domain.com"
                                                            className={cn(
                                                                "h-14 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-2xl transition-all pl-12 pr-6 text-base placeholder:text-neutral-base-300 shadow-sm",
                                                                form.formState.errors.email && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                                            )}
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-[11px] font-medium text-red-500 mt-1 ml-1" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <div className="flex items-center justify-between px-1">
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400">
                                                        Password
                                                    </FormLabel>
                                                    <Link href="/forgot-password" virtual-id="forgot-password" className="text-[10px] font-bold text-neutral-base-500 hover:text-neutral-base-900 transition-colors uppercase tracking-widest underline underline-offset-4 decoration-neutral-base-200">
                                                        Lupa Password?
                                                    </Link>
                                                </div>
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
                                                                "h-14 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-2xl transition-all pl-12 pr-14 text-base placeholder:text-neutral-base-300 shadow-sm",
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
                                </div>

                                <motion.div variants={itemVariants} className="pt-4">
                                    <Button
                                        type="submit"
                                        disabled={form.formState.isSubmitting || isSuccess}
                                        className="w-full h-14 bg-neutral-base-900 hover:bg-neutral-base-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-neutral-base-900/10 hover:shadow-neutral-base-900/20 uppercase tracking-[0.2em] text-xs group"
                                    >
                                        {form.formState.isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Login
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

                        <motion.div variants={itemVariants} className="text-center pt-8">
                            <p className="text-neutral-base-500 text-sm">
                                Belum punya akun?{" "}
                                <Link href="/register" className="font-bold text-neutral-base-900 hover:text-neutral-base-700 transition-colors relative group">
                                    Daftar Sekarang
                                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-base-900 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                                </Link>
                            </p>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
