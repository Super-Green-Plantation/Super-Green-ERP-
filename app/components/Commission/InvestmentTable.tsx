"use client";
import { useCommission } from "@/app/hooks/useCommission";
import { Eye, Inbox, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Error from "../Status/Error";
import Loading from "../Status/Loading";
import { getCommissionByBranch } from "@/app/features/commissions/actions";



const InvestmentTable = () => {
  const { data: investments, isLoading, isError } = useCommission();
  const [dbUser, setDbUser] = useState<any>(null);
  const [investmentData, setInvestmentData] = useState<any[]>([]);

  const getUser = async () => {
    const { dbUser } = await fetch("/api/me").then((res) => res.json());
    setDbUser(dbUser);
  }

  useEffect(() => {
    getUser();
  }, []);

useEffect(() => {
  if (!dbUser) return;

  const loadInvestments = async () => {
    if (dbUser.role === "BRANCH_MANAGER" ) {
      const branchData =
        await getCommissionByBranch(dbUser.branchId || 0);

      setInvestmentData(branchData || []);
    } else {
      setInvestmentData(investments || []);
    }
  };

  loadInvestments();
}, [dbUser, investments]);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  return (
    <div className="w-full boverflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">ID</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Branch Name</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Member / Client</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Plan</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border relative min-h-50">

            {/* --- EMPTY STATE --- */}
            {investments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
                    <Inbox size={40} strokeWidth={1} />
                    <p className="text-sm font-bold">No investments found</p>
                  </div>
                </td>
              </tr>
            )}

            {/* --- DATA STATE --- */}
            {investmentData.map((item: any) => (
              <tr key={item.id} className="hover:bg-muted/50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-muted-foreground tabular-nums">#{item.id}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20">
                      <MapPin size={14} />
                    </div>
                    <span className="text-sm font-bold text-foreground tracking-tight">{item.Branch.name || "N/A"}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                      {item.member.nameWithInitials || "System"}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                      <span className="text-muted-foreground/70">Client:</span> {item.investment.client?.fullName || "N/A"}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-tight">
                    {item.investment.plan?.name || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-bold text-primary uppercase">Rs.</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {item.amount.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end">
                    <Link
                      href={`/features/commissions/${item.id}/details`}
                      className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-200 rounded-xl transition-all"
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
