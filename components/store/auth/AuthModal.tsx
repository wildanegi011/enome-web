"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
    const isMobile = useIsMobile();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);

    // Login State
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });

    // Register State
    const [registerData, setRegisterData] = useState({
        nama: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify(loginData),
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (data.msg !== "success") throw new Error(data.pesan || "Login failed");

            toast.success("Selamat datang kembali!");
            onClose();
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (registerData.password !== registerData.confirmPassword) {
            toast.error("Password tidak cocok");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(registerData),
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Registration failed");

            toast.success("Akun berhasil dibuat! Silakan login.");
            setActiveTab("login");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const AuthHeader = () => (
        <div className="relative h-32 bg-neutral-base-900 flex items-center justify-center overflow-hidden shrink-0 rounded-t-3xl sm:rounded-none">
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80')] bg-cover bg-center grayscale" />
            <div className="relative z-10 text-center px-6">
                <h2 className="font-montserrat text-2xl sm:text-3xl text-white italic tracking-tight">Experience Énome</h2>
                <p className="text-neutral-base-400 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold mt-2">Premium Batik Collection</p>
            </div>
            {isMobile && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            )}
        </div>
    );

    const AuthForms = () => (
        <div className="px-6 py-8 flex-1 min-h-0 overflow-y-auto no-scrollbar">
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-neutral-base-50 p-1 rounded-xl">
                    <TabsTrigger value="login" className="rounded-lg text-[13px] font-bold py-2.5 transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">LOGIN</TabsTrigger>
                    <TabsTrigger value="register" className="rounded-lg text-[13px] font-bold py-2.5 transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">REGISTER</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <TabsContent value="login">
                        <motion.div
                            initial={{ opacity: 0.5, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300" />
                                        <Input
                                            type="text"
                                            placeholder="example@mail.com"
                                            className="pl-10 h-12 bg-neutral-base-50/50 border-neutral-base-100 focus:ring-amber-800 transition-all rounded-xl"
                                            required
                                            value={loginData.email}
                                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Password</Label>
                                        <button type="button" className="text-[10px] font-bold text-amber-800 hover:underline">Forgot?</button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300" />
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 h-12 bg-neutral-base-50/50 border-neutral-base-100 focus:ring-amber-800 transition-all rounded-xl"
                                            required
                                            value={loginData.password}
                                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-neutral-base-900 hover:bg-amber-900 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-amber-900/20 active:scale-95"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SIGN IN"}
                                </Button>
                            </form>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="register">
                        <motion.div
                            initial={{ opacity: 0.5, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <form onSubmit={handleRegister} className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Nama Lengkap</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300" />
                                        <Input
                                            placeholder="John Doe"
                                            className="pl-10 h-11 bg-neutral-base-50/50 border-neutral-base-100 rounded-xl"
                                            required
                                            value={registerData.nama}
                                            onChange={(e) => setRegisterData({ ...registerData, nama: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-base-300" />
                                        <Input
                                            type="email"
                                            placeholder="example@mail.com"
                                            className="pl-10 h-11 bg-neutral-base-50/50 border-neutral-base-100 rounded-xl"
                                            required
                                            value={registerData.email}
                                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-11 bg-neutral-base-50/50 border-neutral-base-100 rounded-xl"
                                        required
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-neutral-base-400">Confirm Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-11 bg-neutral-base-50/50 border-neutral-base-100 rounded-xl"
                                        required
                                        value={registerData.confirmPassword}
                                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-neutral-base-900 hover:bg-amber-900 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 mt-4"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CREATE ACCOUNT"}
                                </Button>
                            </form>
                        </motion.div>
                    </TabsContent>
                </AnimatePresence>
            </Tabs>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onClose}>
                <DrawerContent className="h-[90dvh] flex flex-col p-0 border-none bg-white rounded-t-[32px] outline-hidden">
                    <DrawerHeader className="p-0">
                        <DrawerTitle className="sr-only">Authentication</DrawerTitle>
                        <DrawerDescription className="sr-only">Login or Register to your account</DrawerDescription>
                        <AuthHeader />
                    </DrawerHeader>
                    <AuthForms />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full sm:max-w-[450px] p-0 overflow-hidden border-none bg-white rounded-2xl shadow-2xl flex flex-col outline-hidden">
                <DialogHeader className="p-0">
                    <DialogTitle className="sr-only">Authentication</DialogTitle>
                    <DialogDescription className="sr-only">Login or Register to your account</DialogDescription>
                    <AuthHeader />
                </DialogHeader>
                <AuthForms />
            </DialogContent>
        </Dialog>
    );
}
