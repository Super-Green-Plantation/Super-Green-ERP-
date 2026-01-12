"use client";

import { useBranches } from "../../hooks/useBranches";

interface Branch {
  id: number;
  name: string;
  location: string;
  members: string[];
}

const BranchTable = () => {
  const { branches, loading, error } = useBranches();
  console.log(branches);

  // Styled Loading State
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-500">
            Loading branches...
          </p>
        </div>
      </div>
    );
  }

  // Styled Error State
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="font-semibold text-red-600">Error loading data</p>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">ID</th>
              <th className="px-6 py-4 font-semibold text-gray-600">
                Branch Name
              </th>
              <th className="px-6 py-4 font-semibold text-gray-600">
                Location
              </th>
              <th className="px-6 py-4 font-semibold text-gray-600">
                Team Size
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {branches.map((branch: Branch) => (
              <tr
                key={branch.id}
                className="transition-colors hover:bg-gray-50"
              >
                {/* ID Column */}
                <td className="px-6 py-4 font-medium text-gray-400">
                  #{branch.id}
                </td>

                {/* Name Column */}
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-900">
                    {branch.name}
                  </span>
                </td>

                {/* Location Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    {/* Location Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 text-gray-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.006.004.003.001a.75.75 0 01-.01-.003zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {branch.location}
                  </div>
                </td>

                {/* Members Count Column (Calculated) */}
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {branch.members?.length || 0} Members
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State Handling */}
      {branches.length === 0 && (
        <div className="p-8 text-center text-gray-500">No branches found.</div>
      )}
    </div>
  );
};

export default BranchTable;
