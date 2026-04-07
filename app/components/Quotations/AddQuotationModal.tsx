"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQuotation } from "@/app/features/quotations/actions";

// ─── Types ───────────────────────────────────────────────────────────────────

type PlanType = "CHILD" | "MARGE" | "PENSION";
type PaymentFrequency = "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";
type PlanDuration = number; // years

interface PlanConfig {
  label: string;
  payingTerm: number; // years
  durations: number[];
  minPremium: Record<PaymentFrequency, number>;
  commissionRate: Record<PaymentFrequency, number>;
  maturityRates: Record<PaymentFrequency, number>; // after full term
  earlyWithdrawalRates?: { afterYears: number; rate: number }[];
}

// ─── Plan Definitions ─────────────────────────────────────────────────────────

const PLANS: Record<PlanType, PlanConfig> = {
  CHILD: {
    label: "Child Plan ( )",
    payingTerm: 3,
    durations: [6, 9, 12],
    minPremium: {
      MONTHLY: 15000,
      QUARTERLY: 50000,
      SEMI_ANNUAL: 100000,
      ANNUAL: 200000,
    },
    commissionRate: {
      MONTHLY: 2.5,
      QUARTERLY: 5,
      SEMI_ANNUAL: 7,
      ANNUAL: 8,
    },
    maturityRates: {
      MONTHLY: 15,
      QUARTERLY: 18,
      SEMI_ANNUAL: 21,
      ANNUAL: 24,
    },
    earlyWithdrawalRates: [
      { afterYears: 3, rate: 12 },
      { afterYears: 4, rate: 15 },
      { afterYears: 5, rate: 21 },
    ],
  },
  MARGE: {
    label: "Marge Plan",
    payingTerm: 5,
    durations: [5, 10, 15],
    minPremium: {
      MONTHLY: 15000,
      QUARTERLY: 50000,
      SEMI_ANNUAL: 100000,
      ANNUAL: 200000,
    },
    commissionRate: {
      MONTHLY: 2.5,
      QUARTERLY: 5,
      SEMI_ANNUAL: 7,
      ANNUAL: 8,
    },
    maturityRates: {
      MONTHLY: 15,
      QUARTERLY: 18,
      SEMI_ANNUAL: 21,
      ANNUAL: 24,
    },
    earlyWithdrawalRates: [
      { afterYears: 4, rate: 12 },
      { afterYears: 5, rate: 15 },
      { afterYears: 6, rate: 21 },
    ],
  },
  PENSION: {
    label: "Pension Plan",
    payingTerm: 10,
    durations: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    minPremium: {
      MONTHLY: 15000,
      QUARTERLY: 50000,
      SEMI_ANNUAL: 100000,
      ANNUAL: 200000,
    },
    commissionRate: {
      MONTHLY: 2.5,
      QUARTERLY: 5,
      SEMI_ANNUAL: 7,
      ANNUAL: 8,
    },
    maturityRates: {
      MONTHLY: 0, // calculated by duration
      QUARTERLY: 0,
      SEMI_ANNUAL: 0,
      ANNUAL: 0,
    },
  },
};

// Pension interest rates by duration
const PENSION_RATES: Record<"monthly_quarterly" | "semi_annual_annual", Record<number, number>> = {
  monthly_quarterly: { 1: 6, 2: 9, 3: 12, 4: 15, 5: 18, 6: 20, 7: 20, 8: 20, 9: 20, 10: 20 },
  semi_annual_annual: { 1: 10, 2: 12, 3: 15, 4: 18, 5: 18, 6: 20, 7: 20, 8: 20, 9: 20, 10: 20 },
};

const RETIREMENT_AGES = [35, 40, 45, 50, 55];

const FREQ_LABELS: Record<PaymentFrequency, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly (3 months)",
  SEMI_ANNUAL: "Semi-Annual (6 months)",
  ANNUAL: "Annual",
};

const FREQ_PERIODS: Record<PaymentFrequency, number> = {
  MONTHLY: 12,
  QUARTERLY: 4,
  SEMI_ANNUAL: 2,
  ANNUAL: 1,
};

const DOCUMENT_CHARGE = 500; // Rs. - fixed fee deducted from interest

// ─── Calculation helpers ──────────────────────────────────────────────────────

function getInterestRate(
  planType: PlanType,
  frequency: PaymentFrequency,
  duration: number
): number {
  if (planType === "PENSION") {
    const key =
      frequency === "MONTHLY" || frequency === "QUARTERLY"
        ? "monthly_quarterly"
        : "semi_annual_annual";
    return PENSION_RATES[key][duration] ?? 20;
  }
  return PLANS[planType].maturityRates[frequency];
}

function calcQuotation(
  planType: PlanType,
  frequency: PaymentFrequency,
  premium: number,
  duration: number
) {
  const plan = PLANS[planType];
  const periodsPerYear = FREQ_PERIODS[frequency];
  const payingYears = planType === "PENSION" ? duration : plan.payingTerm;
  const totalPayments = payingYears * periodsPerYear;

  // P = total capital invested (sum of all premiums)
  const totalInvested = premium * totalPayments;

  // R = annual interest rate (%)
  const R = getInterestRate(planType, frequency, duration);

  // T = full plan duration in years (paying term + holding period)
  // For PENSION the duration IS the paying term, no separate holding phase
  const T = duration;

  // Compound interest: A = P × (1 + R/100)^T
  const maturityAmount = totalInvested * Math.pow(1 + R / 100, T);
  const interestEarned = maturityAmount - totalInvested;

  // Document charge deducted from interest
  const netInterestEarned = interestEarned - DOCUMENT_CHARGE;
  const netMaturityAmount = maturityAmount - DOCUMENT_CHARGE;

  const commission = (premium * plan.commissionRate[frequency]) / 100;

  return {
    totalPayments,
    totalInvested,
    interestRate: R,
    interestEarned,
    netInterestEarned,
    maturityAmount,
    netMaturityAmount,
    documentCharge: DOCUMENT_CHARGE,
    commissionPerPayment: commission,
    totalCommission: commission * totalPayments,
    pensionMonthlyPayout:
      planType === "PENSION" ? netMaturityAmount * 0.1 : null,
    pensionPayoutMonths:
      planType === "PENSION" ? 10 : null,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AddQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddQuotationModal = ({ isOpen, onClose }: AddQuotationModalProps) => {
  const queryClient = useQueryClient();

  const [planType, setPlanType] = useState<PlanType>("CHILD");
  const [frequency, setFrequency] = useState<PaymentFrequency>("MONTHLY");
  const [duration, setDuration] = useState<number>(6);
  const [premium, setPremium] = useState<number>(15000);
  const [retirementAge, setRetirementAge] = useState<number>(55);
  const [clientName, setClientName] = useState("");
  const [clientNic, setClientNic] = useState("");
  const [clientAge, setClientAge] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const plan = PLANS[planType];
  const minPremium = plan.minPremium[frequency];

  // Reset duration when plan changes
  useEffect(() => {
    setDuration(PLANS[planType].durations[0]);
    setPremium(PLANS[planType].minPremium[frequency]);
  }, [planType]);

  // Update min premium on frequency change
  useEffect(() => {
    if (premium < plan.minPremium[frequency]) {
      setPremium(plan.minPremium[frequency]);
    }
  }, [frequency]);

  const calc = calcQuotation(planType, frequency, premium, duration);

  const addQuotationMutation = useMutation<unknown, Error, FormData>({
    mutationFn: (payload: FormData) => createQuotation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation saved");
      onClose();
    },
    onError: () => {
      toast.error("Failed to save quotation");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (premium < minPremium) {
      toast.error(`Minimum premium for ${FREQ_LABELS[frequency]} is Rs. ${minPremium.toLocaleString()}`);
      return;
    }
    const payload = new FormData();
    payload.append("planType", planType);
    payload.append("frequency", frequency);
    payload.append("duration", String(duration));
    payload.append("premium", String(premium));
    payload.append("clientName", clientName);
    payload.append("clientNic", clientNic);
    payload.append("clientAge", String(clientAge));
    payload.append("retirementAge", planType === "PENSION" ? String(retirementAge) : "");
    payload.append("totalInvested", String(calc.totalInvested));
    payload.append("maturityAmount", String(calc.netMaturityAmount));
    payload.append("interestRate", String(calc.interestRate));
    payload.append("interestEarned", String(calc.netInterestEarned));
    payload.append("documentCharge", String(calc.documentCharge));
    payload.append("notes", notes);
    addQuotationMutation.mutate(payload);
  };

  if (!isOpen) return null;

  const fmt = (n: number) =>
    "Rs. " + n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">New Quotation</h2>
            <p className="text-sm text-gray-500">Generate a plan quotation for a client</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          {/* ── Plan Type ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Plan Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(PLANS) as PlanType[]).map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPlanType(pt)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                    planType === pt
                      ? "bg-green-600 text-white border-green-600 shadow"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400"
                  }`}
                >
                  {pt === "CHILD" ? "Child Plan" : pt === "MARGE" ? "Marge Plan" : "Pension Plan"}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Paying term: <span className="font-medium text-gray-600">{plan.payingTerm} years</span>
              {planType !== "PENSION" && (
                <> | Durations: {plan.durations.join(", ")} years</>
              )}
            </p>
          </div>

          {/* ── Client Details ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Client Name
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                NIC
              </label>
              <input
                type="text"
                value={clientNic}
                onChange={(e) => setClientNic(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="e.g. 991234567V"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Age {planType === "PENSION" && <span className="text-red-400">(18–50)</span>}
              </label>
              <input
                type="number"
                min={planType === "PENSION" ? 18 : 1}
                max={planType === "PENSION" ? 50 : 99}
                value={clientAge}
                onChange={(e) => setClientAge(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Years"
              />
            </div>
          </div>

          {/* ── Plan Duration ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Plan Duration (Years)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                {plan.durations.map((d) => (
                  <option key={d} value={d}>
                    {d} Year{d > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            {planType === "PENSION" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Retirement Age
                </label>
                <select
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {RETIREMENT_AGES.map((a) => (
                    <option key={a} value={a}>
                      {a} years
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ── Payment Frequency ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Payment Frequency
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(FREQ_LABELS) as PaymentFrequency[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    frequency === f
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-400"
                  }`}
                >
                  <span className="block font-semibold">{FREQ_LABELS[f]}</span>
                  <span className={`text-xs ${frequency === f ? "text-blue-100" : "text-gray-400"}`}>
                    Min {fmt(plan.minPremium[f])} | {plan.commissionRate[f]}% commission
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Premium ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Premium Amount (Rs.)
            </label>
            <input
              type="number"
              required
              min={minPremium}
              step={1000}
              value={premium}
              onChange={(e) => setPremium(Number(e.target.value))}
              className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none ${
                premium < minPremium ? "border-red-400" : "border-gray-200"
              }`}
              placeholder={`Min ${minPremium.toLocaleString()}`}
            />
            {premium < minPremium && (
              <p className="text-xs text-red-500 mt-1">
                Minimum premium is {fmt(minPremium)} for {FREQ_LABELS[frequency]}
              </p>
            )}
          </div>

          {/* ── Quotation Summary Card ── */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">
              Quotation Summary
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <SummaryRow
                label="Plan"
                value={`${PLANS[planType].label} | ${duration}Y`}
              />
              <SummaryRow label="Payment Frequency" value={FREQ_LABELS[frequency]} />
              <SummaryRow label="Premium" value={fmt(premium)} />
              <SummaryRow
                label="Total Payments"
                value={`${calc.totalPayments} payments`}
              />
              <SummaryRow label="Total Invested" value={fmt(calc.totalInvested)} />
              <SummaryRow
                label="Interest Rate"
                value={`${calc.interestRate.toFixed(1)}%`}
                highlight
              />
              <SummaryRow label="Gross Interest Earned" value={fmt(calc.interestEarned)} highlight />
              <SummaryRow label="Document Charge" value={`- ${fmt(calc.documentCharge)}`} />
              <SummaryRow label="Net Interest Earned" value={fmt(calc.netInterestEarned)} highlight />
              <SummaryRow
                label="Net Maturity Amount"
                value={fmt(calc.netMaturityAmount)}
                big
              />
              {planType === "PENSION" && calc.pensionMonthlyPayout != null && (
                <SummaryRow
                  label="Monthly Pension Payout"
                  value={`${fmt(calc.pensionMonthlyPayout)} × 10 months`}
                  highlight
                />
              )}
              <SummaryRow
                label="Commission / Payment"
                value={fmt(calc.commissionPerPayment)}
              />
              <SummaryRow
                label="Total Commission"
                value={fmt(calc.totalCommission)}
              />
            </div>
          </div>

          {/* ── Notes ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
              placeholder="Any additional notes for this quotation..."
            />
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 text-sm"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={addQuotationMutation.isPending || premium < minPremium}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-lg active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addQuotationMutation.isPending ? "Saving..." : "Save Quotation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Small helper ─────────────────────────────────────────────────────────────

const SummaryRow = ({
  label,
  value,
  highlight,
  big,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  big?: boolean;
}) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500">{label}</span>
    <span
      className={`font-semibold ${
        big
          ? "text-green-700 text-base"
          : highlight
          ? "text-green-700"
          : "text-gray-800"
      }`}
    >
      {value}
    </span>
  </div>
);

export default AddQuotationModal;