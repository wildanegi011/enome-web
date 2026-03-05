import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface SubscribeResponse {
    message: string;
}

export const useSubscribeNewsletter = () => {
    return useMutation({
        mutationFn: async (email: string) => {
            const response = await fetch("/api/newsletter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Gagal mendaftar newsletter");
            }

            return data as SubscribeResponse;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Email Anda telah terdaftar!");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
};
