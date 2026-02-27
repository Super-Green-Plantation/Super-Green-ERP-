"use client";
import { useCommission } from "@/app/hooks/useCommission";
import { Eye, Inbox, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Error from "../Error";
import Loading from "../Loading";
import { getCommissionByBranch } from "@/app/features/commissions/actions";



const InvestmentTable = () => {
  const { data: investments, isLoading, isError } = useCommission();
  const [dbUser, setDbUser] = useState<any>(null);
  const [investmentData, setInvestmentData] = useState<any[]>([]);

  const getUser = async () => {
    const { dbUser } = await fetch("/api/me").then((res) => res.json());
    console.log("user", dbUser);
    setDbUser(dbUser);
  }

  useEffect(() => {
    getUser();
  }, []);

useEffect(() => {
  if (!dbUser) return;

  const loadInvestments = async () => {
    if (dbUser.role === "BRANCH_MANAGER") {
      const branchData =
        await getCommissionByBranch(dbUser.branchId || 0);

      setInvestmentData(branchData || []);
    } else {
      setInvestmentData(investments || []);
    }
  };

  loadInvestments();
}, [dbUser, investments]);

  console.log("commission", investmentData);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Trace ID</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Branch Name</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Member / Client</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Plan Type</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Amount</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 relative min-h-50">

            {/* --- EMPTY STATE --- */}
            {investments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-300">
                    <Inbox size={40} strokeWidth={1} />
                    <p className="text-sm font-bold">No investments found</p>
                  </div>
                </td>
              </tr>
            )}

            {/* --- DATA STATE --- */}
            {investmentData.map((item: any) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-slate-400 tabular-nums">#{item.id}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">
                      <MapPin size={14} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 tracking-tight">{item.Branch.name || "N/A"}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                      <User size={12} className="text-slate-300" />
                      {item.member.name || "System"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight pl-4">
                      <span className="text-slate-300">Client:</span> {item.clientName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-tight">
                    {item.investment.plan?.name || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Rs.</span>
                    <span className="text-sm font-black text-slate-900 tabular-nums">
                      {item.amount.toLocaleString()}
                    </span>
                  </div>
                </td>
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