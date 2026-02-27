// lib/auth/usePermission.ts
"use client";
import { Permission, hasAnyPermission } from "./permissions";

export function usePermission(role: string | null, permissions: Permission[] | Permission) {
  if (!role) return false;

  const permsArray = Array.isArray(permissions) ? permissions : [permissions];
  return permsArray.some(p => hasAnyPermission(role, [p]));
}