import { getHoPayrollPreview } from "../ho-payroll-action";
import HoPayrollClient from "./HoPayrollClient";

// Same SSR-first pattern as the branch payroll page — the first preview
// query runs on the server during navigation instead of waiting for the
// client bundle to hydrate.
export default async function HoPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();

  const year = params.year ? Number(params.year) : today.getFullYear();
  const month = params.month ? Number(params.month) : today.getMonth() + 1;

  const initialPreview = await getHoPayrollPreview(year, month, {});

  return (
    <HoPayrollClient
      initialYear={year}
      initialMonth={month}
      initialPreview={initialPreview}
    />
  );
}
