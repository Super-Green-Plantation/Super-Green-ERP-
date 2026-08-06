"use server";

// app/features/inventory/inventory-actions.ts

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/withPermission";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { ItemCondition, InventoryCompany } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SGP items:       SGP/{YY}/{ABBR}/{serial}   e.g. SGP/26/CCH/001
 * Micro Credit:    MC/{YY}/{ABBR}/{serial}    e.g. MC/26/CCH/001
 */
async function generateItemCode(
  abbreviation: string,
  company: InventoryCompany,
  branchId: number | null
): Promise<string> {
  const yy     = new Date().getFullYear().toString().slice(-2);
  const prefix = company === "SGP"
    ? `SGP/${yy}/${abbreviation}/`
    : `MC/${yy}/${abbreviation}/`;

  const existing = await prisma.inventoryItem.count({
    where: {
      itemCode: { startsWith: prefix },
      ...(branchId !== null ? { branchId } : { company }),
    },
  });

  const serial = String(existing + 1).padStart(3, "0");
  return `${prefix}${serial}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventoryCategories() {
  return prisma.inventoryCategory.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createInventoryCategory(data: {
  name: string;
  abbreviation: string;
}) {
  await requirePermission(PERMISSIONS.CREATE_EMPLOYEES);
  return prisma.inventoryCategory.create({
    data: {
      name:         data.name,
      abbreviation: data.abbreviation.toUpperCase(),
    },
  });
}

export async function updateInventoryCategory(
  id: number,
  data: { name?: string; abbreviation?: string }
) {
  await requirePermission(PERMISSIONS.UPDATE_EMPLOYEES);
  return prisma.inventoryCategory.update({
    where: { id },
    data: {
      ...(data.name         !== undefined && { name:         data.name }),
      ...(data.abbreviation !== undefined && { abbreviation: data.abbreviation.toUpperCase() }),
      updatedAt: new Date(),
    },
  });
}

export async function deleteInventoryCategory(id: number) {
  await requirePermission(PERMISSIONS.DELETE_EMPLOYEES);
  const count = await prisma.inventoryItem.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error(
      `Cannot delete — ${count} item${count > 1 ? "s" : ""} still use this category.`
    );
  }
  await prisma.inventoryCategory.delete({ where: { id } });
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEMS — READ
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventoryItems(params: {
  company:  InventoryCompany;
  branchId?: number;
}) {
  const { company, branchId } = params;

  return prisma.inventoryItem.findMany({
    where: {
      company,
      ...(branchId !== undefined ? { branchId } : {}),
    },
    include: {
      InventoryCategory: true,
      Branch: { select: { id: true, name: true } },
    },
    orderBy: [{ itemCode: "asc" }],
  });
}

export async function getInventoryItemById(id: number) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      InventoryCategory: true,
      Branch: { select: { id: true, name: true } },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEMS — WRITE
// ─────────────────────────────────────────────────────────────────────────────

export type CreateInventoryItemInput = {
  company:    InventoryCompany;
  branchId:   number | null;      // null for Micro Credit
  categoryId: number;
  name:       string;
  quantity:   number;
  condition:  ItemCondition;
  notes?:     string;
};

export async function createInventoryItem(data: CreateInventoryItemInput) {
  await requirePermission(PERMISSIONS.CREATE_EMPLOYEES);

  const category = await prisma.inventoryCategory.findUniqueOrThrow({
    where: { id: data.categoryId },
  });

  const itemCode = await generateItemCode(
    category.abbreviation,
    data.company,
    data.branchId
  );

  const item = await prisma.inventoryItem.create({
    data: {
      company:    data.company,
      branchId:   data.branchId,
      categoryId: data.categoryId,
      name:       data.name,
      itemCode,
      quantity:   data.quantity,
      condition:  data.condition,
      notes:      data.notes ?? null,
    },
    include: {
      InventoryCategory: true,
      Branch: { select: { id: true, name: true } },
    },
  });

  revalidatePath("/features/inventory");
  return { success: true, item };
}

export type UpdateInventoryItemInput = {
  name?:      string;
  quantity?:  number;
  condition?: ItemCondition;
  notes?:     string;
};

export async function updateInventoryItem(
  id: number,
  data: UpdateInventoryItemInput
) {
  await requirePermission(PERMISSIONS.UPDATE_EMPLOYEES);

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(data.name      !== undefined && { name:      data.name }),
      ...(data.quantity  !== undefined && { quantity:  data.quantity }),
      ...(data.condition !== undefined && { condition: data.condition }),
      ...(data.notes     !== undefined && { notes:     data.notes }),
      updatedAt: new Date(),
    },
    include: {
      InventoryCategory: true,
      Branch: { select: { id: true, name: true } },
    },
  });

  revalidatePath("/features/inventory");
  return { success: true, item };
}

export async function deleteInventoryItem(id: number) {
  await requirePermission(PERMISSIONS.DELETE_EMPLOYEES);
  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath("/features/inventory");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventorySummaryByBranch() {
  const groups = await prisma.inventoryItem.groupBy({
    by: ["branchId"],
    _sum:   { quantity: true },
    _count: { id: true },
  });

  const branches = await prisma.branch.findMany({
    select: { id: true, name: true },
  });

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  return groups.map((g) => ({
    branchId:      g.branchId,
    branchName:    g.branchId ? (branchMap.get(g.branchId) ?? "Unknown") : "Micro Credit",
    totalQuantity: g._sum.quantity ?? 0,
    lineItems:     g._count.id,
  }));
}