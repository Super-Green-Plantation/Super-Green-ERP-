-- Month-end commission rows are aggregated per FA / upline / chairman and
-- are not tied to a single investment (MPs-only FAs have none).
ALTER TABLE "Commission" ALTER COLUMN "investmentId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Commission_year_month_branchId_type_idx"
  ON "Commission" ("year", "month", "branchId", "type");
