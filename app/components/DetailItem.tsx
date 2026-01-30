export const DetailItem = ({
  label,
  value,
  icon,
  isCode,
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
  isCode?: boolean;
}) => (
  <div className="space-y-1.5">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
      {icon} {label}
    </p>
    <p
        className={`text-sm font-semibold text-gray-700 ${
          isCode
            ? "font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100"
            : ""
        }`}
      >
        {value || "—"}
      </p>
  </div>
);
