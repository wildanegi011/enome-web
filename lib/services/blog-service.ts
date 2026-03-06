import { db } from "@/lib/db";
import { blog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export class BlogService {
    /**
     * Fetch a published and non-deleted blog post by its ID.
     */
    static async getPublishedBlogById(id: number) {
        try {
            const result = await db
                .select()
                .from(blog)
                .where(
                    and(
                        eq(blog.id, id),
                        eq(blog.isPublish, 1),
                        eq(blog.isDeleted, 0)
                    )
                )
                .limit(1);

            return result[0] || null;
        } catch (error) {
            console.error("Error fetching blog:", error);
            return null;
        }
    }
}
