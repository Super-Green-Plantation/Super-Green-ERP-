"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Printer,
  TrendingUp,
  ShieldCheck,
  User,
  Briefcase,
  Calendar,
  Wallet,
  MapPin,
  UserCheck,
  Pen,
  Trash2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { getInvestmentById } from "@/app/services/investments.service";
import { DetailItem } from "@/app/components/DetailItem";

const InvestmentDetails = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestment = async () => {
      try {
        setLoading(true);
        const res = await getInvestmentById(Number(id));
        // Based on your API response structure: { client, member, plan }
        setData(res);
      } catch (err) {
        console.error("Failed to fetch investment:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvestment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold tracking-tighter">
          Syncing Financial Data...
        </p>
      </div>
    );
  }

  if (!data)
    return (
      <div className="p-10 text-center text-red-500">
        Investment record not found.
      </div>
    );

  // Mapping API fields to readable variables
  const { client, member, plan } = data;
  const activeInvestment = client?.investments?.[0]; // Assuming we show the first/active one

  const cardBase =
    "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden";
  const labelStyle =
    "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1";

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-screen p-4 md:p-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-xl border border-gray-200 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Investment Receipt{" "}
              <span className="text-gray-400 font-medium">
                #{activeInvestment?.id || "N/A"}
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Registered on {new Date(client?.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          <Pen className="w-4 h-4" /> Modify
        </button>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* The Plan Card */}
        <section className="md:col-span-2 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-white/10">
          <TrendingUp className="absolute -right-6 -top-6 w-48 h-48 text-white/5 rotate-12" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                {plan.name} Plan
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">
                  Total Investment Amount
                </p>
                <h2 className="text-5xl font-black tracking-tighter">
                  <span className="text-2xl text-gray-500 mr-2">Rs.</span>
                  {client.investmentAmount?.toLocaleString()}
                </h2>
              </div>
              <div className="flex gap-8 border-l border-white/10 pl-8">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                    Annual Rate
                  </p>
                  <p className="text-2xl font-bold text-green-400">
                    {plan.rate}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                    Duration
                  </p>
                  <p className="text-2xl font-bold">
                    {plan.duration}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      Mo
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status & Quick Info */}
        <section className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-6">
            <div>
              <p className={labelStyle}>Maturity Status</p>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full animate-pulse ${client.status === "Active" ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className="text-lg font-bold text-gray-800">
                  {client.status}
                </span>
              </div>
            </div>
            <div>
              <p className={labelStyle}>Frequency</p>
              <p className="text-lg font-bold text-gray-900">
                {activeInvestment?.returnFrequency || "N/A"}
              </p>
            </div>
            <div>
              <p className={labelStyle}>Estimated Interest (Total)</p>
              <p className="text-2xl font-black text-gray-900">
                <span className="text-sm font-bold text-gray-400 mr-1">
                  Rs.
                </span>
                {(
                  ((client.investmentAmount * plan.rate) / 100) *
                  (plan.duration / 12)
                ).toLocaleString()}
              </p>
            </div>
          </div>
          <button className="w-full mt-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-bold transition-all border border-gray-100 flex items-center justify-center gap-2">
            View Transaction Logs <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Profile Snippet */}
        <section className={cardBase}>
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-gray-800">
                Investor Profile
              </h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
            <DetailItem label="Full Name" value={client.fullName} />
            <DetailItem label="NIC / ID" value={client.nic} />
            <DetailItem label="Email" value={client.email || "N/A"} />
            <DetailItem label="Mobile" value={client.phoneMobile} />
            <div className="col-span-2 pt-2">
              <DetailItem
                label="Registered Address"
                value={client.address}
                icon={<MapPin className="w-3 h-3" />}
              />
            </div>
          </div>
        </section>

        {/* Responsible Member Snippet */}
        <section className={cardBase}>
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-gray-800">
              Assigned Advisor
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-purple-200 uppercase">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {member.name}
                </h3>
                <p className="text-xs text-purple-600 font-bold uppercase tracking-tight">
                  ID: {member.empNo}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
              <DetailItem
                label="Branch"
                value={member.branch.name}
                icon={<MapPin className="w-3 h-3" />}
              />
              <DetailItem
                label="Branch Location"
                value={member.branch.location}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-red-800">
            Termination Controls
          </h4>
          <p className="text-xs text-red-600 font-medium">
            Deactivating this client will pause all commission processing and
            reports.
          </p>
        </div>
        <button className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Deactivate Account
        </button>
      </div>
    </div>
  );
};

export default InvestmentDetails;
