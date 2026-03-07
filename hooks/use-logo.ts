import { useQuery } from "@tanstack/react-query";

interface LogoResponse {
    success: boolean;
    data: string | null;
}

export function useLogo() {
    return useQuery<string | null>({
        queryKey: ["logo"],
        queryFn: async () => {
            const response = await fetch("/api/logo");
            if (!response.ok) throw new Error("Failed to fetch logo");
            const result: LogoResponse = await response.json();
            return result.data;
        },
        staleTime: 60 * 60 * 1000, // Cache for 1 hour to prevent unnecessary refetches
    });
}
