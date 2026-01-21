"use client";

import BranchTable from "@/app/components/Branch/BranchTable";
import BranchModal from "@/app/components/Branch/Model";
import { getBranches } from "@/app/services/branches.service";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useState } from "react";

const page = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [count,setCount]= useState(0)

    
  
  const getcount = async () => {
    const data = await getBranches();
    setCount(data.len)
  };
  useEffect(() => {
    getcount();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Branches</h2>
          <p className="text-sm text-gray-500">
            Manage branches and reporting hierarchy
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
        >
          + Add Branch
        </button>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {/* Stats + Filters Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Stats */}
          <div className="flex gap-3">
            <div className="min-w-30 rounded-lg border border-gray-300 px-4 py-3">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-semibold">{count}</p>
            </div>

            <div className="min-w-30 rounded-lg border border-gray-300 px-4 py-3">
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-lg font-semibold text-green-600">{count}</p>
            </div>

            <div className="min-w-30 rounded-lg border border-gray-300 px-4 py-3">
              <p className="text-xs text-gray-500">Inactive</p>
              <p className="text-lg font-semibold text-red-500">0</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search branches..."
                className="h-9 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative w-40">
              <select
                className="h-9 w-full appearance-none rounded-lg border border-gray-200 px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="Active"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Table Placeholder */}
        <div className="text-sm text-gray-500 py-6 text-center">
          <BranchTable />
        </div>
      </div>
      {showAddModal && (
        <BranchModal mode="add" onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default page;
