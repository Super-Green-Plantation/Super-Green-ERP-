import { inputClass, labelClass } from '@/app/const/inputStyles';
import { updateBeneficiary } from '@/app/features/clients/actions';
import { useQueryClient } from '@tanstack/react-query';
import { Landmark, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { updateBeneficiarySchema } from '@/lib/validations/client.schema';

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 ml-1 text-[10px] font-bold text-red-500 tracking-wide">{message}</p>
  ) : null;

interface UpdateBeneficiaryModalProps {
  onClose: () => void;
  initialData: any;
}

const UpdateBeneficiary = ({ onClose, initialData }: UpdateBeneficiaryModalProps) => {
  const [formData, setFormData] = useState<any>({
    beneficiary: {
      id: null,
      fullName: "",
      relationship: "",
      bankName: "",
      accountNo: "",
      bankBranch: "",
      nic: "",
      phone: "",
      ...initialData,
    },
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { id } = useParams();

  const handleChange = (section: string | null, field: string, value: any) => {
    if (section) {
      setFormData((prev: any) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const errClass = (field: string) =>
    `${inputClass} ${fieldErrors[field] ? "!border-red-400 focus:!ring-red-400" : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = updateBeneficiarySchema.safeParse(formData.beneficiary);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[issue.path.length - 1] as string;
        if (!errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      toast.error("Please fix the errors before saving.");
      return;
    }

    await updateBeneficiary(formData.beneficiary);
    queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
    toast.success("Beneficiary updated successfully.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Landmark className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Update Beneficiary
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                Banking & Relationship Details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Beneficiary Name *</label>
                <input
                  value={formData.beneficiary.fullName}
                  onChange={(e) => handleChange("beneficiary", "fullName", e.target.value)}
                  className={errClass("fullName")}
                  placeholder="Enter full name"
                />
                <FieldError message={fieldErrors.fullName} />
              </div>

              <div className="md:col-span-1">
                <label className={labelClass}>Beneficiary NIC</label>
                <input
                  value={formData.beneficiary.nic}
                  onChange={(e) => handleChange("beneficiary", "nic", e.target.value)}
                  className={errClass("nic")}
                  placeholder="000000000V or 200000000000"
                />
                <FieldError message={fieldErrors.nic} />
              </div>

              <div>
                <label className={labelClass}>Relationship</label>
                <input
                  value={formData.beneficiary.relationship}
                  onChange={(e) => handleChange("beneficiary", "relationship", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Spouse"
                />
              </div>

              <div>
                <label className={labelClass}>Bank Name *</label>
                <input
                  value={formData.beneficiary.bankName}
                  onChange={(e) => handleChange("beneficiary", "bankName", e.target.value)}
                  className={errClass("bankName")}
                  placeholder="Bank Name"
                />
                <FieldError message={fieldErrors.bankName} />
              </div>

              <div>
                <label className={labelClass}>Account Number *</label>
                <input
                  value={formData.beneficiary.accountNo}
                  onChange={(e) => handleChange("beneficiary", "accountNo", e.target.value)}
                  className={errClass("accountNo")}
                  placeholder="0000 0000 0000"
                />
                <FieldError message={fieldErrors.accountNo} />
              </div>

              <div>
                <label className={labelClass}>Bank Branch</label>
                <input
                  value={formData.beneficiary.bankBranch}
                  onChange={(e) => handleChange("beneficiary", "bankBranch", e.target.value)}
                  className={inputClass}
                  placeholder="Branch name/code"
                />
              </div>

              <div>
                <label className={labelClass}>Phone</label>
                <input
                  value={formData.beneficiary.phone}
                  onChange={(e) => handleChange("beneficiary", "phone", e.target.value)}
                  className={inputClass}
                  placeholder="07XXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-6 bg-muted/20 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateBeneficiary;