"use client";

import React, { useState } from "react";
import { 
  ArrowLeft, Printer, TrendingUp, ShieldCheck, 
  User, Briefcase, Calendar, Wallet, MapPin, 
  UserCheck, Pen, Trash2, ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";

const InvestmentDetails = () => {
  const router = useRouter();

  // Dummy Data representing a joined record from Client, Member, and FinancialPlan
  const investment = {
    id: 5021,
    investmentAmount: 1250000,
    status: "Active",
    createdAt: "2025-11-10T10:00:00Z",
    client: {
      fullName: "Aruni Jayawardena",
      nic: "199278400231",
      email: "aruni.j@example.com",
      phoneMobile: "+94 77 123 4567",
      address: "No 45, Galle Road, Colombo 03"
    },
    plan: {
      name: "Wealth Builder Plus",
      duration: 24,
      rate: 14.5
       },
    member: {
      name: "Sahan Perera",
      empNo: "EMP-882",
      position: "Senior Consultant",
      branch: "Colombo Fort"
    }
  };

  const cardBase = "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden";
  const labelStyle = "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1";

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-screen">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b pb-5">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-xl border border-gray-200 transition-all active:scale-95">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Investment Receipt <span className="text-gray-400 font-medium">#{investment.id}</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">Processed on {new Date(investment.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
            <Printer className="w-4 h-4" /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            <Pen className="w-4 h-4" /> Modify
          </button>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* The Plan Card */}
        <section className="md:col-span-2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-white/10">
          <TrendingUp className="absolute -right-6 -top-6 w-48 h-48 text-white/5 rotate-12" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Fixed Deposit Account</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Total Investment Amount</p>
                <h2 className="text-5xl font-black tracking-tighter">
                  <span className="text-2xl text-gray-500 mr-2">Rs.</span>
                  {investment.investmentAmount.toLocaleString()}
                </h2>
              </div>
              <div className="flex gap-8 border-l border-white/10 pl-8">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Annual Rate</p>
                  <p className="text-2xl font-bold text-green-400">{investment.plan.rate}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Duration</p>
                  <p className="text-2xl font-bold">{investment.plan.duration} <span className="text-sm font-normal text-gray-400">Mo</span></p>
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
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-lg font-bold text-gray-800">{investment.status}</span>
              </div>
            </div>
            <div>
              <p className={labelStyle}>Estimated Interest</p>
              <p className="text-2xl font-black text-gray-900">
                <span className="text-sm font-bold text-gray-400 mr-1">Rs.</span>
                {((investment.investmentAmount * investment.plan.rate / 100) * (investment.plan.duration / 12)).toLocaleString()}
              </p>
            </div>
          </div>
          <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-bold transition-all border border-gray-100 flex items-center justify-center gap-2">
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
              <h2 className="text-sm font-bold text-gray-800">Investor Profile</h2>
            </div>
            <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase">View Full Profile</button>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
            <DetailItem label="Full Name" value={investment.client.fullName} />
            <DetailItem label="NIC / ID" value={investment.client.nic} />
            <DetailItem label="Email" value={investment.client.email} />
            <DetailItem label="Mobile" value={investment.client.phoneMobile} />
            <div className="col-span-2 pt-2">
               <DetailItem label="Registered Address" value={investment.client.address} icon={<MapPin className="w-3 h-3"/>} />
            </div>
          </div>
        </section>

        {/* Assigned Member Snippet */}
        <section className={cardBase}>
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-gray-800">Responsible Member</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-purple-200">
                {investment.member.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{investment.member.name}</h3>
                <p className="text-xs text-purple-600 font-bold uppercase tracking-tight">{investment.member.position}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
              <DetailItem label="Employee No" value={investment.member.empNo} />
              <DetailItem label="Assigned Branch" value={investment.member.branch} icon={<MapPin className="w-3 h-3"/>} />
            </div>
          </div>
        </section>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-red-800">Investment Termination</h4>
          <p className="text-xs text-red-600 font-medium">Closing this investment before maturity may incur penalty charges.</p>
        </div>
        <button className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200">
          Close Investment
        </button>
      </div>
    </div>
  );
};

// Internal Helper
const DetailItem = ({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
      {icon} {label}
    </p>
    <p className="text-sm font-semibold text-gray-700">{value}</p>
  </div>
);

export default InvestmentDetails;