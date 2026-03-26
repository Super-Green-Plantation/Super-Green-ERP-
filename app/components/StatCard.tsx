export const StatCard = ({ label, value, subText, icon, color,children }: any) => {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl scale-110 ${colors[color] || "bg-primary/10 text-primary"}`}>{icon}</div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </h3>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-semibold text-foreground tracking-tight">
          {value}
        </p>
        <p
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${colors[color] || "bg-primary/10 text-primary"}`}
        >
          {subText}
        </p>
      </div>
      {children && (
        <div className="mt-4 pt-4 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
};
