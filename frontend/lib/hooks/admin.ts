import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/endpoints";

export function useAdminSnapshots() {
  return useQuery({
    queryKey: ["admin", "snapshots"],
    queryFn: adminApi.snapshots,
  });
}

export function useAdminSnapshot() {
  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.users,
  });
  const projects = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: adminApi.projects,
  });
  const escrow = useQuery({
    queryKey: ["admin", "escrow"],
    queryFn: () => adminApi.escrow(),
  });
  const disputes = useQuery({
    queryKey: ["admin", "disputes"],
    queryFn: () => adminApi.disputes(),
  });
  const commission = useQuery({
    queryKey: ["admin", "commission"],
    queryFn: adminApi.commission,
  });
  const ledger = useQuery({
    queryKey: ["admin", "ledger"],
    queryFn: adminApi.ledger,
  });

  return { users, projects, escrow, disputes, commission, ledger };
}

export function useAdminLedger() {
  return useQuery({
    queryKey: ["admin", "ledger"],
    queryFn: adminApi.ledger,
  });
}
