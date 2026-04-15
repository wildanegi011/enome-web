"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { m } from "framer-motion";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
    const [message, setMessage] = useState("");

    // Resend states
    const [resendEmail, setResendEmail] = useState("");
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [resendError, setResendError] = useState("");

    // Countdown timer
    useEffect(() => {
        if (resendCountdown <= 0) return;
        const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCountdown]);

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
                } else if (res.status === 410 && data.expired) {
                    setStatus("expired");
                    setMessage(data.error || "Token verifikasi telah kedaluwarsa.");
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

    const handleResend = useCallback(async () => {
        if (!resendEmail || isResending || resendCountdown > 0) return;

        setIsResending(true);
        setResendError("");

        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resendEmail }),
            });
            const data = await res.json();

            if (res.ok) {
                setResendSuccess(true);
                setResendCountdown(60);
            } else if (res.status === 429 && data.remainingSeconds) {
                setResendCountdown(data.remainingSeconds);
                setResendError(data.error);
            } else {
                setResendError(data.error || "Gagal mengirim ulang email verifikasi.");
            }
        } catch {
            setResendError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsResending(false);
        }
    }, [resendEmail, isResending, resendCountdown]);

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

            {status === "expired" && (
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
                        <Mail className="w-12 h-12 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-base-900">Token Kedaluwarsa</h1>
                    <p className="text-neutral-base-500">{message}</p>

                    {resendSuccess ? (
                        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <p className="text-sm font-bold text-emerald-700">Email Terkirim!</p>
                            </div>
                            <p className="text-[11px] text-emerald-600 font-medium">
                                Email verifikasi baru telah dikirim ke <strong>{resendEmail}</strong>. Silakan cek inbox atau folder spam Anda.
                            </p>
                            {resendCountdown > 0 && (
                                <p className="text-[10px] text-emerald-500">
                                    Kirim ulang lagi dalam {resendCountdown} detik
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="w-full space-y-3">
                            <p className="text-xs text-neutral-base-400 font-medium">
                                Masukkan email Anda untuk mengirim ulang link verifikasi:
                            </p>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300" />
                                <Input
                                    type="email"
                                    placeholder="email@domain.com"
                                    value={resendEmail}
                                    onChange={(e) => { setResendEmail(e.target.value); setResendError(""); }}
                                    className="h-12 bg-neutral-base-50/50 border-neutral-base-200 focus:border-neutral-base-900 focus:ring-4 focus:ring-neutral-base-900/5 rounded-xl pl-11 pr-4 text-sm"
                                />
                            </div>
                            {resendError && (
                                <p className="text-[11px] text-red-500 font-medium text-left">{resendError}</p>
                            )}
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={!resendEmail || isResending || resendCountdown > 0}
                                className="w-full h-12 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-[0.15em]"
                            >
                                {isResending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : resendCountdown > 0 ? (
                                    <>Kirim Ulang ({resendCountdown}s)</>
                                ) : (
                                    <><RefreshCw className="w-3.5 h-3.5" /> Kirim Ulang Email Verifikasi</>
                                )}
                            </button>
                        </div>
                    )}

                    <Button asChild variant="outline" className="w-full h-12 border-2 border-neutral-base-100 rounded-xl hover:bg-neutral-base-50 transition-all font-bold uppercase tracking-[0.15em] text-[10px]">
                        <Link href="/login">Kembali ke Login</Link>
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
