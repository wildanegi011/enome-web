import Navbar from "@/components/store/layout/Navbar";
import Footer from "@/components/store/layout/Footer";
import { ConfigService } from "@/lib/services/config-service";
import { db } from "@/lib/db";
import { companyProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Mail, Phone, MapPin, Clock, MessageCircle, ExternalLink } from "lucide-react";
import BackButton from "@/components/store/shared/BackButton";

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hubungi Kami | ÉNOMÉ",
    description: "Hubungi tim ÉNOMÉ untuk bantuan, pertanyaan, atau informasi lebih lanjut mengenai produk dan layanan kami.",
};

export default async function Page() {
    return <ContactInformasi />;
}

/**
 * Contact Us Page
 * Composes data from central_config and companyprofile
 */
async function ContactInformasi() {
    // Fetch Configuration
    const whatsapp = await ConfigService.get("whatsapp_nomor");
    const email = await ConfigService.get("admin_email", "hijabsylla@gmail.com");
    const dailyOpen = await ConfigService.get("daily_open", "Monday – Friday : 09.00 – 17.00 WIB");
    const weekendOpen = await ConfigService.get("weekend_open", "Saturday : 09.00 – 14.00 WIB");

    // Fetch Active Company Profile
    const [company]: any = await db.select()
        .from(companyProfile)
        .where(eq(companyProfile.isAktif, 1))
        .limit(1);

    const address = company?.alamat || "Jl. Parang V No. 1-3, Bandung";
    const waLink = `https://wa.me/${whatsapp}`;

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Simple Hero */}
            <section className="bg-neutral-base-900 py-20 md:py-32 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -mr-48 -mt-48" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -ml-32 -mb-32" />
                </div>

                <div className="max-w-[1400px] mx-auto px-6 relative z-10 text-center">
                    <h1 className="font-heading text-4xl md:text-7xl font-bold text-white tracking-tight mb-6">
                        Hubungi Kami
                    </h1>
                    <p className="text-neutral-base-300 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Kami siap membantu Anda. Jangan ragu untuk menghubungi kami melalui saluran komunikasi di bawah ini.
                    </p>
                </div>
            </section>

            {/* Contact Grid Section */}
            <section className="pb-32 bg-white">
                <div className="max-w-[1200px] mx-auto px-6">
                    {/* Back Button Area */}
                    <div className="flex justify-start mb-12 -mt-8 relative z-20">
                        <div className="bg-white p-2 rounded-full border border-neutral-base-100 shadow-md">
                            <BackButton variant="ghost" className="hover:bg-neutral-base-50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* WhatsApp Card */}
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-white p-10 rounded-[40px] border border-neutral-base-100 shadow-xl shadow-neutral-base-900/5 hover:border-neutral-base-900 transition-all duration-500 flex flex-col items-center text-center"
                        >
                            <div className="size-16 rounded-3xl bg-green-50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-green-600 transition-all duration-500">
                                <MessageCircle className="size-8 text-green-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-neutral-base-900 mb-2">WhatsApp</h3>
                            <p className="text-neutral-base-500 font-medium mb-6">Tanya jawab cepat melalui WhatsApp</p>
                            <div className="mt-auto flex items-center gap-2 text-[12px] font-black tracking-widest uppercase text-neutral-base-900">
                                Chat Sekarang <ExternalLink className="size-3" />
                            </div>
                        </a>

                        {/* Email Card */}
                        <div className="group bg-white p-10 rounded-[40px] border border-neutral-base-100 shadow-xl shadow-neutral-base-900/5 hover:border-neutral-base-900 transition-all duration-500 flex flex-col items-center text-center">
                            <div className="size-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500">
                                <Mail className="size-8 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-neutral-base-900 mb-2">Email</h3>
                            <p className="text-neutral-base-900 font-black tracking-tight break-all mb-4">{email}</p>
                            <p className="text-neutral-base-500 font-medium text-sm">Respon umum dalam 24 jam kerja</p>
                        </div>

                        {/* Office Card */}
                        <div className="group bg-white p-10 rounded-[40px] border border-neutral-base-100 shadow-xl shadow-neutral-base-900/5 hover:border-neutral-base-900 transition-all duration-500 flex flex-col items-center text-center">
                            <div className="size-16 rounded-3xl bg-orange-50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-orange-600 transition-all duration-500">
                                <MapPin className="size-8 text-orange-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-neutral-base-900 mb-2">Alamat</h3>
                            <p className="text-neutral-base-500 text-sm leading-relaxed font-medium">{address}</p>
                        </div>
                    </div>

                    {/* Operational Hours Section */}
                    <div className="mt-20 flex flex-col items-center">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px w-12 bg-neutral-base-100" />
                            <div className="flex items-center gap-2 text-neutral-base-400">
                                <Clock className="size-4" />
                                <span className="text-[10px] font-black tracking-[0.4em] uppercase">Jam Operasional</span>
                            </div>
                            <div className="h-px w-12 bg-neutral-base-100" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-center">
                            <div className="bg-neutral-base-50/50 px-8 py-4 rounded-2xl border border-neutral-base-100">
                                <span className="text-neutral-base-900 font-black text-sm block mb-1">{dailyOpen.split(':')[0]}</span>
                                <span className="text-neutral-base-500 text-sm font-medium">{dailyOpen.includes(':') ? dailyOpen.split(':')[1] : dailyOpen}</span>
                            </div>
                            <div className="bg-neutral-base-50/50 px-8 py-4 rounded-2xl border border-neutral-base-100">
                                <span className="text-neutral-base-900 font-black text-sm block mb-1">{weekendOpen.split(':')[0]}</span>
                                <span className="text-neutral-base-500 text-sm font-medium">{weekendOpen.includes(':') ? weekendOpen.split(':')[1] : weekendOpen}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
