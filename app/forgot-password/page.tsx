"use client";

import { useState } from "react";
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

    const [isSuccess, setIsSuccess] = useState(false);

    const onSubmit = async (data: ForgotPasswordValues) => {
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email }),
            });

            const result = await res.json();

            if (!res.ok) {
                toast.error(result.error || "Gagal mengirim tautan pemulihan");
                return;
            }

            setIsSuccess(true);
            toast.success("Tautan pemulihan telah dikirim!");
        } catch (error: any) {
            toast.error("Terjadi kesalahan sistem. Silakan coba lagi.");
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
            {/* Left Side - Hero Content (Consistent with Login) */}
            <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-neutral-base-950">
                <Image
                    src="/bg-login.png"
                    alt="Luxury Interior"
                    fill
                    className="object-cover transition-transform duration-[10s] ease-out"
                    priority
                />
                {/* <div className="absolute inset-0 bg-linear-to-tr from-neutral-base-950/80 via-neutral-base-950/40 to-transparent" /> */}
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
                        {/* <Link href="/" className="inline-block mb-4">
                            <span className="text-2xl font-bold tracking-tighter text-neutral-base-900 uppercase">Énome</span>
                        </Link> */}
                        <h2 className="text-4xl font-bold text-neutral-base-900 tracking-tight">
                            Atur Ulang Kata Sandi
                        </h2>
                        <p className="text-neutral-base-500 text-lg leading-relaxed">
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
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                                        Email Terdaftar
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Mail className={cn(
                                                                "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300",
                                                                form.formState.errors.email ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                                            )} />
                                                            <Input
                                                                type="email"
                                                                placeholder="email@anda.com"
                                                                className={cn(
                                                                    "h-12 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-xl transition-all pl-12 pr-6 text-base placeholder:text-neutral-base-300 shadow-sm",
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
                                <div className="p-8 rounded-3xl bg-neutral-base-50 border border-neutral-base-100 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-bold text-neutral-base-900">Email Terkirim</h4>
                                        <p className="text-neutral-base-500 text-sm leading-relaxed">
                                            Kami telah mengirimkan tautan pengaturan ulang kata sandi ke <strong>{form.getValues().email}</strong>. Silakan ikuti instruksi untuk mengamankan akun Anda.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setIsSuccess(false)}
                                        variant="link"
                                        className="text-neutral-base-900 font-bold uppercase tracking-wider text-xs"
                                    >
                                        Kirim Ulang Tautan
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
    );
}
