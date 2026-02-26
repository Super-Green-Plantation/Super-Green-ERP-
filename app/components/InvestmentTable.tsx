"use client";

import {
    Briefcase,
    Calendar,
    ExternalLink,
    MapPin,
    User
} from "lucide-react";
import { useState } from "react";
import Pagination from "@/app/components/Pagination";

const PAGE_SIZE = 10;

const InvestmentTable = ({ investments }: any) => {
  // const [currentPage, setCurrentPage] = useState(1);

  // const allInvestments: any[] = investments?.getAllInvestment ?? [];
  // const totalPages = Math.ceil(allInvestments.length / PAGE_SIZE);
  // const paginatedInvestments = allInvestments.slice(
  //   (currentPage - 1) * PAGE_SIZE,
  //   currentPage * PAGE_SIZE
  // );
  console.log(investments);
  

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                ID
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Client Details
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Investment
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Advisor
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Branch
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Commission Status
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Documents
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {investments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <User size={32} strokeWidth={1} />
                    <p className="text-sm font-bold">No investments found</p>
                  </div>
                </td>
              </tr>
            )}
            {investments.getAllInvestment.map((item: any) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                {/* ID Column */}
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-slate-400">
                    #{item.id}
                  </span>
                </td>

                {/* Client Details */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <User size={14} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {item.client.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {item.client.nic}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Investment Amount & Date */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-sm font-black text-slate-900">
                      <span className="text-emerald-500">Rs.</span>
                      {item.amount.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                      <Calendar size={10} />
                      {new Date(item.investmentDate).toLocaleDateString()}
                    </div>
                  </div>
                </td>

                {/* Advisor Details */}
                <td className="px-6 py-4">
                  {item.advisor ? (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                        <Briefcase size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700">
                          {item.advisor.name}
                        </div>
                        {item.advisor.position?.title && (
                          <div className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold inline-block">
                            {item.advisor.position.title}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs italic text-slate-400">
                      Direct Investment
                    </span>
                  )}
                </td>

                {/* Branch */}
                <td className="px-6 py-4">
                  {item.branch ? (
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-7 h-7 bg-orange-50 text-orange-600 rounded-lg">
                        <MapPin size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-slate-700">
                          {item.branch.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Branch Office
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs italic text-slate-300 font-medium">
                      N/A
                    </span>
                  )}
                </td>

                {/* Commission Status */}
                <td className="px-6 py-4">
                  <div
                    className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight
                    ${
                      item.commissionsProcessed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }
                  `}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${item.commissionsProcessed ? "bg-emerald-500" : "bg-amber-500"}`}
                    />
                    {item.commissionsProcessed ? "Processed" : "Pending"}
                  </div>
                </td>

                {/* Document Links */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-2">
                    {item.client.proposal && (
                      <a
                        href={item.client.proposal}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all text-slate-400"
                        title="View Proposal"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      /> */}
    </div>
  );
};

export default InvestmentTable;
