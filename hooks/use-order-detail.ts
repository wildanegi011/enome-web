import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api/user-api";
import { queryKeys } from "@/lib/query-keys";

export function useOrderDetail(id: string) {
    return useQuery({
        queryKey: queryKeys.user.orderDetail(id),
        queryFn: () => userApi.getOrderDetail(id),
        enabled: !!id,
        retry: false
    });
}
