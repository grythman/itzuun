import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/lib/api/endpoints";

export function useMyProfile() {
  return useQuery({
    queryKey: ["profile-me"],
    queryFn: profilesApi.me,
  });
}

export function useProfile(userId: string | number) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => profilesApi.get(userId),
    enabled: !!userId,
  });
}
