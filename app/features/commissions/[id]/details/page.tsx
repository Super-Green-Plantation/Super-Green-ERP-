"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  TrendingUp,
  ShieldCheck,
  User,
  MapPin,
  UserCheck,
  Trash2,
  ChevronRight,
  Loader2,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  deleteInvestment,
  getInvestmentById,
} from "@/app/services/investments.service";
import { DetailItem } from "@/app/components/DetailItem";
import { generateInvestmentPDF } from "@/app/api/src/utils/commissionPdf";
import Loading from "@/app/components/Loading";
import Error from "@/app/components/Error";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const InvestmentDetails = () => {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchInvestment = async () => {
      try {
        setLoading(true);
        const res = await getInvestmentById(Number(id));
        setData(res);
      } catch (err) {
        console.error("Failed to fetch investment:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvestment();
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteInvestment(id);
      toast.success("Investment deleted successfully");
      await queryClient.invalidateQueries({ queryKey: ["investments"] });

      router.push("/features/commissions");
    } catch (error: any) {
      console.error("Error:", error.message);

      toast.error(error.message || "Something went wrong!");
    }
  };

  if (loading) return <Loading />;
  if (!data) return <Error />;

  const { client, member, plan } = data;
  const activeInvestment = client?.investments?.[0];

  const cardBase =
    "bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden";
  const labelStyle =
    "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1";

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-screen p-4 md:p-8">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8 mb-4">
        {/* Left Side: Back Button & Title */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all active:scale-95 shadow-sm group"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-900 transition-colors" />
          </button>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                Investment Receipt
              </h1>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 font-bold text-sm md:text-base rounded-full border border-slate-200/50">
                #{activeInvestment?.id || id}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest">
                <Calendar size={14} className="text-blue-500" />
                Issued: {new Date(client?.createdAt).toLocaleDateString()}
              </div>
              <div className="h-1 w-1 rounded-full bg-slate-300 hidden md:block" />
              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                <ShieldCheck size={14} className="text-emerald-500" />
                Verified Record
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Action Button */}
        <div className="flex items-center">
          <button
            onClick={() => generateInvestmentPDF(data)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all shadow-xl shadow-slate-200 hover:shadow-blue-200 active:scale-[0.98] group"
          >
            <Mail className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
            <span>Download Statement</span>
          </button>
        </div>
      </div>
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* The Plan Card */}
        <section className="xl:col-span-2 bg-slate-900 rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
          <TrendingUp className="absolute -right-6 -top-6 w-48 h-48 text-white/5 rotate-12 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8 md:mb-12">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-400">
                {plan?.name || "Premium"} Security Plan
              </span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div>
                <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-wide mb-2">
                  Total Investment Principal
                </p>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter flex items-baseline gap-2">
                  <span className="text-xl md:text-2xl text-slate-500 font-bold uppercase">
                    Rs.
                  </span>
                  {client.investmentAmount?.toLocaleString()}
                </h2>
              </div>

              {/* Internal Grid for Mobile Rates */}
              <div className="grid grid-cols-2 gap-4 sm:gap-12 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-12">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">
                    Annual Rate
                  </p>
                  <p className="text-2xl md:text-3xl font-black text-emerald-400">
                    {plan?.rate}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">
                    Duration
                  </p>
                  <p className="text-2xl md:text-3xl font-black">
                    {plan?.duration}
                    <span className="text-xs font-bold text-slate-400 ml-1 uppercase">
                      Mo
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status & Quick Info */}
        <section className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 flex flex-col justify-between shadow-sm">
          <div className="space-y-8">
            <div>
              <p className={labelStyle}>Maturity Status</p>
              <div className="mt-2 flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full animate-pulse ${client.status === "Active" ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-rose-500"}`}
                />
                <span className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                  {client.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
              <div>
                <p className={labelStyle}>Frequency</p>
                <p className="text-lg font-black text-slate-900 uppercase">
                  {activeInvestment?.returnFrequency || "Monthly"}
                </p>
              </div>
              <div>
                <p className={labelStyle}>Est. Interest</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  <span className="text-xs font-bold text-slate-400 mr-1 uppercase">
                    Rs.
                  </span>
                  {(
                    ((client.investmentAmount * plan.rate) / 100) *
                    (plan.duration / 12)
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investor Profile */}
        <section className={cardBase}>
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
              Investor Identity
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            <DetailItem label="Legal Name" value={client.fullName} />
            <DetailItem label="Identification" value={client.nic} />
            <DetailItem label="Primary Email" value={client.email || "N/A"} />
            <DetailItem label="Contact Number" value={client.phoneMobile} />
            <div className="sm:col-span-2 pt-2 border-t border-slate-50">
              <DetailItem label="Registered Address" value={client.address} />
            </div>
          </div>
        </section>

        {/* Assigned Advisor */}
        <section className={cardBase}>
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-600" />
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
              Relationship Manager
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-4xl bg-slate-900 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-slate-200 uppercase">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {member.name}
                </h3>
                <div className="inline-block px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-black rounded uppercase tracking-tighter border border-purple-100">
                  Ref: {member.empNo}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
              <DetailItem label="Operating Branch" value={member.branch.name} />
              <DetailItem
                label="Base Location"
                value={member.branch.location}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/50 border border-rose-100 rounded-[1.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h4 className="text-sm font-black text-rose-800 uppercase tracking-tight">
            Account Termination
          </h4>
          <p className="text-xs text-rose-600 font-bold mt-1">
            Deactivating this investment will stop all recurring commission
            cycles. This action is logged.
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="w-full md:w-auto px-8 py-3 bg-rose-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 active:scale-95"
        >
          <Trash2 className="w-4 h-4" /> Void Investment
        </button>
      </div>
    </div>
  );
};

export default InvestmentDetails;
