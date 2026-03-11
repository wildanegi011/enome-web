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
    title: "Tentang ÉNOMÉ | Warisan Budaya Modern",
    description: "Kenali lebih dekat perjalanan ÉNOMÉ dalam melestarikan batik dan warisan budaya Indonesia melalui desain modern.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * About Enome Page
 * Fetches content from blog table (ID 10)
 */
export default async function Page() {
    return <AboutInformasi />;
}

async function AboutInformasi() {
    // Current target ID for About content is 11 (default)
    const ABOUT_BLOG_ID = await ConfigService.getInt("footer_about", 11, true);
    const post = await BlogService.getPublishedBlogById(ABOUT_BLOG_ID);

    if (!post) {
        notFound();
    }

    const imageUrl = post.background ? `${ASSET_URL}/img/blog/${post.background}` : null;

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section with Background Image */}
            <section className="relative h-[40vh] md:h-[60vh] flex items-center justify-center overflow-hidden bg-neutral-base-900">
                {imageUrl ? (
                    <>
                        <FallbackImage
                            src={imageUrl}
                            alt={post.judul || "Tentang ÉNOMÉ"}
                            fill
                            className="object-cover opacity-60"
                            priority
                        />
                        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-white" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-neutral-base-100" />
                )}

                <div className="relative z-10 text-center px-6">
                    <h1 className="font-heading text-4xl md:text-7xl font-bold text-white drop-shadow-lg tracking-tight">
                        {post.judul}
                    </h1>
                </div>
            </section>

            {/* Content Section */}
            <section className="pb-24 bg-white">
                <div className="max-w-[900px] mx-auto px-6">
                    {/* Floating Back Button & Meta */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 -mt-12 relative z-20">
                        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-neutral-base-100 shadow-sm">
                            <BackButton
                                variant="ghost"
                                className="hover:bg-neutral-base-50"
                            />
                        </div>

                        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-neutral-base-100 shadow-sm flex items-center gap-4">
                            <div className="size-2 rounded-full bg-neutral-base-900 animate-pulse" />
                            <span className="text-[11px] font-black tracking-[0.2em] uppercase text-neutral-base-900">
                                Official Profile
                            </span>
                        </div>
                    </div>

                    <div className="relative group">
                        {/* Decorative background element */}
                        <div className="absolute -inset-4 bg-neutral-base-50 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

                        <div className="bg-white rounded-[32px] p-8 md:p-16 shadow-2xl shadow-neutral-base-900/5 border border-neutral-base-100 relative">
                            {/* Brand watermark */}
                            <div className="absolute top-8 right-8 text-[40px] font-black text-neutral-base-50 select-none pointer-events-none tracking-tighter">
                                ENM
                            </div>

                            <ExpandableContent
                                content={post.konten || ""}
                                maxHeight={500}
                            />

                            <div className="mt-16 pt-8 border-t border-neutral-base-100 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="text-[10px] font-black tracking-[0.5em] uppercase text-neutral-base-300">
                                    The Art of ÉNOMÉ
                                </div>
                                <p className="text-[13px] text-neutral-base-400 font-medium max-w-[400px]">
                                    Terima kasih telah menjadi bagian dari perjalanan kami dalam melestarikan warisan budaya Indonesia.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
