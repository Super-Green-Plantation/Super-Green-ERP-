"use client";

import React, { useEffect, useState } from "react";
import { getFinancialPlans } from "@/app/features/financial_plans/actions";
import { FinancialPlan } from "@/app/types/FinancialPlan";
import { X, Save, User, Briefcase, Landmark, Users } from "lucide-react";
import { updateClient } from "@/app/features/clients/actions";

interface UpdateClientModalProps {
  isOpen: boolean;
  id:number
  onClose: () => void;
  initialData: any;
  onUpdate: (updatedData: any) => void;
}

const UpdateClientModal = ({
  isOpen,
  id,
  onClose,
  initialData,
  onUpdate,
}: UpdateClientModalProps) => {
  // Initialize formData with safe defaults
  const [formData, setFormData] = useState<any>({
    applicant: {
      fullName: "",
      nic: "",
      email: "",
      phoneMobile: "",
      occupation: "",
      address: "",
      drivingLicense: "",
      passportNo: "",
      proposalFormNo: "",
      phoneLand: "",
      ...initialData.applicant,
      investmentAmount: initialData?.applicant?.investmentAmount
        ? initialData.applicant.investmentAmount.toString().trim()
        : "",
    },
    investment: {
      planId: initialData?.investment?.planId || "",
      ...initialData.investment,
    },
    beneficiary: {
      fullName: "",
      relationship: "",
      bankName: "",
      accountNo: "",
      bankBranch: "",
      ...initialData.beneficiary,
    },
    nominee: {
      fullName: "",
      permanentAddress: "",
      postalAddress: "",
      ...initialData.nominee,
    },
  });

  const [plans, setPlans] = useState<FinancialPlan[]>([]);

  if (!isOpen) return null;

  // Fetch all plans
  useEffect(() => {
    const fetchPlans = async () => {
      const res = await getFinancialPlans();
      setPlans(res);
    };
    fetchPlans();
  }, []);

  const handleChange = (section: string | null, field: string, value: any) => {
    if (section) {
      setFormData((prev: any) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert investmentAmount to number and clean phone numbers before sending
    const payload = {
      ...formData,
      applicant: {
        ...formData.applicant,
        investmentAmount: Number(
          formData.applicant.investmentAmount?.toString().trim() || 0,
        ),
        // Ensure we only store the numeric part of the phone numbers
        phoneMobile: formData.applicant.phoneMobile?.toString().replace(/\D/g, "").slice(-9),
        phoneLand: formData.applicant.phoneLand?.toString().replace(/\D/g, "").slice(-9),
      },
    };

    onUpdate(payload);
    onClose();
  };

  console.log("datttttttttttt",formData);
  

  const inputClass =
    "w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30";
  const labelClass =
    "block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 ml-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-border overflow-hidden flex flex-col scale-in-center">
        {/* Header */}
        <div className="px-10 py-8 border-b border-border flex justify-between items-center bg-card sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight">
              Update Client Profile
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Refined data management for enterprise records
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-8 space-y-10"
        >
          {/* Personal Info */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
                Applicant Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Full Name</label>
                <input
                  value={formData.applicant.fullName}
                  onChange={(e) =>
                    handleChange("applicant", "fullName", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>NIC Number</label>
                <input
                  value={formData.applicant.nic}
                  onChange={(e) =>
                    handleChange("applicant", "nic", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Driving License</label>
                <input
                  value={formData.applicant.drivingLicense}
                  onChange={(e) =>
                    handleChange("applicant", "drivingLicense", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Passport No</label>
                <input
                  value={formData.applicant.passportNo}
                  onChange={(e) =>
                    handleChange("applicant", "passportNo", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  value={formData.applicant.email}
                  onChange={(e) =>
                    handleChange("applicant", "email", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mobile Phone</label>
                <div className="flex items-center h-full">
                  <span className="h-full flex items-center px-4 bg-muted border border-r-0 border-border rounded-l-xl text-muted-foreground text-sm font-bold">
                    +94
                  </span>
                  <input
                    value={formData.applicant.phoneMobile}
                    onChange={(e) =>
                      handleChange("applicant", "phoneMobile", e.target.value)
                    }
                    className={`${inputClass} rounded-l-none`}
                    placeholder="7XXXXXXXX"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Land Phone</label>
                <div className="flex items-center h-full">
                  <span className="h-full flex items-center px-4 bg-muted border border-r-0 border-border rounded-l-xl text-muted-foreground text-sm font-bold">
                    +94
                  </span>
                  <input
                    value={formData.applicant.phoneLand}
                    onChange={(e) =>
                      handleChange("applicant", "phoneLand", e.target.value)
                    }
                    className={`${inputClass} rounded-l-none`}
                    placeholder="1XXXXXXXX"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Occupation</label>
                <input
                  value={formData.applicant.occupation}
                  onChange={(e) =>
                    handleChange("applicant", "occupation", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-3">
                <label className={labelClass}>Permanent Address</label>
                <textarea
                  rows={2}
                  value={formData.applicant.address}
                  onChange={(e) =>
                    handleChange("applicant", "address", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-3">
                <label className={labelClass}>Proposal Form Number</label>
                <input
                  type="text"
                  value={formData.applicant.proposalFormNo}
                  onChange={(e) =>
                    handleChange("applicant", "proposalFormNo", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

            </div>
          </div>

          {/* Financial Configuration */}
          <div className="space-y-8 bg-primary/5 p-8 rounded-3xl border border-primary/10">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
                Portfolio Configuration
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>Select Investment Plan</label>
                <select
                  value={formData.investment.planId}
                  onChange={(e) =>
                    handleChange("investment", "planId", e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Choose a plan...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Investment Amount (LKR)</label>
                <input
                  type="number"
                  value={formData.applicant.investmentAmount}
                  onChange={(e) =>
                    handleChange(
                      "applicant",
                      "investmentAmount",
                      e.target.value,
                    )
                  }
                  className={`${inputClass} font-bold text-blue-700`}
                />
              </div>
            </div>
          </div>

          {/* Beneficiary */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <Landmark className="w-5 h-5 text-emerald-600" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
                Beneficiary Banking
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Beneficiary Name</label>
                <input
                  value={formData.beneficiary.fullName}
                  onChange={(e) =>
                    handleChange("beneficiary", "fullName", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Relationship</label>
                <input
                  value={formData.beneficiary.relationship}
                  onChange={(e) =>
                    handleChange("beneficiary", "relationship", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Bank Name</label>
                <input
                  value={formData.beneficiary.bankName}
                  onChange={(e) =>
                    handleChange("beneficiary", "bankName", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input
                  value={formData.beneficiary.accountNo}
                  onChange={(e) =>
                    handleChange("beneficiary", "accountNo", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Bank Branch</label>
                <input
                  value={formData.beneficiary.bankBranch}
                  onChange={(e) =>
                    handleChange("beneficiary", "bankBranch", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Nominee */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
                Nominee Registry
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nominee Full Name</label>
                <input
                  value={formData.nominee.fullName}
                  onChange={(e) =>
                    handleChange("nominee", "fullName", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Permanent Address</label>
                  <input
                    value={formData.nominee.permanentAddress}
                    onChange={(e) =>
                      handleChange(
                        "nominee",
                        "permanentAddress",
                        e.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Postal Address</label>
                  <input
                    value={formData.nominee.postalAddress}
                    onChange={(e) =>
                      handleChange("nominee", "postalAddress", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-border bg-muted/30 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-10 py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2.5 active:scale-95"
          >
            <Save className="w-4 h-4" /> Finalize Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateClientModal;
