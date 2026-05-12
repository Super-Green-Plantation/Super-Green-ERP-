import React, { useState } from 'react';
import { Users, X } from 'lucide-react';
import { updateNominee } from '@/app/features/clients/actions';
import { inputClass, labelClass } from '@/app/const/inputStyles';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { updateNomineeSchema } from '@/lib/validations/client.schema';

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 ml-1 text-[10px] font-bold text-red-500 tracking-wide">{message}</p>
  ) : null;

interface UpdateNomineeModalProps {
  onClose: () => void;
  initialData: any;
}

export const UpdateNominee = ({ onClose, initialData }: UpdateNomineeModalProps) => {
  const queryClient = useQueryClient();
  const { id } = useParams();

  const [formData, setFormData] = useState<any>({
    nominee: {
      id: initialData?.id || null,
      fullName: initialData?.fullName || "",
      nic: initialData?.nic || "",
      permanentAddress: initialData?.permanentAddress || "",
      postalAddress: initialData?.postalAddress || "",
    },
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (section: string, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const errClass = (field: string) =>
    `${inputClass} ${fieldErrors[field] ? "!border-red-400 focus:!ring-red-400" : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = updateNomineeSchema.safeParse(formData.nominee);
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

    await updateNominee(formData.nominee);
    queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
    toast.success("Nominee updated successfully.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Nominee Registry
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                Manage legal representative details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className={labelClass}>Nominee Full Name *</label>
                <input
                  type="text"
                  value={formData.nominee.fullName}
                  onChange={(e) => handleChange("nominee", "fullName", e.target.value)}
                  className={errClass("fullName")}
                  placeholder="Enter full name"
                />
                <FieldError message={fieldErrors.fullName} />
              </div>

              <div>
                <label className={labelClass}>Nominee NIC</label>
                <input
                  type="text"
                  value={formData.nominee.nic}
                  onChange={(e) => handleChange("nominee", "nic", e.target.value)}
                  className={errClass("nic")}
                  placeholder="000000000V or 200000000000"
                />
                <FieldError message={fieldErrors.nic} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Permanent Address *</label>
                  <textarea
                    rows={3}
                    value={formData.nominee.permanentAddress}
                    onChange={(e) => handleChange("nominee", "permanentAddress", e.target.value)}
                    className={`${errClass("permanentAddress")} resize-none`}
                    placeholder="Street, City, State"
                  />
                  <FieldError message={fieldErrors.permanentAddress} />
                </div>
                <div>
                  <label className={labelClass}>Postal Address</label>
                  <textarea
                    rows={3}
                    value={formData.nominee.postalAddress}
                    onChange={(e) => handleChange("nominee", "postalAddress", e.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="Mailing address"
                  />
                </div>
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
              className="px-8 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
            >
              Update Nominee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateNominee;