// app/features/financial-plans/layout.tsx
import { requirePermission } from "@/lib/auth/requirePermission";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function Layout({ children }: { children: React.ReactNode }) {

  // OR semantics: user needs at least VIEW or UPDATE to see this feature
  await requirePermission([PERMISSIONS.VIEW_FINANCIAL_PLAN]);

  return <>{children}</>;
}