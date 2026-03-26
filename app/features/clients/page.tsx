"use client";

import Error from "@/app/components/Status/Error";
import Heading from "@/app/components/Heading";
import Loading from "@/app/components/Status/Loading";
import Pagination from "@/app/components/Pagination";
import { useClients } from "@/app/hooks/useClients";
import { ExternalLink, Phone, Search, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { searchClients } from "./actions";

const Page = () => {

  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError } = useClients(currentPage);
  const [searchText, setSearchText] = useState("");
  const [searchedClient, setSearchedClient] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  const clients = hasSearched
    ? (searchedClient ? [searchedClient] : [])
    : (data?.clients ?? []);
  const totalPages = data?.totalPages ?? 1;

  console.log(clients);
  console.log(data.total);

  const searchClient = async (e: any) => {
    e.preventDefault();

    const clientData = await searchClients(searchText);

    setSearchedClient(clientData);
    setHasSearched(true);
  };

  console.log(searchText);

  const clearSearch = () => {
    setSearchedClient(null);
    setSearchText("");
  };

  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-6">

        <div>
          <Heading className="mb-3">
            Client
          </Heading>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {data?.total} total clients
          </p>
        </div>
        <Link
          href="/features/clients/createClient"
          className="flex-1 sm:flex-none flex items-center justify-center uppercase gap-2 px-4 py-3 bg-primary text-primary-foreground text-xs sm:font-bold font-bold tracking-widest rounded-xl transition-all shadow-xl shadow-primary/10 active:scale-95 hover:opacity-90"
        >
          + Add Client
        </Link>
      </div>

      <form onSubmit={searchClient}>
        <div className="flex  justify-between gap-3">
          <div className="lg:col-span-2 border-2 p-0 border-teal-800 rounded-full flex-1 items-center ">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                type="text"
                placeholder="Search Client NIC / Proposal Form No."
                className="w-full bg-transparent border-none pl-11 pr-4 py-3 text-sm font-semibold text-foreground outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-primary text-primary-foreground hover:opacity-90 px-6 py-2.5 rounded-xl text-sm font-bold"
          >
            Search
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="w-full  shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Proposal Form No.
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Contact Info
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  NIC
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Inv. Amount
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground/30">
                        <User size={20} />
                      </div>
                      <span className="text-sm font-bold text-muted-foreground italic">
                        No clients found in the ledger
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map((client: any, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    {/* ID Column */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-muted-foreground">
                        {client.proposalFormNo || "#" + client?.id}
                      </span>
                    </td>

                    {/* Name Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">

                        <span className="text-sm font-bold text-foreground leading-tight">
                          {client.fullName}
                        </span>
                      </div>
                    </td>

                    {/* Contact Info Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[11px] text-muted-foreground font-medium ml-4">
                          <span className="text-[10px] text-muted-foreground/30">
                          </span>
                          {client.phoneMobile || "No Phone"}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium ml-4">
                          {client.email || "No Email"}
                        </div>
                      </div>
                    </td>

                    {/* NIC Column */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted text-muted-foreground rounded font-bold text-[11px] uppercase">
                        {client.nic || "Pending"}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      <div
                        className={`
                  inline-flex items-center gap-1.5 px-6 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight
                    ${client.investmentAmount > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}
                 `}>
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${client.investmentAmount > 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                        />
                        Rs. {client.investmentAmount}
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/features/clients/${client.id}`}
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary bg-transparent hover:bg-card hover:shadow-sm border border-transparent hover:border-border transition-all rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-tighter"
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

      {!searchedClient && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div >
  );
};

export default Page;
