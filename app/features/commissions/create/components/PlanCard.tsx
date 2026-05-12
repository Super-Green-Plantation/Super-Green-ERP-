import React from "react";

const PlanCard = ({ plans }: { plans: any[] }) => {
  return (
    <div className="space-y-6">
  <div className="flex items-center gap-2 px-1">
    <div className="h-4 w-1 bg-blue-600 rounded-full" />
    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
      Active Plan
    </h2>
  </div>

  {!plans || plans.length === 0 ? (
    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl text-muted-foreground/70 bg-muted/30">
      <span className="text-sm font-medium">No active investment plans</span>
    </div>
  ) : (
    plans.map((p: any) => (
      <div
        key={p.id}
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
      >
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="uppercase text-lg font-bold text-foreground tracking-tight">
                {p.name}
              </h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter italic">
                {p.description}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
              {p.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-wider">
                Investment Value
              </p>
              <p className="text-xl font-extrabold text-blue-900">
                <span className="text-sm font-semibold mr-1 text-primary/60">Rs.</span>
                {p.investment?.toLocaleString() ?? "0"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-wider">
                Returns
              </p>
              <p className="text-xl font-extrabold text-primary">
                {p.rate}% <span className="text-[10px] font-medium text-muted-foreground/70 ml-1">p.a</span>
              </p>
            </div>

            <div className="pt-4 border-t border-border/50 col-span-2 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-wider">
                  Maturity Period
                </p>
                <p className="text-sm font-bold text-foreground">
                  {p.duration} <span className="font-normal text-muted-foreground">Months</span>
                </p>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    ))
  )}
</div>
  );
};

export default PlanCard;
