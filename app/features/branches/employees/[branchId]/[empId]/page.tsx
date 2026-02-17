"use client";

import Back from "@/app/components/Back";
import { DetailItem } from "@/app/components/DetailItem";
import { getMemberDetails } from "@/app/features/employees/actions";
import { getEmployeeCommissions } from "@/app/features/commissions/actions";
import {
  BadgeInfo,
  Briefcase,
  Calendar,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Pen,
  Phone,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import CommissionStatementPage from "@/app/components/Commission/CommissionStatementPage";
import { generateEmployeeCommissionPDF } from "@/app/utils/pdfGenerator";
import ExportButton from "@/app/components/ExportStatement";

interface PersonalCommissionTiers {
  id: number;
  minAmount: number;
  maxAmount: number | null;
  rate: any;
}
interface Orc {
  id: number;
  rate: any;
}

interface Position {
  id: number;
  title: string;
  baseSalary: number;
  rank: number;
  orc: Orc | null;
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
  email: string | null;
  phone: string | null;
  empNo: string;
  totalCommission: number;
  branchId: number;
  positionId: number;

  createdAt: string | Date;
  updatedAt: string | Date;
  position: Position | null;
  branch: Branch | null;
}

const EmployeeDetailsPage = () => {
  const params = useParams();
  const { branchId, empId } = params;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [allCommission, setAllCommission] = useState();

  const labelStyles =
    "text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5";
  const cardStyles =
    "bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md";

  useEffect(() => {
    if (!branchId || !empId) return;
    const fetchMember = async () => {
      setLoading(true);
      try {
        const data = await getMemberDetails(Number(empId));
        setEmployee(data.res);
      } catch (err) {
        console.error("Failed to fetch employee", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [branchId, empId]);

  useEffect(() => {
    const fetchAllCommission = async () => {
      const res = await getEmployeeCommissions(Number(empId));
      setAllCommission(res.commissions as any);
    };
    fetchAllCommission();
  }, [empId]);

  console.log("empppppppp", employee);
  console.log("allllllllll", allCommission);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
        </div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
          Loading Employee Profile
        </p>
      </div>
    );
  }

  if (!employee) return null; // Add your Not Found return here

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 min-h-screen pb-20">
      {/* 1. Integrated Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
        <div className="flex items-center gap-5">
          <Back />
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {employee.name}
              </h1>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-md border border-blue-100 uppercase">
                {employee.branch?.name}
              </span>
            </div>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Hash className="w-3.5 h-3.5" /> {employee.empNo} •{" "}
              {employee.position?.title}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
            <Pen className="w-4 h-4" /> Edit Profile
          </button>

          <ExportButton
            data={{ ...employee, allCommission }}
            exportFn={generateEmployeeCommissionPDF}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Info */}
          <section className={cardStyles}>
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BadgeInfo className="w-4 h-4 text-blue-500" />
                <h2 className="font-black text-gray-800 text-xs uppercase tracking-widest">
                  General Identity
                </h2>
              </div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <DetailItem
                label="Official Name"
                value={employee.name}
                icon={<User className="w-3.5 h-3.5" />}
              />
              <DetailItem
                label="Email Address"
                value={employee.email}
                icon={<Mail className="w-3.5 h-3.5" />}
              />
              <DetailItem
                label="Phone Line"
                value={employee.phone}
                icon={<Phone className="w-3.5 h-3.5" />}
              />
              <DetailItem
                label="Employee Code"
                value={employee.empNo}
                icon={<Hash className="w-3.5 h-3.5" />}
              />
            </div>
          </section>

          {/* Branch Assignment */}
          <section className={cardStyles}>
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <h2 className="font-black text-gray-800 text-xs uppercase tracking-widest">
                Branch Assignment
              </h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-orange-50/10">
              <DetailItem
                label="Registered Branch"
                value={employee.branch?.name || "N/A"}
              />
              <DetailItem
                label="Base Location"
                value={employee.branch?.location || "N/A"}
              />
              <div>
                <p className={labelStyles}>Operational Status</p>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                    employee.branch?.status === "Active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${employee.branch?.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`}
                  />
                  {employee.branch?.status}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Financial Highlights */}
        <div className="space-y-8">
          <section className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden border border-white/5 shadow-2xl">
            <div className="absolute -right-6 -top-6 p-8 bg-blue-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">
                    Current Designation
                  </p>
                  <h3 className="text-3xl font-black tracking-tighter leading-none">
                    {employee.position?.title}
                  </h3>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              <div className="space-y-5 mb-10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">
                    Rank Seniority
                  </span>
                  <span className="font-black text-blue-400">
                    Level {employee.position?.rank}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">
                    Personal Comm.
                  </span>
                  <span className="font-black">
                    {Number(employee.position?.personalCommissionTiers[0]?.rate)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">
                    ORC Overriding
                  </span>
                  <span className="font-black">
                    {Number(employee.position?.orc?.rate)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-1">
                    Total Commission Earned
                  </p>
                  <p className="text-2xl font-black text-emerald-400 tabular-nums">
                    <span className="text-xs mr-1 font-medium">Rs.</span>
                    {employee.totalCommission?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Timeline Card */}
          <section className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <p className={labelStyles}>Onboarded</p>
                <p className="text-[11px] font-bold text-gray-700">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className={labelStyles}>Last Sync</p>
                <p className="text-[11px] font-bold text-gray-700">
                  {new Date(employee.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 3. Detailed Records Divider */}
      <div className="pt-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-gray-100 flex-1" />
          <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
            Financial History Ledger
          </h3>
          <div className="h-px bg-gray-100 flex-1" />
        </div>

        {allCommission && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CommissionStatementPage data={allCommission} />
          </div>
        )}
      </div>

      {/* 4. Danger Zone */}
      <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
        <div>
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">
            Danger Zone
          </h4>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Permanently remove employee records from the core database.
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-black uppercase hover:bg-red-600 hover:text-white transition-all">
          <Trash2 className="w-4 h-4" /> Terminate Record
        </button>
      </div>
    </div>
  );
};

export default EmployeeDetailsPage;
