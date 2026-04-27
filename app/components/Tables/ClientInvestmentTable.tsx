import React from 'react';
import { Briefcase, Calendar } from 'lucide-react';

const ClientInvestmentTable = ({ formData }: { formData: any }) => {

  const getCurrentRate = (inv: any): string => {
    const rates: number[] = Array.isArray(inv.investmentRates) ? inv.investmentRates : [];
    if (rates.length === 0) return "N/A";
    if (rates.length === 1) return `${rates[0]}%`;

    const months = inv.plan?.duration ?? 0;
    if (!months) return `${rates[0]}%`;

    const monthsPerYear = months / rates.length;
    const monthsElapsed =
      (new Date().getFullYear() - new Date(inv.investmentDate).getFullYear()) * 12 +
      (new Date().getMonth() - new Date(inv.investmentDate).getMonth());

    const yearIndex = Math.min(
      Math.floor(monthsElapsed / monthsPerYear),
      rates.length - 1
    );

    return `${rates[yearIndex]}% (Yr ${yearIndex + 1})`;
  };

  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="w-full text-left bg-card text-card-foreground">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Investment Details
            </th>
            <th className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Commission Status
            </th>
            <th className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">
              Inve. Plan
            </th>
            <th className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {(formData.investments || []).map((item: any, index: number) => (
            <tr key={index} className="hover:bg-muted/20 transition-all border-b border-border last:border-0">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {item.refNumber || item.id}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.investmentDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className={`px-2.5 py-1 text-[9px] font-bold rounded-md tracking-tighter uppercase ${item.commissionsProcessed
                  ? "bg-green-500/10 text-green-600"
                  : "bg-amber-500/10 text-amber-600"
                  }`}>
                  {item.commissionsProcessed ? "Processed" : "Pending"}
                </span>
              </td>
              <td className="px-6 py-5 text-right font-medium text-muted-foreground text-xs text-nowrap">
                <p>{item.plan?.name || "N/A"}</p>
                <p className="text-foreground font-bold mt-0.5">{getCurrentRate(item)}</p>
              </td>
              <td className="px-6 py-5 text-right">
                <p className="text-base font-bold text-foreground">
                  <span className="text-[10px] mr-1 text-muted-foreground font-normal text-nowrap">Rs.</span>
                  {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-primary text-primary-foreground">
            <td
              colSpan={3}
              className="px-6 py-6 text-right text-[10px] font-bold uppercase tracking-widest"
            >
              Total Portfolio Value
            </td>
            <td className="px-6 py-6 text-right">
              <p className="text-2xl font-bold">
                <span className="text-xs mr-1 font-medium opacity-70">
                  Rs.
                </span>
                {(formData.investments || []).reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ClientInvestmentTable;
