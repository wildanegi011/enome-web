import { ASSET_URL } from "@/config/config";
import { db } from "@/lib/db";
import { slide } from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";

export class SlideService {
    static async getBatikCollections() {
        const slides = await db.select()
            .from(slide)
            .where(and(
                eq(slide.kategori, "main_image"),
                eq(slide.publish, 1),
                eq(slide.isDeleted, 0)
            ))
            .orderBy(asc(slide.orderSlide), asc(slide.orderImage));

        // Group by order_slide
        const collectionsMap = new Map<number, any>();

        slides.forEach(s => {
            const os = Number(s.orderSlide) || 0;
            if (!collectionsMap.has(os)) {
                collectionsMap.set(os, {
                    id: os.toString(),
                    title: "",
                    images: []
                });
            }
            collectionsMap.get(os).images.push({
                url: `${ASSET_URL}/img/slide/${s.image}`,
                link: s.link,
                title: s.text,
                isMobile: s.isMobile === 1,
                aspect: "1/1"
            });
        });

        // Filter out empty collections if any
        return Array.from(collectionsMap.values()).filter(c => c.images.length > 0);
    }

    static async getFrontendLogo() {
        const slides = await db.select()
            .from(slide)
            .where(and(
                eq(slide.kategori, "logo_frontend"),
                eq(slide.publish, 1),
                eq(slide.isDeleted, 0)
            ))
            .limit(1);

        if (slides.length > 0) {
            return `${ASSET_URL}/img/slide/${slides[0].image}`;
        }

        return null;
    }
}
