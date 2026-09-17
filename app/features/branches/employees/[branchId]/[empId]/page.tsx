"use client";

import CommissionStatementPage from "@/app/components/Commission/CommissionStatementPage";
import { DetailItem } from "@/app/components/DetailItem";
import ExportButton from "@/app/components/Doc/ExportStatement";
import EmployeeStatusSection from "@/app/components/Employee/Employeestatussection";
import EmpModal from "@/app/components/Employee/Model";
import PaySheet from "@/app/components/Employee/PaySheet";
import Loading from "@/app/components/Status/Loading";
import { getEmployeeCommissions } from "@/app/features/commissions/actions";
import { deleteEmployee, getMemberDetails, getReportingPersons } from "@/app/features/employees/actions";
import { getPayrollHistory } from "@/app/features/hr/payroll-action";
import { Member } from "@/app/types/member";
import {
  BadgeInfo,
  Briefcase,
  CreditCard,
  FileText,
  Hash,
  Mail,
  MapPin,
  Pen,
  Phone,
  Trash2,
  User,
  Calendar,
  IdCard,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { generateEmployeeFullProfilePDF } from "@/app/pdf/EmployeeProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import SubordinatesSection from "@/app/features/employees/SubordinatesSection";


const EmployeeDetailsPage = ({ empId: propEmpId, readOnly = false }: { empId?: number; readOnly?: boolean }) => {
  const params = useParams();
  const resolvedEmpId = propEmpId ?? Number(params.empId);
  const branchId = Number(params.branchId);

  const [employee, setEmployee] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [allCommission, setAllCommission] = useState();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [openModel, setModelOpen] = useState(false);
  const [orc, setOrc] = useState(0);
  const [reportingPeople, setReportingPeople] = useState<any[]>([]);
  const [isManagement, setIsManagement] = useState(false);
  const [isPermeant, setIsPermeant] = useState(false);
  const [activeTab, setActiveTab] = useState<"commissions" | "paysheets">(isPermeant ? "paysheets" : "commissions");

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; branchId: number | null }>({
    open: false,
    branchId: null,
  });

  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (employee?.status === "PERMANENT") {
      setOrc(employee.position?.orc?.ratePermanent * 100 || 0);
      setIsPermeant(true);
    } else if (employee?.status === "PROBATION") {
      setOrc(employee.position?.orc?.rateNonPermanent * 100 || 0);
    } else if (employee?.status === "MANAGEMENT") {
      setIsManagement(true);
    }
  }, [employee]);

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
    if (resolvedEmpId) {
      fetchMember();
      const fetchAll = async () => {
        const res = await getEmployeeCommissions(resolvedEmpId);
        setAllCommission(res.commissions as any);
        const payrollRes = await getPayrollHistory(resolvedEmpId);
        setPayrolls(payrollRes as any);
      };
      fetchAll();
    }
  }, [resolvedEmpId]);

  useEffect(() => {
    const empNos = employee?.reportingPersons ?? [];
    if (empNos.length === 0) return;
    const fetchReportingPersons = async () => {
      const res = await getReportingPersons(empNos);
      setReportingPeople(res.employees);
    };
    fetchReportingPersons();
  }, [employee]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", branchId] });
      toast.success("Employee deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete employee");
    },
  });

  const handleDeleteClick = (branchId: number) => {
    setDeleteDialog({ open: true, branchId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.branchId) return;
    deleteMutation.mutate(deleteDialog.branchId);
    router.push(`/features/branches/employees/${branchId}`);
  };

  if (loading) return <Loading />;
  if (!employee) return null;

  return (
    <main className="max-w-7xl mx-auto min-h-screen sm:p-8 space-y-6 animate-in fade-in duration-700">

      {/* ── Hero Section ── */}
      <section className="relative h-auto sm:h-56 rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/10 border border-white/10">
        <div className="absolute inset-0 dark:bg-teal-900 bg-teal-900 z-0" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative h-full flex items-center p-6 sm:p-10 z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-8 w-full">

            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl shrink-0">
              {employee.profilePic ? (
                <Image
                  src={employee.profilePic}
                  alt={employee.nameWithInitials ?? "Profile"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <User className="w-12 h-12 text-white/50" />
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 flex flex-col sm:flex-row justify-between items-center sm:items-center w-full gap-4">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {employee.nameWithInitials}
                  </h1>
                  {!readOnly && (
                    <button
                      onClick={() => setModelOpen(true)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all border border-white/10"
                    >
                      <Pen className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-emerald-100/70 font-semibold text-sm flex items-center gap-2 justify-center sm:justify-start mb-3">
                  <Briefcase className="w-4 h-4 text-secondary" />
                  {employee.position?.title || "—"} • {employee.branches?.[0]?.branch?.name || "HQ"}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                    {employee.status || "PROBATION"}
                  </span>
                  <span className="px-3 py-1 bg-secondary/20 backdrop-blur-md rounded-full text-[10px] font-bold text-secondary uppercase tracking-widest border border-secondary/10">
                    ID: {employee.empNo}
                  </span>
                  <span className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full text-[10px] font-bold text-white/60 uppercase tracking-widest border border-white/10">
                    NIC: {employee.nic || "—"}
                  </span>
                  <span className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full text-[10px] font-bold text-white/60 uppercase tracking-widest border border-white/10">
                    Joined: {new Date(employee.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Export */}
              {!readOnly && (
                <ExportButton
                  data={{ ...employee, reportingPeople }}
                  exportFn={generateEmployeeFullProfilePDF}
                  className="sm:px-6 bg-white/10 hover:bg-white/20 text-white rounded-full py-2.5 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10 transition-all shadow-lg active:scale-95"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Main Column ── */}
        <div className="lg:col-span-8 space-y-6">

          {!isManagement && (
            <EmployeeStatusSection
              memberId={employee.id}
              status={employee.status}
              orc={orc}
            />
          )}

          {/* Identity + Banking merged into 2-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Identity & Contact */}
            <section className="bg-card/30 backdrop-blur-sm rounded-2xl p-6 border border-border/40">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-5 border-b border-border/40 pb-3 flex items-center gap-2">
                <BadgeInfo className="w-3.5 h-3.5" /> Identity & Contact
              </h4>
              <div className="space-y-4">
                <DetailItem label="Official Name" value={employee.nameWithInitials} icon={<User className="w-4 h-4 text-primary" />} />
                <DetailItem label="NIC" value={employee.nic} icon={<IdCard className="w-4 h-4 text-primary" />} />
                <DetailItem label="Email" value={employee.email} icon={<Mail className="w-4 h-4 text-primary" />} />
                <DetailItem label="Phone" value={employee.phone} icon={<Phone className="w-4 h-4 text-primary" />} />
                <DetailItem label="Address" value={employee.address} icon={<MapPin className="w-4 h-4 text-primary" />} />
                <DetailItem label="Joined" value={new Date(employee.createdAt).toLocaleDateString()} icon={<Calendar className="w-4 h-4 text-primary" />} />
              </div>
            </section>

            {/* Banking & Finance */}
            <section className="bg-card/30 backdrop-blur-sm rounded-2xl p-6 border border-border/40">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-5 border-b border-border/40 pb-3 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" /> Banking & Finance
              </h4>
              <div className="space-y-4">
                <DetailItem label="Account No." value={employee.accNo} icon={<Hash className="w-4 h-4 text-primary" />} />
                <DetailItem label="Bank" value={employee.bank} icon={<Briefcase className="w-4 h-4 text-primary" />} />
                <DetailItem label="Bank Branch" value={employee.bankBranch} icon={<MapPin className="w-4 h-4 text-primary" />} />
                <DetailItem label="EPF No." value={employee.epfNo} icon={<FileText className="w-4 h-4 text-primary" />} />
                <DetailItem label="Designation" value={employee.position?.title} icon={<Briefcase className="w-4 h-4 text-primary" />} />
              </div>
            </section>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-5 border border-border/40">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4 border-b border-border/40 pb-3">
              Reporting Persons
            </h3>
            <div className="space-y-2">
              {reportingPeople.map((person) => {
                const personBranchId = person.branches?.[0]?.branchId;
                return (
                  <Link
                    key={person.id}
                    href={`/features/branches/employees/${personBranchId}/${person.id}`}
                    className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-all border border-transparent hover:border-border"
                  >
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {person.profilePic ? (
                        <img src={person.profilePic} alt={person.nameWithInitials ?? "profile"} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {person.nameWithInitials ?? "Unnamed"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{person.position?.title ?? "No Position"}</p>
                      <p className="text-[10px] text-muted-foreground/60">{person.empNo}</p>
                    </div>
                  </Link>
                );
              })}
              {reportingPeople.length === 0 && (
                <p className="text-[11px] text-muted-foreground/50 py-2">No reporting persons assigned.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Managed Employees */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-widest text-xs">
          Managed Employees
        </h3>
        <SubordinatesSection memberId={employee.id} />
      </div>

      {/* ── Financial Statements ── */}
      <section className="pt-6 border-t border-border/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-bold text-foreground">Financial Statements</h3>

          <div className="flex bg-card/50 p-1 rounded-xl border border-border/40 backdrop-blur-md">
            {(isPermeant || isManagement) && (
              <button
                onClick={() => setActiveTab("paysheets")}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "paysheets"
                  ? "bg-primary/50 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}
              >
                Salary Slips
              </button>
            )}
            {!isManagement && (
              <button
                onClick={() => setActiveTab("commissions")}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "commissions"
                  ? "bg-primary/50 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}
              >
                Commissions
              </button>
            )}
          </div>
        </div>

        {activeTab === "paysheets" ? (
          <PaySheet payrolls={payrolls} member={employee} />
        ) : (
          allCommission && (
            <div className="bg-card/30 rounded-[2rem] p-2 sm:p-6 border border-border/40 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-10 duration-700">
              <CommissionStatementPage data={allCommission} />
            </div>
          )
        )}
      </section>

      {/* ── Danger Zone ── */}
      {!readOnly && (
        <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-all duration-500 py-6">
          <div className="text-center sm:text-left">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">Delete Employee Record</h4>
            <p className="text-[11px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">
              Permanently removes from enterprise records.
            </p>
          </div>
          <button
            onClick={() => handleDeleteClick(Number(params.empId))}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-red-600/20 hover:scale-105 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Delete Record
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {!readOnly && openModel && (
        <EmpModal
          mode="edit"
          initialData={employee}
          onClose={() => setModelOpen(false)}
          onSuccess={fetchMember}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, branchId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee"
        description="This will permanently delete this employee and all associated data. This action cannot be undone."
        confirmLabel="Delete Employee"
        cancelLabel="Keep it"
        variant="danger"
      />
    </main>
  );
};

export default EmployeeDetailsPage;