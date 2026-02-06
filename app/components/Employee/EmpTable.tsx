"use client";

import { useEmployee } from "@/app/hooks/useEmployee";
import { deletMember } from "@/app/services/member.service";
import { Member } from "@/app/types/member";
import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  ExternalLink,
  Pen,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface EmpTableProps {
  onEdit: (emp: Member) => void;
  onRefresh: () => void;
  branchId?: any;
}

const EmpTable = ({ onEdit, onRefresh, branchId }: EmpTableProps) => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useEmployee(branchId);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees", branchId],
      });
      toast.success("Employee deleted successfully");
      onRefresh();
    },
    onError: () => {
      toast.error("Failed to delete employee");
    },
  });

  const handleDelete = (id: number) => {
    if (!confirm("Delete this employee?")) return;
    deleteMutation.mutate(id);
  };

  if (isLoading) return <Spinner />;
  if (isError) return <div>Error loading employees</div>;

  const employees = data?.employees ?? [];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Emp No
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Employee Name
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Position
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Contact
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees?.map((e: any) => (
              <tr
                key={e.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                {/* ID Column */}
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-slate-400 tabular-nums">
                    #{e.empNo}
                  </span>
                </td>

                {/* Name Column with Avatar Placeholder */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 group-hover:bg-white transition-colors">
                      {e.name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {e.name}
                    </span>
                  </div>
                </td>

                {/* Position Column */}
                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-tight">
                    <Briefcase size={12} className="opacity-70" />
                    {e.position?.title || "N/A"}
                  </div>
                </td>

                {/* Phone Column */}
                <td className="px-6 py-4 text-slate-500">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400">
                      <Phone size={12} />
                    </div>
                    {e.phone ?? "-"}
                  </div>
                </td>

                {/* Action Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {/* Edit */}
                    <button
                      onClick={() => onEdit(e)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all"
                      title="Edit"
                    >
                      <Pen size={16} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Profile Link */}
                    <Link
                      href={`/features/branches/employees/${branchId}/${e.id}`}
                      className="ml-2 px-4 py-2 text-[10px] font-black uppercase tracking-tighter text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md hover:text-blue-600 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      Profile
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!employees || employees.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-3">
              <User size={24} />
            </div>
            <p className="text-sm font-bold text-slate-400 italic">
              No employees found in records
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpTable;
