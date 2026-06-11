import { Clock, CheckCircle, XCircle } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  amountFormatted?: string;
  amountLabel?: string;
  color: "amber" | "emerald" | "red";
  onClick?: () => void;
}

export const StatCard = ({
  icon,
  label,
  value,
  amountFormatted,
  amountLabel,
  color,
  onClick,
}: StatCardProps) => {
  const bgColor = {
    amber: "bg-amber-500/10",
    emerald: "bg-emerald-500/10",
    red: "bg-red-500/10",
  }[color];

  const textColor = {
    amber: "text-amber-500",
    emerald: "text-emerald-500",
    red: "text-red-500",
  }[color];

  return (
    <div
      className={`bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] p-6 flex flex-col gap-2 group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer`}
      onClick={onClick}
    >
      <div className={`w-8 h-8 rounded-xl ${bgColor} flex items-center justify-center`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-foreground tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {amountFormatted && amountLabel && (
        <p className={`${textColor} font-bold`}>
          {amountLabel}: {amountFormatted}
        </p>
      )}
    </div>
  );
};