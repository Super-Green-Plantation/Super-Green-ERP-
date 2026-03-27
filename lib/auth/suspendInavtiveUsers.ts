import { prisma } from "../prisma";

export async function suspendInactiveUsers() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60); // 60 days ago

    // Find members inactive for 60+ days
    const inactiveMembers = await prisma.member.findMany({
        where: {
            userId: { not: null }, // only members with a user account
            OR: [
                { lastClientRegisteredAt: { lt: cutoff } },
                { lastClientRegisteredAt: null }, // never registered a client
            ],
        },
        select: { userId: true, nameWithInitials: true, empNo: true },
    });

    if (inactiveMembers.length === 0) return { suspended: 0 };

    const userIds = inactiveMembers
        .map(m => m.userId)
        .filter(Boolean) as string[];

    // Set User.status = false for all inactive
    await prisma.user.updateMany({
        where: {
            id: { in: userIds },
            status: true, // only update currently active users
        },
        data: { status: false },
    });

    console.log(`Suspended ${userIds.length} inactive users:`,
        inactiveMembers.map(m => m.empNo));

    return { suspended: userIds.length, members: inactiveMembers };
}