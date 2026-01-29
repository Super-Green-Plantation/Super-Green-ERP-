"use client";
import { getAllInvestments } from "@/app/services/investments.service";
import { Eye, User } from "lucide-react";
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

  const [handleView, setHandleView] = useState(false);
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
      <table className="w-full min-w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            <th className="px-6 py-4 font-semibold text-gray-600">ID</th>
            <th className="px-6 py-4 font-semibold text-gray-600">
              Branch Name
            </th>
            <th className="px-6 py-4 font-semibold text-gray-600">
              Member / Client
            </th>
            <th className="px-6 py-4 font-semibold text-gray-600">Plan</th>
            <th className="px-6 py-4 font-semibold text-gray-600">Amount</th>
            <th className="px-6 py-4 font-semibold text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {investments.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-400">
                #{item.id}
              </td>
              <td className="px-6 py-4 font-semibold text-gray-900">
                {item.branchName}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {item.advisorName}
                  </div>
                  <div className="text-xs text-gray-400 pl-5">
                    Client: {item.clientName}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  {item.planName}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="font-bold text-gray-900">
                  Rs. {item.amount.toLocaleString()}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-3">
                  <Link
                    href={`/features/commissions/${item.id}/details`}
                    onClick={() => console.log("Edit", item.id)}
                    className="cursor-pointer text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 rounded-md px-2 py-1 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvestmentTable;
