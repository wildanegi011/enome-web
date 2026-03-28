"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { m } from "framer-motion";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Token tidak ditemukan.");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`/api/auth/activate?token=${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus("success");
                    setMessage(data.message);
                } else {
                    setStatus("error");
                    setMessage(data.error || "Gagal mengaktifkan akun.");
                }
            } catch (error) {
                setStatus("error");
                setMessage("Terjadi kesalahan sistem.");
            }
        };

        verify();
    }, [token]);

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center"
        >
            {status === "loading" && (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-16 h-16 text-neutral-base-900 animate-spin" />
                    <h1 className="text-2xl font-bold text-neutral-base-900">Memverifikasi Akun...</h1>
                    <p className="text-neutral-base-500">Mohon tunggu sebentar sementara kami mengaktifkan akun Anda.</p>
                </div>
            )}

            {status === "success" && (
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-base-900">Yeay! Akun Aktif</h1>
                    <p className="text-neutral-base-500">{message}</p>
                    <Button asChild className="w-full h-14 bg-neutral-base-900 hover:bg-neutral-base-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-neutral-base-900/10 uppercase tracking-[0.2em] text-xs">
                        <Link href="/login">Login Sekarang</Link>
                    </Button>
                </div>
            )}

            {status === "error" && (
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                        <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-base-900">Verifikasi Gagal</h1>
                    <p className="text-neutral-base-500">{message}</p>
                    <Button asChild variant="outline" className="w-full h-14 border-2 border-neutral-base-100 rounded-2xl hover:bg-neutral-base-50 transition-all font-bold uppercase tracking-[0.2em] text-xs">
                        <Link href="/register">Daftar Ulang</Link>
                    </Button>
                </div>
            )}
        </m.div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-neutral-base-50 flex items-center justify-center p-6">
            <Suspense fallback={
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center flex flex-col items-center gap-4">
                    <Loader2 className="w-16 h-16 text-neutral-base-900 animate-spin" />
                    <h1 className="text-2xl font-bold text-neutral-base-900">Memuat...</h1>
                </div>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
