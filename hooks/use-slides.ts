import { useQuery } from "@tanstack/react-query";

export interface Slide {
    id: number;
    image: string;
    text: string | null;
    kategori: string | null;
    link: string | null;
}

export function useSlides() {
    return useQuery<Slide[]>({
        queryKey: ["slides"],
        queryFn: async () => {
            const response = await fetch("/api/slides");
            if (!response.ok) throw new Error("Failed to fetch slides");
            return response.json();
        },
    });
}
