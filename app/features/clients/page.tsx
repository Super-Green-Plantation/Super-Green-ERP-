"use client";

import Error from "@/app/components/Error";
import Heading from "@/app/components/Heading";
import Loading from "@/app/components/Loading";
import Pagination from "@/app/components/Pagination";
import { useClients } from "@/app/hooks/useClients";
import { ExternalLink, Phone, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const PAGE_SIZE = 10;

const Page = () => {
  const { data: c, isLoading, isError } = useClients();
  console.log("clientsss",c);
  
  const [currentPage, setCurrentPage] = useState(1);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  // const allClients = c?.clients ?? [];
  // const totalPages = Math.ceil(allClients.length / PAGE_SIZE);
  // const paginatedClients = allClients.slice(
  //   (currentPage - 1) * PAGE_SIZE,
  //   currentPage * PAGE_SIZE
  // );

  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-6">
        <Heading className="mb-3">
          Clients
        </Heading>
        <Link
          href="/features/clients/createClient"
          className="flex-1 sm:flex-none flex items-center justify-center uppercase gap-2 px-4 py-3 bg-slate-900 hover:bg-blue-600 text-white text-xs sm:font-black font-bold tracking-widest rounded-xl transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          + Add Client
        </Link>
      </div>

      {/* Table */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  ID
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                   Name
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Contact Info
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  NIC 
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {c.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <User size={20} />
                      </div>
                      <span className="text-sm font-bold text-slate-400 italic">
                        No clients found in the ledger
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                c.map((client: any) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* ID Column */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-400">
                        #{client.id.toString().slice(-4)}
                      </span>
                    </td>

                    {/* Name Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-[10px]">
                          {client.fullName.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-900 leading-tight">
                          {client.fullName}
                        </span>
                      </div>
                    </td>

                    {/* Contact Info Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                          <span className="text-[10px] text-slate-300">
                            <Phone size={12} />
                          </span>
                          {client.phoneMobile || "No Phone"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium ml-4">
                          {client.email || "No Email"}
                        </div>
                      </div>
                    </td>

                    {/* NIC Column */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold text-[10px] uppercase">
                        {client.nic || "Pending"}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      <div
                        className={`
                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight
                  ${client.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                          }
                `}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${client.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`}
                        />
                        {client.status}
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/features/clients/${client.id}`}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 bg-transparent hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all rounded-xl px-4 py-2 text-xs font-black uppercase tracking-tighter"
                      >
                        Profile
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      /> */}
    </div>
  );
};

export default Page;
