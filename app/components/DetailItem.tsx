export const DetailItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
      {icon} {label}
    </p>
    <p className="text-sm font-bold text-gray-700 tracking-tight">{value}</p>
  </div>
);