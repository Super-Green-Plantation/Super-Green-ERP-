"use client";

import { useEffect, useState } from "react";
import { getFinancialPlans } from "@/app/features/financial_plans/actions";
import { getClients } from "@/app/features/clients/actions";
import { createInvestmentForExistingClient } from "@/app/features/investments/actions";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import {
  User, Building2, FileText, DollarSign,
  Landmark, Users, Plus, Check, Loader2,
  BanknoteArrowUp,
} from "lucide-react";
import { toast } from "sonner";
import Back from "@/app/components/Buttons/Back";

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
  label, value, onChange, placeholder, disabled, type = "text",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </label>
      <div className={`flex items-center border rounded-lg overflow-hidden transition-all bg-card
        ${disabled
          ? "border-muted bg-muted/50"
          : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
        }`}
      >
        <input
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={e => onChange?.(e.target.value)}
          className="flex-1 px-3 py-2 text-sm font-semibold text-foreground outline-none bg-transparent disabled:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function SelectField({
  label, value, onChange, children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </label>
      <div className="flex items-center overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all bg-card">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm font-semibold text-foreground outline-none bg-transparent appearance-none"
        >
          {children}
        </select>
      </div>
    </div>
  );
}

function ModeToggle({
  value, onChange, color = "primary",
}: {
  value: string;
  onChange: (v: any) => void;
  color?: string;
}) {
  const active = "bg-primary text-primary-foreground";

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border">
      {(["none", "existing", "new"] as const).map(mode => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
            ${value === mode ? active : "text-muted-foreground hover:text-foreground"}`}
        >
          {mode === "none" ? "Skip" : mode === "existing" ? "Use Existing" : "Add New"}
        </button>
      ))}
    </div>
  );
}

export default function CreateInvestmentForm({ onSuccess }: { onSuccess?: () => void }) {
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState("");
  const [amount, setAmount] = useState("");

  const [beneficiaryMode, setBeneficiaryMode] = useState<BeneficiaryMode>("none");
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<number | null>(null);
  const [newBeneficiary, setNewBeneficiary] = useState({
    fullName: "", nic: "", phone: "", bankName: "",
    bankBranch: "", accountNo: "", relationship: "",
  });

  const [nomineeMode, setNomineeMode] = useState<NomineeMode>("none");
  const [selectedNomineeId, setSelectedNomineeId] = useState<number | null>(null);
  const [newNominee, setNewNominee] = useState({
    fullName: "", permanentAddress: "", postalAddress: "",
  });

  useEffect(() => {
    getClients().then(res => setClients(res.clients));
    getFinancialPlans().then(setPlans);
  }, []);

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === Number(clientId));
    setSelectedClient(client ?? null);
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
      {/* Header Section */}
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

      {/* Client Selection - Always Visible */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border/60">
          <SectionHeader
            icon={<User className="w-4 h-4 text-primary" />}
            title="Account Owner"
          />
        </div>
        <div className="p-6 space-y-4">
          <SelectField
            label="Select Client *"
            value={selectedClient?.id?.toString() ?? ""}
            onChange={handleClientChange}
           
          >
            <option value="" disabled>Choose a client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.fullName} — {c.nic ?? "No NIC"}
              </option>
            ))}
          </SelectField>

          {selectedClient && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <Field
                label="Assigned Branch"
                value={selectedClient.branch?.name ?? "No Branch Assigned"}
                disabled
                
              />
            </div>
          )}
        </div>
      </div>

      {selectedClient && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Investment Details */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-muted/30 border-b border-border/60">
              <SectionHeader
                icon={<DollarSign className="w-4 h-4 text-accent" />}
                title="Investment Parameters"
              />
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SelectField label="Financial Plan (Optional)" value={planId} onChange={setPlanId}>
                <option value="">Standard Growth Plan</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.rate}%)</option>
                ))}
              </SelectField>
              <Field
                label="Investment Amount (LKR) *"
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
                type="number"
                
              />
            </div>
          </div>

          {/* Beneficiary Selection */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-muted/30 border-b border-border/60">
              <SectionHeader
                icon={<Landmark className="w-4 h-4 text-primary" />}
                title="Beneficiary"
              />
            </div>
            <div className="p-6 space-y-5">
              <ModeToggle value={beneficiaryMode} onChange={setBeneficiaryMode} color="primary" />

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
                  <Field label="Relationship" value={newBeneficiary.relationship} onChange={v => setNewBeneficiary(p => ({ ...p, relationship: v }))} />
                  <Field label="Phone" value={newBeneficiary.phone} onChange={v => setNewBeneficiary(p => ({ ...p, phone: v }))} />
                  <Field label="Bank Name" value={newBeneficiary.bankName} onChange={v => setNewBeneficiary(p => ({ ...p, bankName: v }))} />
                  <Field label="Account No." value={newBeneficiary.accountNo} onChange={v => setNewBeneficiary(p => ({ ...p, accountNo: v }))} />
                </div>
              )}
            </div>
          </div>

          {/* Nominee Selection */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-muted/30 border-b border-border/60">
              <SectionHeader
                icon={<Users className="w-4 h-4 text-accent" />}
                title="Nominee Details"
              />
            </div>
            <div className="p-6 space-y-5">
              <ModeToggle value={nomineeMode} onChange={setNomineeMode} color="accent" />

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
            </div>
          </div>

          {/* Final Action */}
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
