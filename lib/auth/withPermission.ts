// lib/auth/withPermission.ts
import { getCurrentUserWithRole } from "../getCurrentUserWithRole";
import { hasPermission, Permission } from "./permissions";

export async function requirePermission(permission: Permission) {
    const user = await getCurrentUserWithRole();

    if (!user) {
        throw new Error("UNAUTHORIZED");
    }

    if (!hasPermission(user.role, permission)) {
        throw new Error("FORBIDDEN");
    }

    return user;
}