// app/api/notifications/route.ts
//
// GET  /api/notifications        — returns latest 50 notifications (unread first)
// PATCH /api/notifications       — marks all notifications as read
// PATCH /api/notifications?id=N  — marks a single notification as read

import { prisma } from "@/lib/prisma";
import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { NextRequest } from "next/server";

// Only ADMIN / HR / DEV should see system notifications
const ALLOWED_ROLES = ["ADMIN", "HR", "DEV"];

export async function GET() {
  const user = await getCurrentUserWithRole();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const notifications = await prisma.notification.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return Response.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUserWithRole();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    await prisma.notification.update({
      where: { id: Number(id) },
      data: { isRead: true },
    });
  } else {
    // Mark all unread as read
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  }

  return Response.json({ ok: true });
}