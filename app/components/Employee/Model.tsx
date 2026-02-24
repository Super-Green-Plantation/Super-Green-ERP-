"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  X,
  Mail,
  Hash,
  DollarSign,
  Phone as PhoneIcon,
  User,
  MapPin,
  Briefcase,
} from "lucide-react";
import { Member } from "@/app/types/member";
import { getBranchById } from "@/app/features/branches/actions";
import { useParams } from "next/navigation";
import { Branch } from "@/app/types/branch";
import { createEmployee, updateEmployee } from "@/app/features/employees/actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EmpModalProps {
  mode: "add" | "edit";
  initialData?: Member;
  onClose: () => void;
  onSuccess?: () => void;
}

const EmpModal = ({ mode, initialData, onClose, onSuccess }: EmpModalProps) => {
  const { branchId } = useParams<{ branchId: string }>();

  const queryClient = useQueryClient()
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    branchId: Number(branchId),
    email: "",
    phone: "",
    empNo: "",
    totalCommission: 0,
    positionId: "",
  });

  useEffect(() => {
    if (!branchId) return;
    getBranchById(Number(branchId)).then(setBranch);
  }, [branchId]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        name: initialData.name ?? "",
        branchId: Number(branchId),
        email: initialData.email ?? "",
        phone: initialData.phone ?? "",
        empNo: initialData.empNo ?? "",
        totalCommission: initialData.totalCommission ?? 0,
        positionId: String(initialData.position?.id ?? ""),
      });
    }
  }, [mode, initialData, branchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "add") {
        const res = await createEmployee({
          ...formData,
          positionId: Number(formData.positionId),
        });
        if (!res.success) {
          toast.error(res.error ?? "Failed to add employee");
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        toast.success("Successfully Added Employee");
        onSuccess?.();
        onClose();
      } else {
        const res = await updateEmployee(initialData!.id, {
          ...formData,
          positionId: Number(formData.positionId),
        });
        if (!res.success) {
          toast.error(res.error ?? "Failed to update employee");
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        toast.success("Successfully Updated Employee");
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      alert("Error saving employee details");
    } finally {
      setLoading(false);
    }
  };

  // Reusable Input Style Class
  const inputStyles =
    "w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm";
  const labelStyles =
    "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-1";

  return (
    <div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto"
  onClick={onClose}
>
  <div
    className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 my-auto"
    onClick={(e) => e.stopPropagation()}
  >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">
            {mode === "add" ? "Create New Employee" : "Edit Employee Details"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className={labelStyles}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className={inputStyles}
                />
              </div>
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className={labelStyles}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }

                  className={inputStyles}
                />
              </div>
            </div>

            {/* Branch (read-only) */}
            <div>
              <label className={labelStyles}>Assigned Branch</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  value={branch?.name ?? "Loading..."}
                  disabled
                  className={
                    inputStyles + " bg-gray-50 text-gray-500 cursor-not-allowed"
                  }
                />
              </div>
            </div>

            {/* Emp No */}
            <div>
              <label className={labelStyles}>Employee ID</label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  placeholder="EMP-000"
                  value={formData.empNo}
                  onChange={(e) =>
                    setFormData({ ...formData, empNo: e.target.value })
                  }
                  required
                  className={inputStyles}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelStyles}>Phone Number</label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  placeholder="07XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={inputStyles}
                />
              </div>
            </div>

            {/* Commission */}
            <div>
              <label className={labelStyles}>Commission ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.totalCommission}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalCommission: Number(e.target.value),
                    })
                  }
                  className={inputStyles}
                />
              </div>
            </div>

            {/* Position */}
            <div className="md:col-span-2">
              <label className={labelStyles}>Designation / Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <select
                  value={formData.positionId}
                  onChange={(e) =>
                    setFormData({ ...formData, positionId: e.target.value })
                  }
                  required
                  className={inputStyles + " appearance-none pr-10"}
                >
                  <option value="" disabled>
                    Select Position
                  </option>
                  <option value="6">AGM</option>
                  <option value="5">ZM</option>
                  <option value="4">RM</option>
                  <option value="3">BM</option>
                  <option value="2">TL</option>
                  <option value="1">FA</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-5 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:items-center">

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all active:scale-95"
            >
              {loading ? (
                <Spinner className="w-5 h-5" />
              ) : mode === "add" ? (
                "Create Employee"
              ) : (
                "Save Changes"
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpModal;
