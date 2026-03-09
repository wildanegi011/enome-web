"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const forgotPasswordSchema = z.object({
    email: z.string().email("Format email tidak valid"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    const { forgotPassword } = useAuth();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isSuccess && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isSuccess, countdown]);

    const onSubmit = async (data: ForgotPasswordValues) => {
        try {
            await forgotPassword({ email: data.email });
            setIsSuccess(true);
            toast.success("Tautan pemulihan telah dikirim!");
        } catch (error: any) {
            toast.error(error.message || "Gagal mengirim tautan pemulihan");
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        setIsResending(true);
        try {
            await forgotPassword({ email: form.getValues().email });
            toast.success("Tautan pemulihan baru telah dikirim!");
            setCountdown(60); // Reset timer after success
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan sistem. Silakan coba lagi.");
        } finally {
            setIsResending(false);
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
                            {/* <Link href="/" className="inline-block mb-4">
                            <span className="text-2xl font-bold tracking-tighter text-neutral-base-900 uppercase">Énome</span>
                        </Link> */}
                            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-base-900 tracking-tight">
                                Atur Ulang Kata Sandi
                            </h2>
                            <p className="text-neutral-base-500 text-base sm:text-lg leading-relaxed">
                                {isSuccess
                                    ? "Berhasil. Silakan periksa kotak masuk Anda untuk instruksi pemulihan keamanan."
                                    : "Masukkan email terdaftar Anda untuk menerima tautan pengaturan ulang kata sandi."
                                }
                            </p>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {!isSuccess ? (
                                <motion.div
                                    key="forgot-form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                >
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                                                                    placeholder="account@domain.com"
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

                                            <motion.div variants={itemVariants}>
                                                <Button
                                                    type="submit"
                                                    disabled={form.formState.isSubmitting}
                                                    className="w-full h-14 bg-neutral-base-900 hover:bg-neutral-base-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-neutral-base-900/10 hover:shadow-neutral-base-900/20 uppercase tracking-[0.2em] text-xs group"
                                                >
                                                    {form.formState.isSubmitting ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            Kirim Email
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
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success-state"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-8"
                                >
                                    <div className="p-8 rounded-3xl bg-neutral-base-50 border border-neutral-base-100 flex flex-col items-center text-center space-y-3">
                                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-lg sm:text-xl font-bold text-neutral-base-900">Email Terkirim</h4>
                                            <p className="text-neutral-base-500 text-xs sm:text-sm leading-relaxed">
                                                Kami telah mengirimkan tautan pengaturan ulang kata sandi ke <strong>{form.getValues().email}</strong>. Silakan ikuti instruksi untuk mengamankan akun Anda.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleResend}
                                            disabled={isResending || countdown > 0}
                                            variant="link"
                                            className={cn(
                                                "font-bold uppercase tracking-wider text-xs group flex items-center gap-2",
                                                countdown > 0 ? "text-neutral-base-400 no-underline cursor-not-allowed" : "text-neutral-base-900"
                                            )}
                                        >
                                            {isResending ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Mengirim...</span>
                                                </>
                                            ) : countdown > 0 ? (
                                                `Tunggu ${countdown} detik untuk kirim ulang`
                                            ) : (
                                                "Kirim Ulang Tautan"
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div variants={itemVariants} className="text-center pt-6">
                            <Link href="/login" className="inline-flex items-center gap-2 font-bold text-neutral-base-900 hover:text-neutral-base-700 transition-colors group">
                                <motion.span
                                    whileHover={{ x: -3 }}
                                    className="text-lg"
                                >
                                    ←
                                </motion.span>
                                Kembali ke Halaman Login
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
            {/* End Main Content Card */}
        </div>
    );
}
