import { ActivityAction, ActivityEntity } from "@prisma/client";
import { prisma } from "./prisma";

interface LogActivityParams {
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: number;
  performedById?: number | null;
  branchId?: number | null;
  metadata?: Record<string, any>;
}

export const logActivity = ({
  action,
  entity,
  entityId,
  performedById,
  branchId,
  metadata,
}: LogActivityParams): void => {
  // Push execution to background to prevent slowing down the main process
  setTimeout(async () => {
    try {
      const finalPerformedById =
        performedById === 0 ? undefined : performedById ?? undefined;
      const finalBranchId = branchId === 0 ? undefined : branchId ?? undefined;

      await prisma.activityLog.create({
        data: {
          action,
          entity,
          entityId,
          performedById: finalPerformedById,
          branchId: finalBranchId,
          metadata: metadata ?? undefined,
        },
      });
    } catch (err) {
      console.error("[logActivity] Background logging error:", err);
    }
  }, 0);
};