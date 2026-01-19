"use client";

import { getBranchDetails, getBranches } from "@/app/services/branches.service";
import {
  getClientDetails,
  getClients,
  getClientsByBranch,
} from "@/app/services/clients.service";
import { Branch } from "@/app/types/branch";
import { Client } from "@/app/types/client";
import { Member } from "@/app/types/member";
import { useEffect, useState } from "react";

const Page = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  console.log(client);
  

  /* ---------------- Load branches ---------------- */
  useEffect(() => {
    const loadBranches = async () => {
      const data = await getBranches();
      setBranches(data.res);
    };
    loadBranches();
  }, []);

  /* ---------------- Load branch details ---------------- */
  useEffect(() => {
    if (!selectedBranchId) {
      setBranch(null);
      return;
    }

    const fetchBranch = async () => {
      const data = await getBranchDetails(selectedBranchId);
      setBranch(data);
    };

    fetchBranch();
  }, [selectedBranchId]);

  const loadClients = async () => {
    if (!selectedBranchId) {
      setClients([]);
      return;
    }

    const data = await getClientsByBranch(selectedBranchId);
    setClients(data.clients); 
  };

  useEffect(() => {
    loadClients();
  }, [selectedBranchId]); 

  useEffect(() => {
    if (!selectedClientId) {
      setClient(null);
      return;
    }

    const loadClient = async () => {
      const data = await getClientDetails(selectedClientId);
      setClient(data);
    };

    loadClient();
  }, [selectedClientId]); 

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Commissions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ================= Branch Panel ================= */}
        <div>
          <label className="block mb-2 text-sm font-medium">
            Select Branch
          </label>
          <select
            className="w-full max-w-sm rounded-lg border px-3 py-2"
            onChange={(e) =>
              setSelectedBranchId(
                e.target.value ? Number(e.target.value) : null
              )
            }
          >
            <option value="">Select branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <div className="mt-6 space-y-4">
            {!branch && (
              <p className="text-sm text-gray-500">
                Select a branch to view commissions
              </p>
            )}

            {branch?.members?.length === 0 && (
              <p className="text-sm text-gray-500">No members in this branch</p>
            )}

            {branch?.members?.map((m: Member) => (
              <div
                key={m.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Employee</p>
                    <p className="font-semibold">{m.name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Position</p>
                    <p className="font-semibold">{m.position.title}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Commission Rate</p>
                    <p className="font-semibold">
                      {m.position.commissionRate?.rate ?? "-"}%
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Total Commission</p>
                    <p className="font-semibold">
                      Rs. {m.totalCommission ?? "-"} /-
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= Client Panel ================= */}
        <div>
          <label className="block mb-2 text-sm font-medium">
            Select Client
          </label>
          <select
            className="w-full max-w-sm rounded-lg border px-3 py-2"
            onChange={(e) =>
              setSelectedClientId(
                e.target.value ? Number(e.target.value) : null
              )
            }
          >
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>

          <div className="mt-6">
            {!client && (
              <p className="text-sm text-gray-500">
                Select a client to view details
              </p>
            )}

            {client && (
              <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
                <h2 className="text-lg font-semibold">{client.fullName}</h2>
                <p className="text-sm text-gray-600">
                  Email: {client.email ?? "-"}
                </p>
                <p className="text-sm text-gray-600">
                  Mobile: {client.phoneMobile ?? "-"}
                </p>
                <p className="text-sm text-gray-600">
                  NIC: {client.nic ?? "-"}
                </p>
                <p className="text-sm text-gray-600">
                  Plan:{" "}
                  {client.investments?.map((inv) => (
                    <p>{inv.plan?.name}</p>
                  )) || "-"}
                </p>

                 <p className="text-sm text-gray-600">
                  Branch:{" "}
                  {client.branch?.name}
                </p>

                <p className="text-sm text-gray-600">
                  Address: {client.address}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
