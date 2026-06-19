export const HIERARCHY_FIELDS = [
  "faId",
  "fmId",
  "bmId",
  "rmId",
  "zmId",
  "agmId",
  "ccoId",
] as const;
 
type HierarchyField = (typeof HIERARCHY_FIELDS)[number];
type HierarchyIds = Partial<Record<HierarchyField, number | null>>;

export const HIERARCHY_EDIT_ROLES = ["ADMIN", "HR"] as const;