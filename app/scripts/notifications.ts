import { prisma } from "@/lib/prisma";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPayrollNotification(empNo: string) {
  const subs = await prisma.pushSubscription.findMany({
    where: { empNo },
  });

  for (const { subscription } of subs) {
    await webpush.sendNotification(
      subscription as any,
      JSON.stringify({
        title: "Payroll Processed",
        body: "Your payroll for this month has been processed.",
        icon: "/icons/icon-192x192.png",
        url: "/payroll",
      })
    );
  }
}