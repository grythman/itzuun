import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verificationApi } from "@/lib/api/endpoints";
import { useToastStore } from "@/lib/toast-store";

export function useSubmitVerification() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: verificationApi.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      pushToast("success", "Verification submitted", "Your profile is under review.");
    },
    onError: () => {
      pushToast("error", "Verification failed", "Failed to submit verification request.");
    },
  });
}
