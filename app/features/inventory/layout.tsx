// app/features/inventory/layout.tsx

import { requirePermission } from "@/lib/auth/requirePermission";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only ADMIN / HR / DEV roles have all permissions, which maps to HO-only access.
  // If you later add a VIEW_INVENTORY permission, swap it in here.
  await requirePermission([PERMISSIONS.VIEW_BRANCHES]);
  return <>{children}</>;
}
