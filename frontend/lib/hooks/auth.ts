import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints";

export function useMe(options?: { enabled?: boolean; retryOnAuth?: boolean }) {
  const retry = options?.retryOnAuth ? 1 : false;
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    enabled: options?.enabled !== false,
    retry,
  });
}
