"use client";
import { useCommission } from "@/app/hooks/useCommission";
import { Eye, Inbox, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Error from "../Status/Error";
import Loading from "../Status/Loading";
import { getCommissionByBranch } from "@/app/features/commissions/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CommissionAccordionList = () => {
  const { data: investments, isLoading, isError } = useCommission();
  const [dbUser, setDbUser] = useState<any>(null);
  const [investmentData, setInvestmentData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  const getUser = async () => {
    const { dbUser } = await fetch("/api/me").then((res) => res.json());
    setDbUser(dbUser);
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (!dbUser) return;

    const loadInvestments = async () => {
      if (dbUser.role === "BRANCH_MANAGER") {
        const branchData = await getCommissionByBranch(dbUser.branchId || 0);
        setInvestmentData(branchData || []);
      } else {
        setInvestmentData(investments || []);
      }
    };

    loadInvestments();
  }, [dbUser, investments]);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  // Group by investmentId
  const groupedInvestments = investmentData.reduce((acc, curr) => {
    const invId = curr.investment?.id;
    if (!invId) return acc;
    if (!acc[invId]) {
      acc[invId] = {
        investment: curr.investment,
        branch: curr.Branch,
        commissions: [],
      };
    }
    acc[invId].commissions.push(curr);
    return acc;
  }, {} as Record<number, any>);

  const groupedList = Object.values(groupedInvestments);

  const availableBranches = Array.from(new Set(groupedList.map((g: any) => g.branch?.name).filter(Boolean)));

  const filteredList = groupedList.filter((group: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const clientName = group.investment.client?.fullName?.toLowerCase() || "";
      const nic = group.investment.client?.nic?.toLowerCase() || "";
      if (!clientName.includes(q) && !nic.includes(q)) return false;
    }

    if (filterBranch && group.branch?.name !== filterBranch) return false;

    if (group.investment?.investmentDate) {
      const invDate = new Date(group.investment.investmentDate);
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (invDate < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999); // Include the whole day
        if (invDate > to) return false;
      }
    }

    return true;
  });

  console.log("Grouped Investments for debugging types:", groupedList);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <div className="flex items-center gap-2 flex-1 w-full px-4 py-2 bg-card border border-border rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search by client name or NIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">From</span>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="py-2 bg-transparent text-sm font-medium text-foreground outline-none border-none"
            />
          </div>
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">To</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="py-2 bg-transparent text-sm font-medium text-foreground outline-none border-none"
            />
          </div>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 shadow-sm min-w-[140px]"
          >
            <option value="">All Branches</option>
            {availableBranches.map((b: any) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50 py-20 bg-card rounded-2xl border border-border shadow-sm">
          <Inbox size={40} strokeWidth={1} />
          <p className="text-sm font-bold">No investments found</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {filteredList.map((group: any) => {
            const { investment, branch, commissions } = group;
            return (
              <AccordionItem
                key={investment.id}
                value={`inv-${investment.id}`}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden border-b-0"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]]:border-b border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 text-left mr-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {investment.client?.fullName || "Unknown Client"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          INV #{investment.id}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-tight">
                          {investment.plan?.name || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg border border-border">
                        <MapPin size={12} className="text-primary" />
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                          {branch?.name || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2 border-border/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-3 pr-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                          <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Member</th>
                          <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                          <th className="py-3 pl-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {commissions.map((comm: any) => (
                          <tr key={comm.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 pr-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border
                                ${comm.type === 'PERSONAL' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                                  comm.type === 'UPLINE' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20' : 
                                  'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}
                              >
                                {comm.type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs font-bold text-foreground">
                                {comm.member?.nameWithInitials || "Unknown"}
                              </div>
                              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
                                {comm.member?.empNo}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-baseline gap-1">
                                <span className="text-[9px] font-bold text-primary uppercase">Rs.</span>
                                <span className="text-xs font-bold text-foreground tabular-nums">
                                  {comm.amount?.toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 pl-4 text-right">
                              <Link
                                href={`/features/commissions/${comm.id}/details`}
                                className="inline-flex p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg border border-transparent hover:border-border transition-all"
                              >
                                <Eye size={14} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default CommissionAccordionList;
