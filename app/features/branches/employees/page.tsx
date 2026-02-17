"use client";

import { useBranches } from "@/app/hooks/useBranches";
import Link from "next/link";
import { AlertCircle, Loader2, Users } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Loading from "@/app/components/Loading";
import Error from "@/app/components/Error";

interface Branch {
  id: number;
  name: string;
  members: Array<any>;
}

const Page = () => {
  const { data: branches, isLoading, error } = useBranches();

  if (isLoading) {
    return (
     <Loading/>
    );
  }
  if (error) {
  return (
    <Error />
  );
}
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Manage Employees</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select a branch to view and manage employees
        </p>
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches?.map((branch: Branch) => (
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
