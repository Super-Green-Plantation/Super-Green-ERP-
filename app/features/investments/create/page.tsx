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
    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
      <span className="text-slate-500">{icon}</span>
      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">{title}</h3>
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
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </label>
      <div className={`flex items-center border rounded-lg overflow-hidden transition-all bg-white
        ${disabled
          ? "border-slate-100 bg-slate-50"
          : "border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
        }`}
      >
        <input
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={e => onChange?.(e.target.value)}
          className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 outline-none bg-transparent disabled:text-slate-400 disabled:bg-slate-50"
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
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </label>
      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 outline-none bg-white appearance-none"
        >
          {children}
        </select>
      </div>
    </div>
  );
}

function ModeToggle({
  value, onChange, color = "slate",
}: {
  value: string;
  onChange: (v: any) => void;
  color?: "slate" | "emerald" | "violet";
}) {
  const active = {
    slate: "bg-slate-900 text-white",
    emerald: "bg-emerald-600 text-white",
    violet: "bg-violet-600 text-white",
  }[color];

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
      {(["none", "existing", "new"] as const).map(mode => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all
            ${value === mode ? active : "text-slate-500 hover:text-slate-700"}`}
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
    <div className="space-y-5 max-w-7xl mx-auto">

      <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <Back />
        <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20">
          <BanknoteArrowUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Investment</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Add a new investment for an existing client.</p>
        </div>
        <div className="ml-auto">
        </div>
    </div>
      {/* Client select */ }
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-100">
      <SectionHeader icon={<User className="w-4 h-4" />} title="Client" />
    </div>
    <div className="px-5 py-4 space-y-4">
      <SelectField label="Select Client *" value={selectedClient?.id?.toString() ?? ""} onChange={handleClientChange}>
        <option value="" disabled>Choose a client...</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>
            {c.fullName} ({c.nic ?? "no NIC"})
          </option>
        ))}
      </SelectField>

      {selectedClient && (
        <Field
          label="Branch"
          value={selectedClient.branch?.name ?? ""}
          disabled
        />
      )}
    </div>
  </div>

  {
    selectedClient && (
      <>
        {/* Investment details */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <SectionHeader icon={<DollarSign className="w-4 h-4 text-blue-500" />} title="Investment Details" />
          </div>
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Financial Plan (Optional)" value={planId} onChange={setPlanId}>
              <option value="">Choose a plan...</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </SelectField>
            <Field
              label="Investment Amount (LKR) *"
              value={amount}
              onChange={setAmount}
              placeholder="e.g. 500000"
              type="number"
            />
          </div>
        </div>

        {/* Beneficiary */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <SectionHeader icon={<Landmark className="w-4 h-4 text-emerald-500" />} title="Beneficiary" />
          </div>
          <div className="px-5 py-4 space-y-4">
            <ModeToggle value={beneficiaryMode} onChange={setBeneficiaryMode} color="emerald" />

            {beneficiaryMode === "existing" && (
              selectedClient.beneficiaries?.length > 0 ? (
                <div className="space-y-2">
                  {selectedClient.beneficiaries.map((b: any) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBeneficiaryId(b.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                          ${selectedBeneficiaryId === b.id
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800">{b.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {[b.relationship, b.bankName, b.accountNo].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      {selectedBeneficiaryId === b.id && (
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">No existing beneficiaries for this client.</p>
              )
            )}

            {beneficiaryMode === "new" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="sm:col-span-2">
                  <Field label="Full Name" value={newBeneficiary.fullName}
                    onChange={v => setNewBeneficiary(p => ({ ...p, fullName: v }))} />
                </div>
                <Field label="Relationship" value={newBeneficiary.relationship}
                  onChange={v => setNewBeneficiary(p => ({ ...p, relationship: v }))} />
                <Field label="Phone" value={newBeneficiary.phone}
                  onChange={v => setNewBeneficiary(p => ({ ...p, phone: v }))} />
                <Field label="Bank Name" value={newBeneficiary.bankName}
                  onChange={v => setNewBeneficiary(p => ({ ...p, bankName: v }))} />
                <Field label="Account No." value={newBeneficiary.accountNo}
                  onChange={v => setNewBeneficiary(p => ({ ...p, accountNo: v }))} />
                <Field label="Bank Branch" value={newBeneficiary.bankBranch}
                  onChange={v => setNewBeneficiary(p => ({ ...p, bankBranch: v }))} />
                <Field label="NIC (Optional)" value={newBeneficiary.nic}
                  onChange={v => setNewBeneficiary(p => ({ ...p, nic: v }))} />
              </div>
            )}
          </div>
        </div>

        {/* Nominee */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <SectionHeader icon={<Users className="w-4 h-4 text-violet-500" />} title="Nominee" />
          </div>
          <div className="px-5 py-4 space-y-4">
            <ModeToggle value={nomineeMode} onChange={setNomineeMode} color="violet" />

            {nomineeMode === "existing" && (
              selectedClient.nominees?.length > 0 ? (
                <div className="space-y-2">
                  {selectedClient.nominees.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNomineeId(n.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                          ${selectedNomineeId === n.id
                          ? "border-violet-300 bg-violet-50/50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800">{n.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{n.permanentAddress}</p>
                      </div>
                      {selectedNomineeId === n.id && (
                        <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">No existing nominees for this client.</p>
              )
            )}

            {nomineeMode === "new" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="sm:col-span-2">
                  <Field label="Full Name" value={newNominee.fullName}
                    onChange={v => setNewNominee(p => ({ ...p, fullName: v }))} />
                </div>
                <Field label="Permanent Address" value={newNominee.permanentAddress}
                  onChange={v => setNewNominee(p => ({ ...p, permanentAddress: v }))} />
                <Field label="Postal Address (Optional)" value={newNominee.postalAddress}
                  onChange={v => setNewNominee(p => ({ ...p, postalAddress: v }))} />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-slate-900/20"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            : <><Plus className="w-4 h-4" /> Create Investment</>
          }
        </button>
      </>
    )
  }
    </div >
  );
}
