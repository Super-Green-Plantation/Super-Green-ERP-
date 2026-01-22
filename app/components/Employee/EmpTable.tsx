"use client";

import { Member } from "@/app/types/member";
import { Pen, Trash2, Phone } from "lucide-react";

interface EmpTableProps {
  employees: Member[] | null;
  onEdit: (emp: Member) => void;
  onRefresh: () => void;
}

const EmpTable = ({ employees, onEdit, onRefresh }: EmpTableProps) => {
  const handleDelete = async (id: number) => {
    if (confirm("Delete this employee?")) {
      // Add your delete API call here
      console.log("Deleting:", id);
      // await deleteMember(id);
      // onRefresh(); 
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase">Emp No</th>
            <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase">Name</th>
            <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase">Position</th>
            <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase">Phone</th>
            <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {employees?.map((e) => (
            <tr key={e.id} className="transition-colors hover:bg-gray-50/80">
              <td className="px-6 py-4 text-gray-400">#{e.empNo}</td>
              <td className="px-6 py-4 font-semibold text-gray-900">{e.name}</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {e.position?.title || "N/A"}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-500">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> {e.phone}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-3">
                  <button onClick={() => onEdit(e)} className="p-1.5 text-blue-500 bg-blue-50 rounded-md hover:bg-blue-100">
                    <Pen className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-500 bg-red-50 rounded-md hover:bg-red-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {employees?.length === 0 && <p className="text-center py-10 text-gray-500">No employees found.</p>}
    </div>
  );
};

export default EmpTable;