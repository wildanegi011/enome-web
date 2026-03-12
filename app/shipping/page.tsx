import { BlogService } from "@/lib/services/blog-service";
import { ConfigService } from "@/lib/services/config-service";
import Navbar from "@/components/store/layout/Navbar";
import Footer from "@/components/store/layout/Footer";
import { ASSET_URL } from "@/config/config";
import { notFound } from "next/navigation";
import ExpandableContent from "@/components/store/shared/ExpandableContent";
import FallbackImage from "@/components/store/shared/FallbackImage";
import BackButton from "@/components/store/shared/BackButton";

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Informasi Pengiriman | ÉNOMÉ",
    description: "Pelajari tata cara dan informasi pengiriman pesanan Anda di ÉNOMÉ.",
};

/**
 * Shipping Information Page
 * Fetches content from blog table (ID 6 - Tata Cara Pesan)
 */
export default async function Page() {
    return <ShippingInformasi />;
}

async function ShippingInformasi() {
    // Target ID for Shipping/Order Guide content is 12 (default)
    const SHIPPING_BLOG_ID = await ConfigService.getInt("footer_shipping", 12);
    const post = await BlogService.getPublishedBlogById(SHIPPING_BLOG_ID);

    if (!post) {
        notFound();
    }

    const imageUrl = post.background ? `${ASSET_URL}/img/blog/${post.background}` : null;

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-[35vh] md:h-[50vh] flex items-center justify-center overflow-hidden bg-neutral-base-900">
                {imageUrl ? (
                    <>
                        <FallbackImage
                            src={imageUrl}
                            alt={post.judul || "Informasi Pengiriman"}
                            fill
                            className="object-cover opacity-50"
                        />
                        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-white" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-neutral-base-100" />
                )}

                <div className="relative z-10 text-center px-6 mt-12">
                    <h1 className="font-heading text-4xl md:text-6xl font-bold text-white drop-shadow-md tracking-tight">
                        {post.judul}
                    </h1>
                </div>
            </section>

            {/* Content Section */}
            <section className="pb-24 bg-white">
                <div className="max-w-[900px] mx-auto px-6">
                    {/* Floating Back Button & Meta */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 -mt-10 relative z-20">
                        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-neutral-base-100 shadow-sm">
                            <BackButton
                                variant="ghost"
                                className="hover:bg-neutral-base-50"
                            />
                        </div>

                        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-neutral-base-100 shadow-sm flex items-center gap-4">
                            <div className="size-2 rounded-full bg-neutral-base-900 animate-pulse" />
                            <span className="text-[11px] font-black tracking-[0.2em] uppercase text-neutral-base-900">
                                Shipping Guide
                            </span>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-4 bg-neutral-base-50 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

                        <div className="bg-white rounded-[32px] p-8 md:p-16 shadow-2xl shadow-neutral-base-900/5 border border-neutral-base-100 relative">
                            <div className="absolute top-8 right-8 text-[40px] font-black text-neutral-base-50 select-none pointer-events-none tracking-tighter">
                                SHP
                            </div>

                            <ExpandableContent
                                content={post.konten || ""}
                                maxHeight={600}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
