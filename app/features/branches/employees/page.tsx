"use client";

import Heading from "@/app/components/Heading";
import { Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBranchById } from "../actions";
import { useBranches } from "@/app/hooks/useBranches";
import Loading from "@/app/components/Loading";
import Error from "@/app/components/Error";

interface Branch {
  id: number;
  name: string;
  members: Array<any>;
}

const Page = () => {
  const { data: branches, isLoading: branchesLoading, error } = useBranches();
  const [dbUser, setDbUser] = useState<any>(null);
  const [branch, setBranch] = useState<any[]>([]);

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
      if (dbUser.role === "BRANCH_MANAGER") {
        const singleBranch = await getBranchById(dbUser.branchId || 0);
        setBranch([singleBranch]); // <- wrap in array
      } else if (["ADMIN", "HR", "DEV"].includes(dbUser.role)) {
        setBranch(branches || []); // <- ensure branches is array
      }
    };

    loadBranch();
  }, [dbUser, branches]);

  if (branchesLoading) return <Loading />;
  if (error) return <Error />

  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      {/* Header */}
      <div>
        <Heading>
          Manage Employees
        </Heading>
        <p className="text-sm text-gray-500 mt-1">
          Select a branch to view and manage employees
        </p>
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
                rounded-xl border border-blue-200/60
                bg-blue-50 p-5
                transition
                hover:bg-blue-100
                hover:border-blue-400
                hover:shadow-md
              "
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500 text-white">
                  <Users size={18} />
                </div>

                <div>
                  <h3 className="font-semibold text-lg group-hover:text-blue-700">
                    {branch.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {branch.members.length} employees
                  </p>
                  <p className="text-sm text-gray-500">
                    Click to Manage employees
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
