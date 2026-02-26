"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
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
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Phone, User as UserIcon, Mail, Lock, Loader2, Navigation2, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

interface LocationResult {
    label: string;
    province: string;
    provinceId: string;
    city: string;
    cityId: string;
    subdistrict: string;
    subdistrictId: string;
}

const registerSchema = z.object({
    username: z.string().min(3, "Username minimal 3 karakter"),
    nama_lengkap: z.string().min(2, "Nama lengkap minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    no_hp: z.string().min(10, "Nomor HP minimal 10 digit").regex(/^[0-9]+$/, "Nomor HP hanya boleh berisi angka"),
    lokasi: z.any().refine((val) => val && val.subdistrictId, "Silakan pilih lokasi"),
    alamat_lengkap: z.string().min(5, "Alamat lengkap minimal 5 karakter"),
    kode_pos: z.string().length(5, "Kode pos harus 5 digit"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [locationQuery, setLocationQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const locationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const { data: locations = [], isLoading: isSearching } = useQuery<LocationResult[]>({
        queryKey: ["locations", locationQuery],
        queryFn: async () => {
            if (locationQuery.length < 2) return [];
            const res = await fetch(`/api/locations?q=${encodeURIComponent(locationQuery)}`);
            if (!res.ok) throw new Error("Failed to fetch locations");
            const data = await res.json();
            return data.locations as LocationResult[];
        },
        enabled: locationQuery.length >= 2,
    });

    const handleSelectLocation = (loc: LocationResult) => {
        form.setValue("lokasi", loc);
        setLocationQuery(loc.label);
        setShowResults(false);
    };

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            nama_lengkap: "",
            email: "",
            no_hp: "",
            lokasi: null as any,
            alamat_lengkap: "",
            kode_pos: "",
            password: "",
            confirmPassword: "",
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

            setIsSuccess(true);
            toast.success("Berhasil masuk dengan Google!");

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

    const onRegister = async (data: RegisterFormValues) => {
        try {
            const loc = data.lokasi as LocationResult;
            const payload = {
                ...data,
                provinsi: loc.provinceId,
                kota: loc.cityId,
                kecamatan: loc.subdistrictId
            };

            const res = await fetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            });
            const result = await res.json();

            if (!res.ok) throw new Error(result.error || "Registration failed");

            setIsSuccess(true);
            toast.success(result.message || "Akun berhasil dibuat! Silakan cek email Anda untuk aktivasi akun.", {
                duration: 6000,
            });

            setTimeout(() => {
                router.push("/login");
            }, 10000);
        } catch (error: any) {
            toast.error(error.message);
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
            <div className="w-full lg:w-[580px] xl:w-[680px] flex items-center justify-center p-8 md:p-12 lg:p-20 bg-white/80 backdrop-blur-sm relative border-l border-neutral-base-100 overflow-y-auto no-scrollbar">
                {/* Subtle Geometric Polish */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-neutral-base-900/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-neutral-base-900/5 rounded-full blur-3xl -ml-32 -mb-32" />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-[540px] space-y-10 relative z-10 my-auto"
                >
                    <motion.div variants={itemVariants} className="space-y-4">
                        {/* <Link href="/" className="inline-block mb-4">
                            <span className="text-2xl font-bold tracking-tighter text-neutral-base-900 uppercase">Énome</span>
                        </Link> */}
                        <h2 className="text-4xl font-bold text-neutral-base-900 tracking-tight">
                            Buat Akun
                        </h2>
                        <p className="text-neutral-base-500 text-lg leading-relaxed">
                            Mulailah perjalanan Anda dengan Énome untuk pengalaman belanja premium.
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-6">
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
                            <div id="google-hidden-btn" className="absolute inset-0 opacity-0 pointer-events-none" />
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
                            <form onSubmit={form.handleSubmit(onRegister)} className="space-y-5">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="username"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                                        Username
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <UserIcon className={cn(
                                                                "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300",
                                                                form.formState.errors.username ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                                            )} />
                                                            <Input
                                                                placeholder="j.edwards"
                                                                className={cn(
                                                                    "h-12 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-xl transition-all pl-12 pr-6 text-base placeholder:text-neutral-base-300 shadow-sm",
                                                                    form.formState.errors.username && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
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
                                            name="nama_lengkap"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                                        Nama Lengkap
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <UserIcon className={cn(
                                                                "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300",
                                                                form.formState.errors.nama_lengkap ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                                            )} />
                                                            <Input
                                                                placeholder="Jonathan Edwards"
                                                                className={cn(
                                                                    "h-12 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-xl transition-all pl-12 pr-6 text-base placeholder:text-neutral-base-300 shadow-sm",
                                                                    form.formState.errors.nama_lengkap && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                                                )}
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-[11px] font-medium text-red-500 mt-1 ml-1" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
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

                                        <FormField
                                            control={form.control}
                                            name="no_hp"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                                        No. Handphone
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Phone className={cn(
                                                                "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300",
                                                                form.formState.errors.no_hp ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                                            )} />
                                                            <Input
                                                                type="tel"
                                                                placeholder="0812..."
                                                                className={cn(
                                                                    "h-12 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-xl transition-all pl-12 pr-6 text-base placeholder:text-neutral-base-300 shadow-sm",
                                                                    form.formState.errors.no_hp && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                                                )}
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-[11px] font-medium text-red-500 mt-1 ml-1" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="lokasi"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5 relative" ref={locationRef}>
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                                    Provinsi, Kota, Kecamatan
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Search className={cn(
                                                            "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300",
                                                            form.formState.errors.lokasi ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                                        )} />
                                                        <Input
                                                            placeholder="Cari lokasi..."
                                                            autoComplete="off"
                                                            value={locationQuery}
                                                            onChange={(e) => {
                                                                setLocationQuery(e.target.value);
                                                                setShowResults(true);
                                                                if (e.target.value === "") {
                                                                    field.onChange(null);
                                                                }
                                                            }}
                                                            onFocus={() => setShowResults(true)}
                                                            className={cn(
                                                                "h-12 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-xl transition-all pl-12 pr-6 text-base placeholder:text-neutral-base-300 shadow-sm",
                                                                form.formState.errors.lokasi && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                                            )}
                                                        />
                                                        {isSearching && (
                                                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral-base-400" />
                                                        )}
                                                    </div>
                                                </FormControl>

                                                <AnimatePresence>
                                                    {showResults && locationQuery.length >= 2 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                                            className="absolute top-full left-0 z-60 w-full mt-2 bg-white border border-neutral-base-100 rounded-2xl shadow-xl max-h-[220px] overflow-y-auto no-scrollbar py-2"
                                                        >
                                                            {locations.length > 0 ? (
                                                                locations.map((loc, i) => (
                                                                    <button
                                                                        key={i}
                                                                        type="button"
                                                                        onClick={() => handleSelectLocation(loc)}
                                                                        className="w-full px-6 py-3 text-left hover:bg-neutral-base-50 transition-all flex items-center justify-between group border-b last:border-0 border-neutral-base-50/50"
                                                                    >
                                                                        <div className="flex items-center gap-4">
                                                                            <Navigation2 className="w-4 h-4 text-neutral-base-300 group-hover:text-neutral-base-900 transition-colors" />
                                                                            <span className="text-sm font-medium text-neutral-base-900">{loc.label}</span>
                                                                        </div>
                                                                        {field.value?.subdistrictId === loc.subdistrictId && (
                                                                            <Check className="w-4 h-4 text-neutral-base-900" />
                                                                        )}
                                                                    </button>
                                                                ))
                                                            ) : !isSearching && (
                                                                <div className="p-4 text-center flex flex-col items-center gap-2">
                                                                    <AlertCircle className="w-5 h-5 text-neutral-base-200" />
                                                                    <p className="text-xs font-medium text-neutral-base-400">Lokasi tidak ditemukan</p>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <FormMessage className="text-[11px] font-medium text-red-500 mt-1 ml-1" />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name="alamat_lengkap"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1.5">
                                                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                                            Alamat Lengkap
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative group">
                                                                <MapPin className={cn(
                                                                    "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300",
                                                                    form.formState.errors.alamat_lengkap ? "text-red-500" : "text-neutral-base-300 group-focus-within:text-neutral-base-900 group-focus-within:scale-110"
                                                                )} />
                                                                <Input
                                                                    placeholder="Nama Jalan, No. Rumah..."
                                                                    className={cn(
                                                                        "h-12 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-xl transition-all pl-12 pr-6 text-base placeholder:text-neutral-base-300 shadow-sm",
                                                                        form.formState.errors.alamat_lengkap && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                                                    )}
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-[11px] font-medium text-red-500 mt-1 ml-1" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="kode_pos"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-base-400 ml-1">
                                                        Kode Pos
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="12345"
                                                            maxLength={5}
                                                            className={cn(
                                                                "h-12 bg-neutral-base-50/50 border-neutral-base-200 focus:bg-white focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-xl transition-all px-6 text-base placeholder:text-neutral-base-300 shadow-sm text-center",
                                                                form.formState.errors.kode_pos && "border-red-500 ring-red-500/5 focus:border-red-500 focus:ring-red-500/10"
                                                            )}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[11px] font-medium text-red-500 mt-1 ml-1" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
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
    );
}
