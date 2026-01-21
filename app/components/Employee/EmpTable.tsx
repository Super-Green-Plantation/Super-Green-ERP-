"use client";

import { getMembers } from "@/app/services/member.service";
import { Member } from "@/app/types/member";
import { Pen, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const EmpTable = () => {
  const { branchId } = useParams();
  const [employees, setEmployees] = useState<Member[] | null>(null);
  useEffect(() => {
    const fetchEmp = async () => {
      const res = await getMembers(Number(branchId));
      console.log(res);
      setEmployees(res.emp);
    };
    fetchEmp();
  }, []);

  const handleAction = (id: number) => {};
  return (
    <div>
      <div>
        <table className=" w-full min-w-full text-left text-sm">
          <thead className="rounded-2xl border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">Emp No</th>
              <th className="px-6 py-4 font-semibold text-gray-600">
                Employee Name
              </th>
              <th className="px-6 py-4 font-semibold text-gray-600">
                Position
              </th>
              <th className="px-6 py-4 font-semibold text-gray-600">Phone</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="rounded-2xl divide-y divide-gray-100 bg-white">
            {employees?.map((e) => (
              <tr key={e.id} className="transition-colors hover:bg-gray-50">
                {/* ID/EmpNo Column */}
                <td className="px-6 py-4 font-medium text-gray-400">
                  #{e.empNo}
                </td>

                {/* Name Column */}
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-900">{e.name}</span>
                </td>

                {/* Position Column */}
                <td className="px-6 py-4 text-gray-500">
                  {e.position?.title || "N/A"}
                </td>

                {/* Phone Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 text-gray-400"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {e.phone}
                  </div>
                </td>

                {/* Action Column */}
                <td className="px-6 py-4">
                  <div className="flex gap-4">
                    <button className="cursor-pointer text-blue-400 bg-blue-300/20 rounded-md px-2 py-1 hover:bg-blue-300/30 transition-colors">
                      <Pen className="w-5" />
                    </button>
                    <button className="cursor-pointer text-red-400 bg-red-300/20 rounded-md px-2 py-1 hover:bg-red-300/30 transition-colors">
                      <Trash2 className="w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmpTable;
