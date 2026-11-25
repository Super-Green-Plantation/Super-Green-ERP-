"use server";

import { prisma } from "@/lib/prisma";
import { ActivityAction, ActivityEntity, Prisma } from "@prisma/client";
import { serializeData } from "@/app/utils/serializers";

export type ActivityLogFilterParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: string;
  entity?: string;
  branchId?: number | string;
  dateRange?: string;
};

export async function getActivityLogs(params: ActivityLogFilterParams = {}) {
  try {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(5, Number(params.pageSize) || 15));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ActivityLogWhereInput = {};

    // Filter by action
    if (params.action && params.action !== "ALL") {
      where.action = params.action as ActivityAction;
    }

    // Filter by entity
    if (params.entity && params.entity !== "ALL") {
      where.entity = params.entity as ActivityEntity;
    }

    // Filter by branch
    if (params.branchId && params.branchId !== "ALL") {
      where.branchId = Number(params.branchId);
    }

    // Filter by date range
    if (params.dateRange && params.dateRange !== "all") {
      const now = new Date();
      if (params.dateRange === "today") {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        where.createdAt = { gte: startOfDay };
      } else if (params.dateRange === "7days") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: sevenDaysAgo };
      } else if (params.dateRange === "30days") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: thirtyDaysAgo };
      }
    }

    // Search query
    if (params.search && params.search.trim()) {
      const term = params.search.trim();
      const numVal = parseInt(term, 10);
      const isNum = !isNaN(numVal) && String(numVal) === term;

      const orConditions: Prisma.ActivityLogWhereInput[] = [
        { performedBy: { nameWithInitials: { contains: term, mode: "insensitive" } } },
        { performedBy: { empNo: { contains: term, mode: "insensitive" } } },
        { performedBy: { email: { contains: term, mode: "insensitive" } } },
        { performedBy: { user: { name: { contains: term, mode: "insensitive" } } } },
        { branch: { name: { contains: term, mode: "insensitive" } } },
      ];

      if (isNum) {
        orConditions.push({ entityId: numVal });
      }

      where.OR = orConditions;
    }

    const [logs, totalCount, todayCount, branches] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          performedBy: {
            select: {
              id: true,
              empNo: true,
              nameWithInitials: true,
              email: true,
              profilePic: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              location: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.branch.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return serializeData({
      success: true,
      data: {
        logs,
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
        todayCount,
        branches,
      },
    });
  } catch (error: any) {
    console.error("[getActivityLogs] Error:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch activity logs",
      data: {
        logs: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 15,
        todayCount: 0,
        branches: [],
      },
    };
  }
}
