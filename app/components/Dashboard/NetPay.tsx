import { BanknoteArrowUp } from "lucide-react";

interface NetPayProps {
  netPay: number;
  isMounted: boolean;
  formatCurrency: (amount: number) => string;
}

export const NetPay = ({ netPay, isMounted, formatCurrency }: NetPayProps) => {
  if (!isMounted || netPay <= 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <BanknoteArrowUp className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Net pay this month
          </p>
          <p className="text-lg font-black text-foreground tabular-nums mt-0.5">
            {formatCurrency(netPay)}
          </p>
        </div>
      </div>
    </div>
  );
};