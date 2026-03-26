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
  <div className="space-y-1.5 min-w-0">
    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] flex items-center gap-2">
      {icon} {label}
    </p>
    <p
      className={`text-sm font-bold text-foreground truncate ${
        isCode
          ? "font-mono bg-muted px-2 py-0.5 rounded-lg border border-border"
          : ""
      }`}
    >
      {value || "—"}
    </p>
  </div>
);
