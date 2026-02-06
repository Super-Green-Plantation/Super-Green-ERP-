export const StatCard = ({ label, value, subText, icon, color }: any) => {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${colors[color]}`}>{icon}</div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
          {label}
        </h3>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-semibold text-slate-900 tracking-tight">
          {value}
        </p>
        <p
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${colors[color]}`}
        >
          {subText}
        </p>
      </div>
    </div>
  );
};