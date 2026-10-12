// app/api/notifications/route.ts
//
// GET    /api/notifications        — returns latest 50 notifications (unread first)
// PATCH  /api/notifications        — marks all notifications as read
// PATCH  /api/notifications?id=N   — marks a single notification as read
// DELETE /api/notifications        — deletes all notifications
// DELETE /api/notifications?id=N   — deletes a single notification

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const ALLOWED_ROLES = ["ADMIN", "HR", "DEV"];

async function checkAuth() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { ok: false as const, status: 401, error: "Unauthorized" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true },
    });

    if (!dbUser || !ALLOWED_ROLES.includes(dbUser.role)) {
      return { ok: false as const, status: 403, error: "Forbidden" };
    }

    return { ok: true as const, role: dbUser.role };
  } catch {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
}

export async function GET() {
  const auth = await checkAuth();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const notifications = await prisma.notification.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return Response.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAuth();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    await prisma.notification.update({
      where: { id: Number(id) },
      data: { isRead: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  }

  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAuth();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    await prisma.notification.delete({ where: { id: Number(id) } });
  } else {
    await prisma.notification.deleteMany({});
  }

  return Response.json({ ok: true });
}