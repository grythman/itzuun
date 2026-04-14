import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { premiumApi } from "@/lib/api/endpoints";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useToastStore } from "@/lib/stores/toast-store";

export function usePremiumMe(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["premium", "me"],
    queryFn: premiumApi.me,
    enabled: options?.enabled !== false,
  });
}

export function usePremiumSubscribe() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (planType?: string) => premiumApi.subscribe(planType || "pro_monthly"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premium", "me"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      pushToast("success", "PRO идэвхжлээ", "Таны багц амжилттай шинэчлэгдлээ.");
    },
    onError: (err: unknown) => {
      pushToast("error", "PRO идэвхжүүлэхэд алдаа гарлаа", extractApiErrorMessage(err, "Дахин оролдоно уу."));
    },
  });
}

export function usePremiumCancel() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: premiumApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premium", "me"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      pushToast("success", "PRO цуцлагдлаа", "Таны багц free төлөв рүү шилжлээ.");
    },
    onError: (err: unknown) => {
      pushToast("error", "PRO цуцлахад алдаа гарлаа", extractApiErrorMessage(err, "Дахин оролдоно уу."));
    },
  });
}
