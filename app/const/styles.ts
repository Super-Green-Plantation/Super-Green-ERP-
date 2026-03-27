  export const inputStyles =
    "w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/30";
  export const inputStylesNoIcon =
    "w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/30";
  export const labelStyles =
    "block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 ml-1";
  export const tabBtn = (active: boolean) =>
    `px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${active
      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;
