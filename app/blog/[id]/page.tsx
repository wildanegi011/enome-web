import { BlogService } from "@/lib/services/blog-service";
import Navbar from "@/components/store/layout/Navbar";
import Footer from "@/components/store/layout/Footer";
import { notFound } from "next/navigation";

export default async function BlogDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const blogId = parseInt(params.id);

    if (isNaN(blogId)) {
        notFound();
    }

    return (
        <BlogContent blogId={blogId} />
    );
}

async function BlogContent({ blogId }: { blogId: number }) {
    const post = await BlogService.getPublishedBlogById(blogId);

    if (!post) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <article className="max-w-[800px] mx-auto px-6 py-16 md:py-24">
                <header className="mb-12">
                    <h1 className="font-heading text-4xl md:text-5xl font-bold text-neutral-base-900 mb-4">
                        {post.judul}
                    </h1>
                    {post.createdAt && (
                        <div className="text-sm text-neutral-base-400 uppercase tracking-widest font-medium">
                            {new Date(post.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </div>
                    )}
                </header>

                <div
                    className="prose prose-neutral max-w-none 
                        prose-headings:font-heading prose-headings:font-semibold prose-headings:text-neutral-base-900
                        prose-p:text-neutral-base-600 prose-p:leading-relaxed
                        prose-img:rounded-2xl prose-img:shadow-sm"
                    dangerouslySetInnerHTML={{ __html: post.konten || "" }}
                />
            </article>

            <Footer />
        </main>
    );
}
