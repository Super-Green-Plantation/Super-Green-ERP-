import React from "react";

const page = () => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-1">
        {/* Total Revenue - The Hero Stat */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-500 transition-all">
          <div className="absolute right-[-10%] top-[-10%] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
            </svg>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Total Revenue
            </h3>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-gray-400">Rs.</span>
            <span className="text-2xl font-black text-gray-900">4,250,000</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              +12.5%
            </span>
            <span className="text-[10px] text-gray-400 font-medium tracking-tight italic text-nowrap">
              vs last month
            </span>
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-500 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Total Clients
            </h3>
          </div>
          <span className="text-2xl font-black text-gray-900">1,482</span>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              Active
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              94% Retention
            </span>
          </div>
        </div>

        {/* Total Employees */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-500 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Staff Count
            </h3>
          </div>
          <span className="text-2xl font-black text-gray-900">156</span>
          <div className="mt-2 flex items-center gap-1 text-gray-400">
            <div className="flex -space-x-2">
              <div className="h-5 w-5 rounded-full border-2 border-white bg-gray-200" />
              <div className="h-5 w-5 rounded-full border-2 border-white bg-gray-300" />
              <div className="h-5 w-5 rounded-full border-2 border-white bg-gray-400" />
            </div>
            <span className="text-[10px] font-medium ml-1">
              +12 this quarter
            </span>
          </div>
        </div>

        {/* Total Branches */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-500 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Branches
            </h3>
          </div>
          <span className="text-2xl font-black text-gray-900">24</span>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-[10px] font-bold text-orange-600">
              Island-wide coverage
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
