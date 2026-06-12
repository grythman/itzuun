import { ForceLightMode } from "@/components/shared/force-light-mode";

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ForceLightMode />
      {children}
    </>
  );
}
