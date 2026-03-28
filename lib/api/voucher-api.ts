import { apiClient } from "./api-client";

export const voucherApi = {
    getAutoApplyVoucher: (subtotal: number, orderTipe: string | number) =>
        apiClient<any>(`/api/vouchers/auto-apply?subtotal=${subtotal}&order_tipe=${orderTipe}`),
};
