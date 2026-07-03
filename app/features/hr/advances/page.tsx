"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { issueSalaryAdvance, getMembersForAdvance, getAdvancesList } from "./advance-actions";
import Heading from "@/app/components/Heading";
import Back from "@/app/components/Buttons/Back";

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function SalaryAdvancePage() {
  const [members, setMembers] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [memberId, setMemberId] = useState<number | "">("");
  const [type, setType] = useState<"SALARY" | "FESTIVAL">("SALARY");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [installments, setInstallments] = useState<number>(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    getMembersForAdvance().then(setMembers);
    refreshAdvances();
  }, []);

  const refreshAdvances = async () => {
    const data = await getAdvancesList();
    setAdvances(data);
  };

  // Salary advance always 1 installment; festival defaults to 3 but editable
  const handleTypeChange = (newType: "SALARY" | "FESTIVAL") => {
    setType(newType);
    setInstallments(newType === "SALARY" ? 1 : 3);
  };

  const handleSubmit = async () => {
    if (!memberId || totalAmount <= 0 || installments <= 0) {
      toast.error("Fill all fields correctly");
      return;
    }
    setLoading(true);
    try {
      await issueSalaryAdvance({
        memberId: Number(memberId),
        type,
        totalAmount,
        installments,
        note: note || undefined,
      });
      toast.success("Advance issued");
      setMemberId("");
      setTotalAmount(0);
      setNote("");
      await refreshAdvances();
    } catch {
      toast.error("Failed to issue advance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-8 flex flex-col gap-8">
      <Back/> <Heading>Salary & Festival Advances</Heading>

      {/* Issue form */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 max-w-xl">
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Employee</label>
          <select
            className="w-full mt-1 px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm font-bold"
            value={memberId}
            onChange={(e) => setMemberId(Number(e.target.value))}
          >
            <option value="">Select employee</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.nameWithInitials ?? m.name} ({m.empNo})</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleTypeChange("SALARY")}
            className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase border ${type === "SALARY" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border"}`}
          >
            Salary Advance
          </button>
          <button
            onClick={() => handleTypeChange("FESTIVAL")}
            className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase border ${type === "FESTIVAL" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border"}`}
          >
            Festival Advance
          </button>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Total Amount</label>
          <input
            type="number"
            className="w-full mt-1 px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm font-bold"
            value={totalAmount || ""}
            onChange={(e) => setTotalAmount(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Installments (months) {type === "SALARY" && "— fixed at 1 for salary advance"}
          </label>
          <input
            type="number"
            min={1}
            disabled={type === "SALARY"}
            className="w-full mt-1 px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm font-bold disabled:opacity-50"
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
          />
          {installments > 0 && totalAmount > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              ≈ {fmt(totalAmount / installments)} / month
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Note (optional)</label>
          <input
            type="text"
            className="w-full mt-1 px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-xl disabled:opacity-50"
        >
          Issue Advance
        </button>
      </div>

      {/* Existing advances list */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase text-muted-foreground">Employee</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase text-muted-foreground">Type</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase text-muted-foreground">Total</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase text-muted-foreground">Remaining</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase text-muted-foreground">Monthly</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase text-muted-foreground">Issued</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {advances.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-bold">{a.member?.nameWithInitials ?? a.member?.empNo}</td>
                <td className="px-4 py-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${a.type === "FESTIVAL" ? "bg-orange-500/10 text-orange-600" : "bg-blue-500/10 text-blue-600"}`}>
                    {a.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold">{fmt(a.totalAmount)}</td>
                <td className="px-4 py-3 text-right font-bold">{fmt(a.remainingAmount)}</td>
                <td className="px-4 py-3 text-right">{fmt(a.installmentAmount)}</td>
                <td className="px-4 py-3">{a.issuedYear}-{String(a.issuedMonth).padStart(2, "0")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}