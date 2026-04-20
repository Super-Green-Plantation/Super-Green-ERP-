"use client";

import { useEffect, useState, useRef } from "react";
import { getFinancialPlans } from "@/app/features/financial_plans/actions";
import { getClients } from "@/app/features/clients/actions";
import { createInvestmentForExistingClient } from "@/app/features/investments/actions";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import {
  User, DollarSign, Landmark, Users, Plus,
  Check, Loader2, BanknoteArrowUp, Search, X,
} from "lucide-react";
import { toast } from "sonner";
import Back from "@/app/components/Buttons/Back";
import { createPortal } from "react-dom";

type BeneficiaryMode = "existing" | "new" | "none";
type NomineeMode = "existing" | "new" | "none";

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-border">
      <span className="text-muted-foreground">{icon}</span>
      <h3 className="text-xs font-black text-foreground uppercase tracking-widest">{title}</h3>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, disabled, type = "text", readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </label>
      <div className={`flex items-center border rounded-lg overflow-hidden transition-all bg-card
        ${disabled || readOnly
          ? "border-muted bg-muted/50"
          : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
        }`}
      >
        <input
          type={type}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={e => onChange?.(e.target.value)}
          className="flex-1 px-3 py-2 text-sm font-semibold text-foreground outline-none bg-transparent disabled:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function ModeToggle({ value, onChange }: { value: string; onChange: (v: any) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border">
      {(["none", "existing", "new"] as const).map(mode => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
            ${value === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          {mode === "none" ? "Skip" : mode === "existing" ? "Use Existing" : "Add New"}
        </button>
      ))}
    </div>
  );
}

// Client autocomplete search box
function ClientSearch({
  clients,
  selected,
  onSelect,
}: {
  clients: any[];
  selected: any | null;
  onSelect: (client: any | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length > 0
    ? clients.filter(c =>
        c.fullName.toLowerCase().includes(query.toLowerCase()) ||
        (c.nic ?? "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  // Calculate dropdown position from input element
  const updateDropdownPosition = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (client: any) => {
    onSelect(client);
    setQuery(client.fullName);
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
        Search Client *
      </label>
      <div
        ref={inputRef}
        className="flex items-center border border-border rounded-lg bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all"
      >
        <Search className="ml-3 w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={query}
          placeholder="Type client name or NIC..."
          onChange={e => {
            setQuery(e.target.value);
            updateDropdownPosition();
            setOpen(true);
            if (!e.target.value) onSelect(null);
          }}
          onFocus={() => {
            if (query.trim().length > 0) {
              updateDropdownPosition();
              setOpen(true);
            }
          }}
          className="flex-1 px-3 py-2 text-sm font-semibold text-foreground outline-none bg-transparent"
        />
        {query && (
          <button type="button" onClick={handleClear} className="mr-3 text-muted-foreground hover:text-destructive">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (filtered.length > 0 || query.trim().length > 0) && createPortal(
        <div style={dropdownStyle} className="bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {filtered.length > 0 ? filtered.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={e => e.preventDefault()} // prevent input blur before click registers
              onMouseDown={() => handleSelect(c)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-bold text-foreground">{c.fullName}</p>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight mt-0.5">
                  {[c.nic, c.branch?.name].filter(Boolean).join(" • ")}
                </p>
              </div>
              {selected?.id === c.id && <Check className="w-4 h-4 text-primary shrink-0" />}
            </button>
          )) : (
            <div className="px-4 py-3">
              <p className="text-sm text-muted-foreground italic">No clients found.</p>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
export default function CreateInvestmentForm({ onSuccess }: { onSuccess?: () => void }) {
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Investment fields
  const [planId, setPlanId] = useState("");
  const [amount, setAmount] = useState("");
  const [investmentDate, setInvestmentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [investmentRate, setInvestmentRate] = useState("");

  // Derived display values
  const [totalHarvest, setTotalHarvest] = useState("");
  const [monthlyHarvest, setMonthlyHarvest] = useState("");

  // Beneficiary
  const [beneficiaryMode, setBeneficiaryMode] = useState<BeneficiaryMode>("none");
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<number | null>(null);
  const [newBeneficiary, setNewBeneficiary] = useState({
    fullName: "", nic: "", phone: "", bankName: "",
    bankBranch: "", accountNo: "", relationship: "",
  });

  // Nominee
  const [nomineeMode, setNomineeMode] = useState<NomineeMode>("none");
  const [selectedNomineeId, setSelectedNomineeId] = useState<number | null>(null);
  const [newNominee, setNewNominee] = useState({
    fullName: "", nic: "", permanentAddress: "", postalAddress: "",
  });

  useEffect(() => {
    getClients().then(res => setClients(res.clients));
    getFinancialPlans().then(setPlans);
  }, []);

  // Auto-fill rate when plan changes
  useEffect(() => {
    if (!planId) { setInvestmentRate(""); return; }
    const plan = plans.find(p => p.id === Number(planId));
    if (plan) setInvestmentRate(String(plan.rate));
  }, [planId, plans]);

  // Recalculate harvest preview when amount, rate, or plan changes
  useEffect(() => {
    const plan = plans.find(p => p.id === Number(planId));
    const amt = Number(amount);
    const rate = Number(investmentRate);
    const months = plan?.duration ?? 0;

    if (!amt || !rate || !months) {
      setTotalHarvest("");
      setMonthlyHarvest("");
      return;
    }

    const total = amt * (rate / 100) * (months / 12);
    const monthly = total / months;
    setTotalHarvest(total.toFixed(2));
    setMonthlyHarvest(monthly.toFixed(2));
  }, [amount, investmentRate, planId, plans]);

  const handleClientSelect = (client: any | null) => {
    setSelectedClient(client);
    setBeneficiaryMode("none");
    setSelectedBeneficiaryId(null);
    setNomineeMode("none");
    setSelectedNomineeId(null);
  };

  const handleSubmit = async () => {
    if (!selectedClient) { toast.error("Please select a client"); return; }
    if (!amount) { toast.error("Please enter an amount"); return; }

    setLoading(true);
    try {
      const res = await createInvestmentForExistingClient({
        clientId: selectedClient.id,
        branchId: selectedClient.branchId,
        planId: planId ? Number(planId) : undefined,
        amount: Number(amount),
        investmentDate: investmentDate ? new Date(investmentDate) : new Date(),
        investmentRate: investmentRate ? Number(investmentRate) : undefined,
        beneficiaryId: beneficiaryMode === "existing" ? selectedBeneficiaryId : null,
        nomineeId: nomineeMode === "existing" ? selectedNomineeId : null,
        newBeneficiary: beneficiaryMode === "new" && newBeneficiary.fullName ? newBeneficiary : null,
        newNominee: nomineeMode === "new" && newNominee.fullName ? newNominee : null,
      });

      if (!res.success) { toast.error(res.error ?? "Failed"); return; }
      toast.success("Investment created successfully");
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-5 pb-8 border-b border-border">
        <Back />
        <div className="p-3.5 bg-primary rounded-2xl shadow-xl shadow-primary/10">
          <BanknoteArrowUp className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Create Investment</h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Add a new investment for an existing client.
          </p>
        </div>
      </div>

      {/* Client Search */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border/60">
          <SectionHeader icon={<User className="w-4 h-4 text-primary" />} title="Account Owner" />
        </div>
        <div className="p-6 space-y-4">
          <ClientSearch clients={clients} selected={selectedClient} onSelect={handleClientSelect} />
          {selectedClient && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <Field label="Assigned Branch" value={selectedClient.branch?.name ?? "No Branch"} disabled />
            </div>
          )}
        </div>
      </div>

      {selectedClient && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Investment Details */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-muted/30 border-b border-border/60">
              <SectionHeader icon={<DollarSign className="w-4 h-4 text-accent" />} title="Investment Parameters" />
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Plan */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                  Financial Plan (Optional)
                </label>
                <div className="flex items-center border border-border rounded-lg bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                  <select
                    value={planId}
                    onChange={e => setPlanId(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm font-semibold text-foreground outline-none bg-transparent appearance-none"
                  >
                    <option value="">Select Plan</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.rate}%)</option>
                    ))}
                  </select>
                </div>
              </div>

              <Field
                label="Investment Date *"
                value={investmentDate}
                onChange={setInvestmentDate}
                type="date"
              />

              <Field
                label="Investment Amount (LKR) *"
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
                type="number"
              />

              <Field
                label="Rate (%)"
                value={investmentRate}
                onChange={setInvestmentRate}
                placeholder="e.g. 32"
                type="number"
              />

              {/* Harvest preview — read only, computed client-side */}
              <Field
                label="Monthly Harvest (LKR)"
                value={monthlyHarvest}
                placeholder="—"
                readOnly
              />
              <Field
                label="Total Harvest (LKR)"
                value={totalHarvest}
                placeholder="—"
                readOnly
              />
            </div>
          </div>

          {/* Beneficiary */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-muted/30 border-b border-border/60">
              <SectionHeader icon={<Landmark className="w-4 h-4 text-primary" />} title="Beneficiary" />
            </div>
            <div className="p-6 space-y-5">
              <ModeToggle value={beneficiaryMode} onChange={setBeneficiaryMode} />

              {beneficiaryMode === "existing" && (
                <div className="grid grid-cols-1 gap-3">
                  {selectedClient.beneficiaries?.length > 0 ? (
                    selectedClient.beneficiaries.map((b: any) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBeneficiaryId(b.id)}
                        className={`group flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${selectedBeneficiaryId === b.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/40 hover:bg-muted/30"
                          }`}
                      >
                        <div>
                          <p className={`text-sm font-black ${selectedBeneficiaryId === b.id ? "text-primary" : "text-foreground"}`}>
                            {b.fullName}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tight mt-1">
                            {[b.relationship, b.bankName, b.accountNo].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                        {selectedBeneficiaryId === b.id && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic font-medium">No saved beneficiaries found.</p>
                  )}
                </div>
              )}

              {beneficiaryMode === "new" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-muted/20 rounded-2xl border border-border/50">
                  <div className="sm:col-span-2">
                    <Field label="Full Name" value={newBeneficiary.fullName} onChange={v => setNewBeneficiary(p => ({ ...p, fullName: v }))} />
                  </div>
                  <Field label="NIC" value={newBeneficiary.nic} onChange={v => setNewBeneficiary(p => ({ ...p, nic: v }))} />
                  <Field label="Relationship" value={newBeneficiary.relationship} onChange={v => setNewBeneficiary(p => ({ ...p, relationship: v }))} />
                  <Field label="Phone" value={newBeneficiary.phone} onChange={v => setNewBeneficiary(p => ({ ...p, phone: v }))} />
                  <Field label="Bank Name" value={newBeneficiary.bankName} onChange={v => setNewBeneficiary(p => ({ ...p, bankName: v }))} />
                  <Field label="Bank Branch" value={newBeneficiary.bankBranch} onChange={v => setNewBeneficiary(p => ({ ...p, bankBranch: v }))} />
                  <Field label="Account No." value={newBeneficiary.accountNo} onChange={v => setNewBeneficiary(p => ({ ...p, accountNo: v }))} />
                </div>
              )}
            </div>
          </div>

          {/* Nominee */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-muted/30 border-b border-border/60">
              <SectionHeader icon={<Users className="w-4 h-4 text-accent" />} title="Nominee Details" />
            </div>
            <div className="p-6 space-y-5">
              <ModeToggle value={nomineeMode} onChange={setNomineeMode} />

              {nomineeMode === "existing" && (
                <div className="grid grid-cols-1 gap-3">
                  {selectedClient.nominees?.length > 0 ? (
                    selectedClient.nominees.map((n: any) => (
                      <div
                        key={n.id}
                        onClick={() => setSelectedNomineeId(n.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${selectedNomineeId === n.id
                            ? "border-accent bg-accent/5 ring-1 ring-accent"
                            : "border-border hover:border-accent/40 hover:bg-muted/30"
                          }`}
                      >
                        <div>
                          <p className={`text-sm font-black ${selectedNomineeId === n.id ? "text-accent" : "text-foreground"}`}>
                            {n.fullName}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">
                            {n.permanentAddress}
                          </p>
                        </div>
                        {selectedNomineeId === n.id && (
                          <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-lg shadow-accent/20">
                            <Check className="w-3.5 h-3.5 text-accent-foreground" />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic font-medium">No saved nominees found.</p>
                  )}
                </div>
              )}

              {nomineeMode === "new" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-muted/20 rounded-2xl border border-border/50">
                  <div className="sm:col-span-2">
                    <Field label="Full Name" value={newNominee.fullName} onChange={v => setNewNominee(p => ({ ...p, fullName: v }))} />
                  </div>
                  <Field label="NIC" value={newNominee.nic} onChange={v => setNewNominee(p => ({ ...p, nic: v }))} />
                  <Field label="Permanent Address" value={newNominee.permanentAddress} onChange={v => setNewNominee(p => ({ ...p, permanentAddress: v }))} />
                  <Field label="Postal Address" value={newNominee.postalAddress} onChange={v => setNewNominee(p => ({ ...p, postalAddress: v }))} />
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-primary hover:bg-primary/90 disabled:bg-muted-foreground/20 text-primary-foreground text-xs font-black uppercase tracking-[0.25em] rounded-2xl transition-all hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98]"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Finalizing...</>
              : <><Plus className="w-5 h-5" /> Confirm Investment</>
            }
          </button>
        </div>
      )}
    </div>
  );
}