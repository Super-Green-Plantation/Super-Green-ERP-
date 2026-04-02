"use client";

import Heading from "@/app/components/Heading";
import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBranchById, getBranchesByMemberId, searchEmployees } from "../actions";
import { useBranches } from "@/app/hooks/useBranches";
import Loading from "@/app/components/Status/Loading";
import Error from "@/app/components/Status/Error";

interface Branch {
  id: number;
  name: string;
  members: Array<any>;
}

const Page = () => {
  const { data: branches, isLoading: branchesLoading, error } = useBranches();
  const [dbUser, setDbUser] = useState<any>(null);
  const [branch, setBranch] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getUser = async () => {
    const { dbUser } = await fetch("/api/me").then((res) => res.json());
    console.log("user", dbUser);
    setDbUser(dbUser);
  }

  useEffect(() => {
    getUser();
  }, []);
  useEffect(() => {
    if (!dbUser || !branches) return;

    const loadBranch = async () => {
      if (["ADMIN", "HR", "DEV"].includes(dbUser.role)) {
        // Admin roles see all branches
        setBranch(branches || []);
      } else if (dbUser.member?.id) {
        // BM, RM, AGM, ZM, TL, FA — fetch branches from MemberBranch junction
        const memberBranches = await getBranchesByMemberId(dbUser.member.id);
        setBranch(memberBranches);
      } else if (dbUser.branchId) {
        // Fallback: member record not linked yet, use User.branchId
        const singleBranch = await getBranchById(dbUser.branchId);
        setBranch([singleBranch]);
      }
    };

    loadBranch();
  }, [dbUser, branches]);

  useEffect(() => {
    if (!searchText) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      const res = await searchEmployees(searchText);
      setResults(res ?? []);
      setLoading(false);
    }, 400); // debounce

    console.log(results);
    
    return () => clearTimeout(delay);
  }, [searchText]);


  if (branchesLoading) return <Loading />;
  if (error) return <Error />

  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      {/* Header */}
      <div>
        <Heading>
          Branch Employees
        </Heading>
        <p className="text-sm text-muted-foreground font-medium mt-2 max-w-2xl">
          Select a branch to view and manage team members and their profiles.
        </p>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          type="text"
          placeholder="Search by name, employee ID"
          className="w-full bg-transparent border-2 border-teal-800 rounded-full pl-11 pr-4 py-3 text-sm font-semibold outline-none"
        />

        {/* DROPDOWN */}
        {searchText && (
          <div className="absolute z-50 mt-2 w-full dark:bg-teal-900 bg-white border border-border rounded-2xl shadow-xl max-h-72 overflow-y-auto">

            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Searching...</div>
            ) : results.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No employees found
              </div>
            ) : (
              results.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => window.open(`/features/branches/employees/${emp?.branches[0]?.branchId}/${emp.id}`, "_blank")}
                  className="px-4 py-3 hover:bg-muted cursor-pointer flex flex-col"
                >
                  <span className="text-sm font-bold">{emp.nameWithInitials}</span>
                  <span className="text-xs text-muted-foreground">
                    {emp.empNo} • {emp.nic}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {branch?.map((branch: Branch) => (
          <Link
            key={branch.id}
            href={`/features/branches/employees/${branch.id}`}
            className="group"
          >
            <div
              className="
                rounded-3xl border border-border
                bg-card p-6
                transition-all duration-300
                hover:bg-muted/50
                hover:border-primary/50
                hover:shadow-xl hover:shadow-primary/5
                group-active:scale-[0.98]
              "
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                  <Users size={20} />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                    {branch.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-muted px-2 py-0.5 rounded-lg border border-border/50">
                      {branch.members.length} Staff
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] mt-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    Manage Team →
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Page;
