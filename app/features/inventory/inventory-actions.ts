"use server";

// app/features/inventory/actions.ts

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/withPermission";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { ItemCondition } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate next item code for a category in a branch.
 * Format: SGP/{YY}/{ABBREVIATION}/{serial 3-padded}
 * e.g. SGP/26/CCH/001
 */
async function generateItemCode(
  abbreviation: string,
  branchId: number
): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2); // "26"
  const prefix = `SGP/${year}/${abbreviation}/`;

  // Count existing items for this category+branch to derive next serial
  const existing = await prisma.inventoryItem.count({
    where: {
      itemCode: { startsWith: prefix },
      branchId,
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
  await requirePermission(PERMISSIONS.CREATE_EMPLOYEES); // HO-only write guard
  return prisma.inventoryCategory.create({
    data: {
      name: data.name,
      abbreviation: data.abbreviation.toUpperCase(),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEMS — READ
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventoryItems(branchId?: number) {
  return prisma.inventoryItem.findMany({
    where: branchId ? { branchId } : undefined,
    include: {
      InventoryCategory: true,
      Branch: { select: { id: true, name: true } },
    },
    orderBy: [{ branchId: "asc" }, { itemCode: "asc" }],
  });
}

export async function getInventoryItemById(id: number) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: { InventoryCategory: true, Branch: { select: { id: true, name: true } } },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEMS — WRITE
// ─────────────────────────────────────────────────────────────────────────────

export type CreateInventoryItemInput = {
  branchId: number;
  categoryId: number;
  name: string;
  quantity: number;
  condition: ItemCondition;
  notes?: string;
};

export async function createInventoryItem(data: CreateInventoryItemInput) {
  await requirePermission(PERMISSIONS.CREATE_EMPLOYEES); // HO-only write guard

  const category = await prisma.inventoryCategory.findUniqueOrThrow({
    where: { id: data.categoryId },
  });

  const itemCode = await generateItemCode(category.abbreviation, data.branchId);

  const item = await prisma.inventoryItem.create({
    data: {
      branchId: data.branchId,
      categoryId: data.categoryId,
      name: data.name,
      itemCode,
      quantity: data.quantity,
      condition: data.condition,
      notes: data.notes ?? null,
    },
    include: { InventoryCategory: true, Branch: { select: { id: true, name: true } } },
  });

  revalidatePath("/features/inventory");
  return { success: true, item };
}

export type UpdateInventoryItemInput = {
  name?: string;
  quantity?: number;
  condition?: ItemCondition;
  notes?: string;
};

export async function updateInventoryItem(
  id: number,
  data: UpdateInventoryItemInput
) {
  await requirePermission(PERMISSIONS.UPDATE_EMPLOYEES); // HO-only write guard

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.condition !== undefined && { condition: data.condition }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: { InventoryCategory: true, Branch: { select: { id: true, name: true } } },
  });

  revalidatePath("/features/inventory");
  return { success: true, item };
}

export async function deleteInventoryItem(id: number) {
  await requirePermission(PERMISSIONS.DELETE_EMPLOYEES); // HO-only write guard

  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath("/features/inventory");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY — total items per branch (for dashboard use)
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventorySummaryByBranch() {
  const groups = await prisma.inventoryItem.groupBy({
    by: ["branchId"],
    _sum: { quantity: true },
    _count: { id: true },
  });

  const branches = await prisma.branch.findMany({
    select: { id: true, name: true },
  });

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  return groups.map((g) => ({
    branchId: g.branchId,
    branchName: branchMap.get(g.branchId) ?? "Unknown",
    totalQuantity: g._sum.quantity ?? 0,
    lineItems: g._count.id,
  }));
}