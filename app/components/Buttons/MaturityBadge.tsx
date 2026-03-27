import { Calendar } from "lucide-react";
import { useIsMounted } from "@/app/hooks/useIsMounted";

const getDaysUntilMaturity = (maturityDate: string) => {
  const today = new Date();
  const maturity = new Date(maturityDate);
  const diff = Math.ceil((maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

export const MaturityBadge = ({ investments }: { investments: any[] }) => {
  const isMounted = useIsMounted();
  if (!investments?.length) return null;

  const upcoming = investments
    .filter(inv => inv.maturityDate && !inv.isMatured)
    .map(inv => ({
      ...inv,
      daysLeft: getDaysUntilMaturity(inv.maturityDate),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (!upcoming.length) return null;

  const nearest = upcoming[0];
  const isUrgent = nearest.daysLeft <= 30;
  const isOverdue = nearest.daysLeft < 0;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold
      ${isOverdue
        ? "bg-red-50 border-red-200 text-red-700"
        : isUrgent
          ? "bg-amber-50 border-amber-200 text-amber-700"
          : "bg-blue-50 border-blue-200 text-blue-700"
      }`}
    >
      <div className={`p-1.5 rounded-lg shrink-0
        ${isOverdue ? "bg-red-100" : isUrgent ? "bg-amber-100" : "bg-blue-100"}`}
      >
        <Calendar className={`w-4 h-4
          ${isOverdue ? "text-red-600" : isUrgent ? "text-amber-600" : "text-blue-600"}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">
          {isOverdue ? "Matured" : "Maturity Countdown"}
        </p>
        <p className="text-sm font-bold truncate">
          {isMounted ? (
            isOverdue
              ? `Matured ${Math.abs(nearest.daysLeft)} days ago`
              : nearest.daysLeft === 0
                ? "Matures today"
                : `${nearest.daysLeft} days remaining`
          ) : "Calculating..."}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] opacity-60 font-bold">
          {isMounted ? new Date(nearest.maturityDate).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric"
          }) : "—"}
        </p>
        <p className="text-[10px] opacity-60 font-bold">{nearest.refNumber}</p>
      </div>
    </div>
  );
};
