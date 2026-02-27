// lib/auth/requirePermission.ts
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Permission, hasAnyPermission } from "./permissions";

/**
 * requirePermission checks if the user has one or more permissions.
 * By default, it uses "any" logic (OR). You can add a flag for "all".
 */
export async function requirePermission(
  permissions: Permission[] | Permission, 
  requireAll: boolean = false
) {
  const user = await getCurrentUser();
  
  // Normalize single permission to array
  const requiredPermissions = Array.isArray(permissions)
    ? permissions
    : [permissions];

  const allowed = requireAll
    ? requiredPermissions.every(p => hasAnyPermission(user.role, [p]))
    : hasAnyPermission(user.role, requiredPermissions);

  if (!allowed) {
    redirect("/unauthorized");
  }

  return user;
}