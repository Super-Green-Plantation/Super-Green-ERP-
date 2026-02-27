// app/features/financial-plans/layout.tsx

import { requirePermission } from "@/lib/auth/requirePermission";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {

  await requirePermission(
    [PERMISSIONS.VIEW_COMMISSIONS]
  );

  return <>{children}</>;
}