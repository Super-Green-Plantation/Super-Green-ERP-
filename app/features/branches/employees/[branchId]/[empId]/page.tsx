"use client";

import Back from "@/app/components/Buttons/Back";
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
  Trash2,
  User,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CommissionStatementPage from "@/app/components/Commission/CommissionStatementPage";
import { generateEmployeeCommissionPDF } from "@/app/utils/pdfGenerator";
import ExportButton from "@/app/components/Doc/ExportStatement";
import EmpModal from "@/app/components/Employee/Model";
import { Member } from "@/app/types/member";

interface EmployeeDetailsPageProps {
  empId?: number;
  readOnly?: boolean;
}

const EmployeeDetailsPage = ({ empId: propEmpId, readOnly = false }: EmployeeDetailsPageProps) => {
  const params = useParams();
  const resolvedEmpId = propEmpId ?? Number(params.empId);
  const branchId = params.branchId;

  const [employee, setEmployee] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [allCommission, setAllCommission] = useState();
  const [openModel, setModelOpen] = useState(false);

  if (!resolvedEmpId) return null;

  const fetchMember = async () => {
    setLoading(true);
    try {
      const data = await getMemberDetails(resolvedEmpId);
      setEmployee(data.res as Member);
    } catch (err) {
      console.error("Failed to fetch employee", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
  }, [resolvedEmpId]);

  useEffect(() => {
    const fetchAllCommission = async () => {
      const res = await getEmployeeCommissions(resolvedEmpId);
      setAllCommission(res.commissions as any);
    };
    fetchAllCommission();
  }, [resolvedEmpId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50 gap-4">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
          </div>
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
          Loading Profile
        </p>
      </div>
    );
  }

  if (!employee) return null;

  const primaryBranch = employee.branches?.[0]?.branch;

  const labelStyles = "text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5";
  const cardStyles = "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          {!readOnly && <Back />}
          <div className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight truncate">
              {employee.nameWithInitials}
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <Hash className="w-3 h-3 shrink-0" />
              <span className="truncate">{employee.empNo} • {employee.position?.title}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {!readOnly && (
            <button
              onClick={() => setModelOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95"
            >
              <Pen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </button>
          )}
          <ExportButton
            data={{ ...employee, allCommission }}
            exportFn={generateEmployeeCommissionPDF}
          />
        </div>
      </div>

      {/* ── Financial card (mobile: full width, desktop: right column) ── */}
      <div className="block lg:hidden">
        <section className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden border border-white/5 shadow-xl">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">
                Designation
              </p>
              <h3 className="text-xl font-semibold tracking-tighter leading-tight truncate">
                {employee.position?.title}
              </h3>
              {/* <p className="text-xs text-gray-400 mt-1">Level {employee.position?.rank}</p> */}
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shrink-0">
              <Briefcase className="w-4 h-4 text-blue-400" />
            </div>
          </div>

          <div className="relative z-10 mt-4 grid sm:grid-cols-2 gap-3 text-center">
            <div className="p-2 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[9px] text-gray-500 uppercase font-black mb-0.5">Personal</p>
              <p className="text-sm font-semibold">{Number(employee.position?.personalCommissionTiers[0]?.rate)}%</p>
            </div>
            {/* <div className="p-2 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[9px] text-gray-500 uppercase font-semibold mb-0.5">ORC</p>
              <p className="text-sm font-semibold">{Number(employee.position?.orc?.rate)}%</p>
            </div> */}
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <p className="text-[9px] text-emerald-400 uppercase font-semibold mb-0.5">Earned</p>
              <p className="text-sm font-semibold text-emerald-400">
                {employee.totalCommission?.toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* General Identity */}
          <section className={cardStyles}>
            <div className="px-4 sm:px-6 py-3.5 border-b border-gray-50 flex items-center gap-2">
              <BadgeInfo className="w-4 h-4 text-blue-500 shrink-0" />
              <h2 className="font-black text-gray-800 text-xs uppercase tracking-widest">
                General Identity
              </h2>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-x-10 sm:gap-y-7">
              <DetailItem label="Official Name" value={employee.nameWithInitials} icon={<User className="w-3.5 h-3.5" />} />
              <DetailItem label="Email Address" value={employee.email} icon={<Mail className="w-3.5 h-3.5" />} />
              <DetailItem label="Phone Line" value={employee.phone} icon={<Phone className="w-3.5 h-3.5" />} />
              <DetailItem label="Employee Code" value={employee.empNo} icon={<Hash className="w-3.5 h-3.5" />} />
              {employee.phone2 && (
                <DetailItem label="Phone 2" value={employee.phone2} icon={<Phone className="w-3.5 h-3.5" />} />
              )}
              {employee.nic && (
                <DetailItem label="NIC" value={employee.nic} />
              )}
              {employee.gender && (
                <DetailItem label="Gender" value={employee.gender} />
              )}
              {employee.civilStatus && (
                <DetailItem label="Civil Status" value={employee.civilStatus} />
              )}
              {employee.address && (
                <div className="sm:col-span-2">
                  <DetailItem label="Address" value={employee.address} icon={<MapPin className="w-3.5 h-3.5" />} />
                </div>
              )}
            </div>
          </section>

          {/* Branch Assignment */}
          <section className={cardStyles}>
            <div className="px-4 sm:px-6 py-3.5 border-b border-gray-50 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <h2 className="font-black text-gray-800 text-xs uppercase tracking-widest">
                Branch Assignment
              </h2>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 bg-orange-50/10">
              <DetailItem label="Registered Branch" value={primaryBranch?.name || "N/A"} />
              <div>
                <p className={labelStyles}>Operational Status</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                  primaryBranch?.status === "Active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${primaryBranch?.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`} />
                  {primaryBranch?.status || "N/A"}
                </div>
              </div>
            </div>
          </section>

          {/* Employment details */}
          {(employee.dateOfJoin || employee.reportingPerson || employee.accNo) && (
            <section className={cardStyles}>
              <div className="px-4 sm:px-6 py-3.5 border-b border-gray-50 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-500 shrink-0" />
                <h2 className="font-black text-gray-800 text-xs uppercase tracking-widest">
                  Employment & Banking
                </h2>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-x-10 sm:gap-y-7">
                {employee.dateOfJoin && (
                  <DetailItem label="Date of Join" value={new Date(employee.dateOfJoin).toLocaleDateString()} icon={<Calendar className="w-3.5 h-3.5" />} />
                )}
                {employee.reportingPerson && (
                  <DetailItem label="Reporting Person" value={employee.reportingPerson} icon={<User className="w-3.5 h-3.5" />} />
                )}
                {employee.accNo && (
                  <DetailItem label="Account No." value={employee.accNo} />
                )}
                {employee.bank && (
                  <DetailItem label="Bank" value={employee.bank} />
                )}
                {employee.bankBranch && (
                  <DetailItem label="Bank Branch" value={employee.bankBranch} />
                )}
                {employee.remark && (
                  <div className="sm:col-span-2">
                    <DetailItem label="Remark" value={employee.remark} />
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right column — hidden on mobile (shown above instead) */}
        <div className="hidden lg:flex flex-col gap-6">
          <section className="bg-slate-900 rounded-[2rem] p-7 text-white relative overflow-hidden border border-white/5 shadow-2xl">
            <div className="absolute -right-6 -top-6 p-8 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-[0.2em] mb-2">
                    Current Designation
                  </p>
                  <h3 className="text-3xl font-semibold tracking-tighter leading-none">
                    {employee.position?.title}
                  </h3>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">Rank Seniority</span>
                  <span className="font-semibold text-blue-400">Level {employee.position?.rank}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">Personal Comm.</span>
                  <span className="font-semibold">{Number(employee.position?.personalCommissionTiers[0]?.rate)}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">ORC Overriding</span>
                  <span className="font-semibold">{Number(employee.position?.orc?.rate)}%</span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Total Commission Earned</p>
                <p className="text-2xl font-black text-emerald-400 tabular-nums">
                  <span className="text-xs mr-1 font-medium">Rs.</span>
                  {employee.totalCommission?.toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <p className={labelStyles}>Onboarded</p>
                <p className="text-[11px] font-bold text-gray-700">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </p>
              </div>
              {/* <div>
                <p className={labelStyles}>Last Sync</p>
                <p className="text-[11px] font-bold text-gray-700">
                  {new Date(employee.updatedAt).toLocaleDateString()}
                </p>
              </div> */}
            </div>
          </section>
        </div>
      </div>

      {/* Timeline — mobile only */}
      <section className="lg:hidden bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
        <div className="p-2.5 bg-white rounded-xl shadow-sm shrink-0">
          <Calendar className="w-4 h-4 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div>
            <p className={labelStyles}>Onboarded</p>
            <p className="text-[11px] font-bold text-gray-700">
              {new Date(employee.createdAt).toLocaleDateString()}
            </p>
          </div>
          {/* <div>
            <p className={labelStyles}>Last Sync</p>
            <p className="text-[11px] font-bold text-gray-700">
              {new Date(employee.updatedAt).toLocaleDateString()}
            </p>
          </div> */}
        </div>
      </section>

      {/* ── Financial History ── */}
      <div className="pt-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-gray-100 flex-1" />
          <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] shrink-0">
            Financial History
          </h3>
          <div className="h-px bg-gray-100 flex-1" />
        </div>
        {allCommission && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CommissionStatementPage data={allCommission} />
          </div>
        )}
      </div>

      {/* ── Danger Zone ── */}
      {!readOnly && (
        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-60 hover:opacity-100 transition-opacity">
          <div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Danger Zone</h4>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Permanently remove employee records from the core database.
            </p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-black uppercase hover:bg-red-600 hover:text-white transition-all shrink-0">
            <Trash2 className="w-4 h-4" /> Terminate Record
          </button>
        </div>
      )}

      {!readOnly && openModel && (
        <EmpModal
          mode="edit"
          initialData={employee}
          onClose={() => setModelOpen(false)}
          onSuccess={fetchMember}
        />
      )}
    </div>
  );
};

export default EmployeeDetailsPage;