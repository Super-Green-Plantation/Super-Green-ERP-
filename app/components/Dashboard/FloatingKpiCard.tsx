export function FloatingKpiCard({ icon, title, value, subValue, trend, trendValue }: { icon: React.ReactNode, title: string, value: string, subValue: string, trend: 'up' | 'down' | 'neutral', trendValue?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-colors duration-300 min-h-[130px]">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{title}</h3>
        <div className="text-[#0f5132] dark:text-[#4ade80] bg-[#f0f9f4] dark:bg-[#064e3b] p-1.5 rounded-md">
          {icon}
        </div>
      </div>
      
      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-none">{value}</p>
          {trend === 'up' && <span className="text-xs font-bold text-[#0f5132] dark:text-[#4ade80] flex items-center">{trendValue || "+5"}</span>}
        </div>
        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{subValue}</p>
      </div>
    </div>
  );
}