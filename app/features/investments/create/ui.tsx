"use client";

import React from "react";

export function SectionHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="md:flex items-center justify-between border-b border-border pb-3 mb-1">
      <div className="flex items-center gap-2 text-primary font-semibold">
        <span className="shrink-0">{icon}</span>
        <span className="text-[18px] font-semibold uppercase tracking-tight">{title}</span>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  disabled,
  readOnly,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-muted-foreground uppercase block">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={e => onChange?.(e.target.value)}
          className={`w-full border rounded-lg text-sm py-2 px-3 transition-colors outline-none focus:ring-1 ${disabled || readOnly
              ? "bg-muted/50 border-border cursor-not-allowed text-muted-foreground focus:ring-0 focus:border-border"
              : error
                ? "bg-card border-red-500 focus:ring-red-500 focus:border-red-500"
                : "bg-card border-border focus:ring-primary focus:border-primary"
            }`}
        />
      </div>
      {error && (
        <p className="mt-1 ml-1 text-[10px] font-bold text-red-500 tracking-wide">{error}</p>
      )}
    </div>
  );
}

export function ModeToggle({ value, onChange }: { value: string; onChange: (v: any) => void }) {
  return (
    <div className="flex p-1 bg-muted/50 rounded-lg gap-1">
      {(["none", "existing", "new"] as const).map(mode => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`px-4 py-1.5 text-[11px] font-semibold rounded-md transition-all uppercase ${value === mode
              ? "bg-primary text-primary-foreground shadow-sm font-bold"
              : "text-muted-foreground hover:bg-background hover:shadow-sm"
            }`}
        >
          {mode === "none" ? "Skip" : mode === "existing" ? "Use Existing" : "Add New"}
        </button>
      ))}
    </div>
  );
}
