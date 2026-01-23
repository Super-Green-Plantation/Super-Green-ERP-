"use client";

import { getMemberDetails } from "@/app/services/member.service";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Hash,
  Briefcase,
  MapPin,
  Calendar,
  ShieldCheck,
  Trash2,
  Pen,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { DetailItem } from "@/app/components/DetailItem";

interface PersonalCommissionTiers {
  id: number;
  minAmount: number;
  maxAmount: number;
  rate: number;
}
interface Orc {
  id: number;
  rate: number;
}

interface Position {
  id: number;
  title: string;
  baseSalary: number;
  rank: number;
  orc: Orc;
  personalCommissionTiers: PersonalCommissionTiers[];
}
interface Branch {
  id: number;
  name: string;
  location: string;
  status: string;
}
interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  empNo: string;
  totalCommission: number;
  branchId: number;
  positionId: number;
  managerId: number | null;
  createdAt: string;
  updatedAt: string;
  position: Position | null;
  branch: Branch | null;
}

const EmployeeDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { branchId, empId } = params;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  console.log(employee);

  const labelStyles =
    "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1";
  const cardStyles =
    "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden";

  useEffect(() => {
    if (!branchId || !empId) return;

    const fetchMember = async () => {
      setLoading(true);
      try {
        const res = await getMemberDetails(Number(empId), Number(branchId));
        setEmployee(res.res);
      } catch (err) {
        console.error("Failed to fetch employee", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [branchId, empId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-bold text-gray-500 tracking-tighter">
          Fetching Employee Profile...
        </p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4">
        <div className="bg-red-50 p-4 rounded-full">
          <User className="w-12 h-12 text-red-400" />
        </div>
        <p className="text-xl font-bold text-gray-800">Employee Not Found</p>
        <button
          onClick={() => router.back()}
          className="text-blue-600 font-semibold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6  min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {employee.name}
            </h1>
            <p className="text-sm text-gray-500 font-medium tracking-tight">
              #{employee.empNo} • {employee.position?.title || "No Role"}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: General & Branch Info */}
        <div className="lg:col-span-2 space-y-6">
          <section className={cardStyles}>
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <h2 className="font-bold text-gray-800 text-sm tracking-tight">
                Personal Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem
                label="Full Name"
                value={employee.name}
                icon={<User className="w-3 h-3 text-gray-400" />}
              />
              <DetailItem
                label="Email Address"
                value={employee.email}
                icon={<Mail className="w-3 h-3 text-gray-400" />}
              />
              <DetailItem
                label="Phone Number"
                value={employee.phone}
                icon={<Phone className="w-3 h-3 text-gray-400" />}
              />
              <DetailItem
                label="Employee ID"
                value={employee.empNo}
                icon={<Hash className="w-3 h-3 text-gray-400" />}
              />
            </div>
          </section>

          <section className={cardStyles}>
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <h2 className="font-bold text-gray-800 text-sm tracking-tight">
                Branch Assignment
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <DetailItem
                label="Branch Name"
                value={employee.branch?.name || "N/A"}
              />
              <DetailItem
                label="Location"
                value={employee.branch?.location || "N/A"}
              />
              <div>
                <p className={labelStyles}>Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    employee.branch?.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {employee.branch?.status || "Unknown"}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Position & Financials */}
        <div className="space-y-6">
          <section className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden border border-white/5">
            <Briefcase className="absolute -right-4 -top-4 w-24 h-24 text-white/5 rotate-12" />
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-2">
              Designation
            </p>
            <h3 className="text-3xl font-black mb-1 leading-none">
              {employee.position?.title || "N/A"}
            </h3>
            <p className="text-xs text-gray-400 font-medium mb-2">
              Rank Level: {employee.position?.rank || "0"}
            </p>
            <p className="text-xs text-gray-400 font-medium mb-2">
              Personal Comm. rate :{" "}
              {employee.position?.personalCommissionTiers[0].rate + "%" || "0"}
            </p>
            <p className="text-xs text-gray-400 font-medium mb-8">
              ORC rate : {employee.position?.orc.rate + "%" || "0"}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 uppercase font-bold">
                  Base Salary
                </p>
                <p className="text-lg font-bold tabular-nums tracking-tight">
                  Rs. {employee.position?.baseSalary?.toLocaleString() || "0"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 uppercase font-bold">
                  Commission
                </p>
                <p className="text-lg font-bold text-green-400 tabular-nums tracking-tight">
                  Rs. {employee.totalCommission?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-start gap-4">
              <Calendar className="w-5 h-5 text-gray-300 mt-0.5" />
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className={labelStyles}>Profile Created</p>
                  <p className="text-xs font-bold text-gray-700">
                    {new Date(employee.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className={labelStyles}>Last Updated</p>
                  <p className="text-xs font-bold text-gray-700">
                    {new Date(employee.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-gray-800 tracking-tight">
            Administrative Controls
          </h4>
          <p className="text-xs text-gray-500 font-medium">
            Update profile data or remove this employee record from the
            database.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
            <Pen className="w-4 h-4" /> Update
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-all active:scale-95">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable Detail Item


export default EmployeeDetailsPage;
