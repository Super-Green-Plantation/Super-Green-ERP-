"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Landmark,
  Users,
  Briefcase,
  MapPin,
} from "lucide-react";
import { getPlanDetails, getPlans } from "@/app/services/plans.service";
import { FinancialPlan } from "@/app/types/FinancialPlan";

interface UpdateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
  onUpdate: (updatedData: any) => void;
}

const UpdateClientModal = ({
  isOpen,
  onClose,
  initialData,
  onUpdate,
}: UpdateClientModalProps) => {
  const [formData, setFormData] = useState<any>(initialData);
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  console.log(formData);

  if (!isOpen) return null;

  useEffect(() => {
    const fetchAllPlans = async () => {
      const res = await getPlans();
      setPlans(res); // all plans
      console.log("all from model", res);
    };

    fetchAllPlans();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  const inputClass =
    "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
  const labelClass =
    "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Modify Investment Record
            </h2>
            <p className="text-xs text-gray-500">
              Update client profile and beneficiary links
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-8 space-y-10"
        >
          {/* Section 1: Client Personal Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">
                Personal Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Full Name</label>
                <input
                  value={formData.applicant.fullName}
                  onChange={(e) =>
                    handleChange(null, "fullName", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>NIC Number</label>
                <input
                  value={formData.applicant.nic}
                  onChange={(e) => handleChange(null, "nic", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  value={formData.applicant.email}
                  onChange={(e) => handleChange(null, "email", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mobile Phone</label>
                <input
                  value={formData.applicant.phoneMobile}
                  onChange={(e) =>
                    handleChange(null, "phoneMobile", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Occupation</label>
                <input
                  value={formData.applicant.occupation}
                  onChange={(e) =>
                    handleChange(null, "occupation", e.target.value)
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
                    handleChange(null, "address", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Investment Settings */}
          <div className="space-y-6 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">
                Financial Configuration
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  value={Number(formData.applicant.investmentAmount) || ""}
                  onChange={(e) =>
                    handleChange(null, "investmentAmount", e.target.value)
                  }
                  className={`${inputClass} font-bold text-blue-700`}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Beneficiary Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">
                Beneficiary (Bank Details)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Beneficiary Name</label>
                <input
                  value={formData.beneficiary?.fullName}
                  onChange={(e) =>
                    handleChange("beneficiary", "fullName", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Relationship</label>
                <input
                  value={formData.beneficiary?.relationship}
                  onChange={(e) =>
                    handleChange("beneficiary", "relationship", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Bank Name</label>
                <input
                  value={formData.beneficiary?.bankName}
                  onChange={(e) =>
                    handleChange("beneficiary", "bankName", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input
                  value={formData.beneficiary?.accountNo}
                  onChange={(e) =>
                    handleChange("beneficiary", "accountNo", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Bank Branch</label>
                <input
                  value={formData.beneficiary?.bankBranch}
                  onChange={(e) =>
                    handleChange("beneficiary", "bankBranch", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Nominee Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <Users className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">
                Nominee Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nominee Full Name</label>
                <input
                  value={formData.nominee?.fullName}
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
                    value={formData.nominee?.permanentAddress}
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
                    value={formData.nominee?.postalAddress}
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

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateClientModal;
