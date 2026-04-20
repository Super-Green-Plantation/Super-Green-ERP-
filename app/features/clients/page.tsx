"use client";

import Table from "@/app/components/Client/Table";
import Heading from "@/app/components/Heading";
import Pagination from "@/app/components/Pagination";
import Error from "@/app/components/Status/Error";
import Loading from "@/app/components/Status/Loading";
import { useClients } from "@/app/hooks/useClients";
import { useQuery } from "@tanstack/react-query";
import { getBranches } from "../branches/actions";
import { searchClients, getClientsByBranch, getClients } from "./actions";
import { Search, X, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";


type ClientPage = {
  clients: any[];
  totalPages: number;
  total: number;
};


const Page = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [branchId, setBranchId] = useState<string>("all");

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, branchId]);

  const { data: branchData } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await getBranches();
      return res?.branches || res || [];
    },
  });

  // Initial full-page load uses useClients hook as before
  const {
    data: defaultData,
    isLoading,
    isError,
  } = useClients(currentPage);

  const isFiltered = searchText.trim() !== "" || branchId !== "all";


  // Secondary query — only active when search or branch filter is applied
  const {
    data: filteredData,
    isFetching: isFilterFetching,
  } = useQuery<ClientPage>({
    queryKey: ["clients-filtered", searchText, branchId, currentPage],
    queryFn: async (): Promise<ClientPage> => {
      if (searchText.trim() !== "") {
        const client = await searchClients(searchText);
        return {
          clients: client ? [client] : [],
          totalPages: 1,
          total: client ? 1 : 0,
        };
      } else {
        const res = await getClientsByBranch(Number(branchId));
        return {
          clients: res.clients ?? [],
          totalPages: 1,
          total: res.clients?.length ?? 0,
        };
      }
    },
    enabled: isFiltered,
  });

  if (isLoading) return <Loading />;
  if (isError) return <Error />;


  const clients = isFiltered
    ? (filteredData?.clients ?? [])
    : (defaultData?.clients ?? []);

  const totalPages = isFiltered
    ? (filteredData?.totalPages ?? 1)
    : (defaultData?.totalPages ?? 1);

  const total = isFiltered
    ? (filteredData?.total ?? 0)
    : (defaultData?.total ?? 0);

  // Show table spinner when: filtered query is fetching, but NOT on the very
  // first load (that's handled by the full-page <Loading /> above)
  const isTableFetching = isFiltered && isFilterFetching;

  const handleClear = () => {
    setSearchText("");
    setBranchId("all");
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-6">
        <div>
          <Heading className="mb-3">Client</Heading>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {total} total clients
          </p>
        </div>
        <Link
          href="/features/clients/createClient"
          className="flex-1 sm:flex-none flex items-center justify-center uppercase gap-2 px-4 py-3 bg-primary text-primary-foreground text-xs sm:font-bold font-bold tracking-widest rounded-xl transition-all shadow-xl shadow-primary/10 active:scale-95 hover:opacity-90"
        >
          + Add Client
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="lg:col-span-2 border-2 border-teal-800 rounded-full flex-1 items-center">
          <div className="relative flex-1 w-full">
            {isTableFetching ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal-700 animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            )}
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              type="text"
              placeholder="Search Client NIC / Proposal Form No."
              className="w-full bg-transparent border-none pl-11 pr-10 py-3 text-sm font-semibold text-foreground outline-none"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="relative w-full md:w-52">
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3 bg-background border-2 border-teal-800 rounded-full text-sm font-semibold text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-teal-600"
          >
            <option value="all">All Branches</option>
            {branchData?.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {isFiltered && (
          <button
            onClick={handleClear}
            className="px-5 py-3 text-sm font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table — spinner overlay only, no full-page loading */}
      <div className="relative">
        {isTableFetching && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 rounded-xl backdrop-blur-sm">
            <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
          </div>
        )}
        <Table data={clients} />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        isLoading={isTableFetching}
      />
    </div>
  );
};

export default Page;