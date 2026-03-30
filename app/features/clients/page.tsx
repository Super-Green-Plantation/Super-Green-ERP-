"use client";

import Table from "@/app/components/Client/Table";
import Heading from "@/app/components/Heading";
import Pagination from "@/app/components/Pagination";
import Error from "@/app/components/Status/Error";
import Loading from "@/app/components/Status/Loading";
import { useClients } from "@/app/hooks/useClients";
import { Search } from "lucide-react";
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

  const searchClient = async (e: any) => {
    e.preventDefault();

    const clientData = await searchClients(searchText);

    setSearchedClient(clientData);
    setHasSearched(true);
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
      <Table data={clients} />
      

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
