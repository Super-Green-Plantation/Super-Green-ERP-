import { useEffect, useState } from "react";
import { getBranches } from "../../branches/actions";
import { getFinancialPlans } from "../../financial_plans/actions";
import { useFormContext } from "@/app/context/FormContext";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import { Branch } from "@/app/types/branch";
import SignaturePad from "@/app/components/Client/SignaturePad";

const ApplicantDetails = () => {
  const { form } = useFormContext();
  const { register, watch, setValue } = form;

  const [branch, setBranch] = useState<Branch[] | null>(null);
  const [plans, setPlans] = useState<FinancialPlan[] | null>([]);
  const [investmentRates, setInvestmentRates] = useState<number[]>([]);

  const selectedPlanId = watch("investment.planId");

  // Auto-fill rates from plan
  useEffect(() => {
    if (!selectedPlanId) return;
    const plan = plans?.find(p => p.id === Number(selectedPlanId));
    if (!plan) return;

    const years = Math.ceil(plan.duration / 12);
    const defaults: number[] =
      Array.isArray(plan.rate) && plan.rate.length === years
        ? plan.rate
        : Array(years).fill(plan.rate[0] ?? 0);

    setInvestmentRates(defaults);
    setValue("investment.investmentRates", defaults);
  }, [selectedPlanId, plans, setValue]);

  // sync back to form whenever rates change
  useEffect(() => {
    setValue("investment.investmentRates", investmentRates);
  }, [investmentRates, setValue]);

  useEffect(() => { getBranches().then(setBranch); }, []);
  useEffect(() => { getFinancialPlans().then(setPlans); }, []);

  const inputClass = "bg-background/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:bg-background outline-none transition-all w-full placeholder:text-muted-foreground/30 font-medium";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1 block";

  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden text-card-foreground">
      <div className="px-8 py-6 border-b border-border/30 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[0.25em] text-foreground opacity-80">Applicant Information</h2>
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>

      <div className="sm:p-8 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={labelClass}>Full Name</label>
            <input type="text" {...register("applicant.fullName")} placeholder="Legal name as per NIC" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>NIC Number</label>
            <input type="text" {...register("applicant.nic")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Driving License</label>
            <input type="text" {...register("applicant.drivingLicense")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Passport No</label>
            <input type="text" {...register("applicant.passportNo")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <input type="email" {...register("applicant.email")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Mobile Phone</label>
            <input type="text" {...register("applicant.phoneMobile")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Land Phone</label>
            <input type="text" {...register("applicant.phoneLand")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input type="date" {...register("applicant.dateOfBirth")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Occupation</label>
            <input type="text" {...register("applicant.occupation")} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Full Residential Address</label>
            <input type="text" {...register("applicant.address")} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Proposal Form Number</label>
            <input required type="text" {...register("applicant.proposalFormNo")} className={inputClass} />
          </div>

          {/* Financial Calibration */}
          <div className="md:col-span-2 p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Financial Calibration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Investment Amount</label>
                <input
                  type="text"
                  {...register("applicant.investmentAmount")}
                  placeholder="0.00"
                  className={`${inputClass} font-black text-primary text-lg`}
                />
              </div>

              <div>
                <label className={labelClass}>Assigned Branch</label>
                <select
                  className={inputClass}
                  {...register("applicant.branchId", {
                    setValueAs: v => v === "" ? undefined : Number(v),
                  })}
                >
                  <option value="">Choose a branch...</option>
                  {branch?.map(b => <option value={b.id} key={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Target Plan</label>
                <select
                  className={inputClass}
                  {...register("investment.planId", {
                    setValueAs: v => v === "" ? undefined : Number(v),
                  })}
                >
                  <option value="">Choose a Plan...</option>
                  {plans?.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Investment Date</label>
                <input type="date" {...register("applicant.investmentDate")} className={inputClass} />
              </div>
            </div>

            {/* Per-year rate inputs */}
            {investmentRates.length > 0 && (
              <div className="space-y-3">
                <label className={labelClass}>
                  Rate per Year (%)
                  <span className="ml-2 text-primary normal-case font-semibold tracking-normal">
                    {investmentRates.length} year{investmentRates.length > 1 ? "s" : ""}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {investmentRates.map((rate, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground/60 font-bold text-center">
                        Yr {i + 1}
                      </span>
                      <div className={`flex items-center ${inputClass} p-0 overflow-hidden`}>
                        <input
                          type="number"
                          step="0.1"
                          value={rate}
                          onChange={e => {
                            const updated = [...investmentRates];
                            updated[i] = parseFloat(e.target.value) || 0;
                            setInvestmentRates(updated);
                          }}
                          className="flex-1 px-2 py-3 text-sm font-bold bg-transparent outline-none text-center"
                        />
                        <span className="pr-2 text-[11px] text-muted-foreground font-bold">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {investmentRates.length === 0 && (
              <p className="text-xs text-muted-foreground/50 italic">
                Select a plan to configure rates.
              </p>
            )}
          </div>

          <div className="md:col-span-2 pt-4">
            <label className={labelClass}>E-Signature</label>
            <SignaturePad />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetails;