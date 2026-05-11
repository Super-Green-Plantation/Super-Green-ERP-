export function FloatingKpiCard({ icon, title, value, subValue, trend }: { icon: React.ReactNode, title: string, value: string, subValue: string, trend: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-[2rem] p-6 flex flex-col shadow-sm group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
      <div className={`w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center shrink-0 mb-6 group-hover:text-white transition-all duration-500 shadow-inner border border-border/20`}>
        <div className="group-hover:scale-110 transition-all duration-500 text-primary">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-[10px] font-bold text-muted-foreground/40 mb-2 uppercase tracking-[0.2em] leading-none">{title}</h3>
        <p className="text-2xl font-bold text-foreground tracking-tighter mb-2 group-hover:text-primary transition-colors">{value}</p>
        <div className="flex items-center gap-1.5">
          {trend === 'up' && <div className="w-1 h-1 rounded-full bg-emerald-500"></div>}
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">{subValue}</p>
        </div>
      </div>
    </div>
  );
}