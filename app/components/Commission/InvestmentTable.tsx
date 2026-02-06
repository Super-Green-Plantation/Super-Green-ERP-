"use client";
import { getAllInvestments } from "@/app/services/investments.service";
import { Eye, MapPin, User } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface Investment {
  id: number;
  amount: number;
  investmentDate: string;
  clientName: string;
  planName: string;
  advisorName: string | null;
  branchName: string | null;
}

const InvestmentTable = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);

  const fetchInv = async () => {
    const result = await getAllInvestments();

    
    // Map nested objects into flat structure
    const mapped = result.map((inv: any) => ({
      id: inv.id,
      amount: inv.amount,
      investmentDate: inv.investmentDate,
      clientName: inv.client?.fullName || "-",
      planName: inv.plan?.name || "-",
      advisorName: inv.advisor?.name || "-",
      branchName: inv.advisor?.branch?.name || "-", // branch from advisor
    }));

    setInvestments(mapped);
  };

  useEffect(() => {
    fetchInv();
  }, []); // 🔹 dependency fixed

  return (
    <div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Trace ID
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Branch Name
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Member / Client
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Plan Type
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Amount
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-right">
                  View
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {investments.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* ID Column */}
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-400 tabular-nums">
                      #{item.id}
                    </span>
                  </td>

                  {/* Branch Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">
                        <MapPin size={14} />
                      </div>
                      <span className="text-sm font-bold text-slate-900 tracking-tight">
                        {item.branchName}
                      </span>
                    </div>
                  </td>

                  {/* Member / Client Info */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                        <User size={12} className="text-slate-300" />
                        {item.advisorName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight pl-4">
                        <span className="text-slate-300">Client:</span>{" "}
                        {item.clientName}
                      </div>
                    </div>
                  </td>

                  {/* Plan Badge */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-tight">
                      {item.planName}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">
                        Rs.
                      </span>
                      <span className="text-sm font-black text-slate-900 tabular-nums">
                        {item.amount.toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <Link
                        href={`/features/commissions/${item.id}/details`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-200 rounded-xl transition-all"
                      >
                        <Eye size={18} />
                      </Link>
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

export default InvestmentTable;
