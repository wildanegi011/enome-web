import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
export { type WalletTransaction } from "@/lib/api/user-api";
import { userApi, WalletTransaction } from "@/lib/api/user-api";
import { queryKeys } from "@/lib/query-keys";

export function useWallet(initialPage: number = 1, limit: number = 10) {
    const [page, setPage] = useState(initialPage);
    const queryClient = useQueryClient();

    const balanceQuery = useQuery({
        queryKey: queryKeys.user.wallet.balance,
        queryFn: userApi.getWalletBalance,
    });

    const historyQuery = useQuery({
        queryKey: [...queryKeys.user.wallet.history, page, limit],
        queryFn: () => userApi.getWalletHistory(page, limit),
    });

    const topUpMutation = useMutation({
        mutationFn: ({ amount, description }: { amount: number; description?: string }) =>
            userApi.topUpWallet(amount, description),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user.wallet.balance });
            queryClient.invalidateQueries({ queryKey: queryKeys.user.wallet.history });
        }
    });

    const isLoading = balanceQuery.isLoading || historyQuery.isLoading;

    return {
        balance: balanceQuery.data || 0,
        history: (historyQuery.data?.history || []) as WalletTransaction[],
        metadata: historyQuery.data?.metadata,
        isLoading,
        isError: balanceQuery.isError || historyQuery.isError,
        page,
        setPage,
        topUp: topUpMutation.mutateAsync,
        isTopUpLoading: topUpMutation.isPending,
        mutate: () => {
            balanceQuery.refetch();
            historyQuery.refetch();
        }
    };
}
