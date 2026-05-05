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
  User
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { generateEmployeeFullProfilePDF } from "@/app/pdf/EmployeeProfile";
import Link from "next/link";
import { getEmployeePerformance } from "./getEmployeePerfomance";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Router } from "next/router";

const EmployeeDetailsPage = ({ empId: propEmpId, readOnly = false }: { empId?: number; readOnly?: boolean }) => {
  const params = useParams();
  const resolvedEmpId = propEmpId ?? Number(params.empId);
  const branchId = Number(params.branchId);

  const [employee, setEmployee] = useState<Member | null>(null);
  // const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allCommission, setAllCommission] = useState();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [openModel, setModelOpen] = useState(false);
  const [orc, setOrc] = useState(0);
  const [reportingPeople, setReportingPeople] = useState<any[]>([]);
  const [isManagement, setIsManagement] = useState(false)
  const [isPermeant, setIsPermeant] = useState(false)
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
      setIsManagement(true)
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
    <main className=" max-w-7xl mx-auto min-h-screen sm:p-8 space-y-8 animate-in fade-in duration-700">

      {/* ── Premium Hero Section: Glassmorphic Profile ── */}
      <section className="relative h-auto sm:h-72 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl shadow-primary/10 border border-white/10 group">
        <div className="absolute inset-0 dark:bg-teal-900 bg-teal-900 z-0" />
        <div className="absolute top-0 right-0 w-125 h-125 bg-secondary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative min-h-72 h-auto sm:h-full flex items-end p-8 sm:p-12 z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 w-full mt-8 sm:mt-0">

            <div className="relative group shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl relative">
                {employee.profilePic ? (
                  <Image
                    src={employee.profilePic}
                    alt={employee.nameWithInitials ?? "Profile"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <User className="w-16 h-16 text-white/50" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row justify-between items-center sm:items-end w-full gap-5 sm:gap-6 mt-2 sm:mt-0">
              <div className="text-center sm:text-left flex flex-col items-center sm:items-start w-full">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                  <h1 className="text-3xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
                    {employee.nameWithInitials}
                  </h1>
                  {!readOnly && (
                    <button
                      onClick={() => setModelOpen(true)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md border border-white/10 shadow-sm"
                    >
                      <Pen className="w-4 h-4" />
                    </button>
                  )}

                </div>
                <p className="text-emerald-100/70 font-bold text-lg flex items-center gap-2 justify-center sm:justify-start">
                  <Briefcase className="w-5 h-5 text-secondary" />
                  {employee.position?.title || "Department Lead"} • {employee.branches?.[0]?.branch?.name || "HQ"}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 mt-6 w-full sm:w-auto">
                  {/* Status Badge */}
                  <span className="px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-[0.2em] border border-white/5 whitespace-nowrap">
                    {employee.status || "PROBATION"}
                  </span>

                  {/* ID Badge */}
                  <span className="px-4 py-1.5 bg-secondary/20 backdrop-blur-md rounded-full text-[10px] font-bold text-secondary uppercase tracking-[0.2em] border border-secondary/10 whitespace-nowrap">
                    ID: {employee.empNo}
                  </span>

                  {/* Export Button - Full width on mobile, auto width on desktop */}
                  {!readOnly && (
                    <ExportButton
                      data={{ ...employee, reportingPeople }}
                      exportFn={generateEmployeeFullProfilePDF}
                      className="w-full sm:w-auto sm:px-6 bg-white/10 hover:bg-white/20 text-white rounded-full py-3 sm:py-2 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 border border-white/5 transition-all shadow-lg active:scale-95"
                    />
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Main Column: Calibration ── */}
        <div className="lg:col-span-8 space-y-8">

          {!isManagement && (
            <EmployeeStatusSection
              memberId={employee.id}
              status={employee.status}
              orc={orc}  
            />
          )}


          {/* Detailed Info Blocks (Identity & Banking) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-card/30 backdrop-blur-sm rounded-[2rem] p-8 border border-border/40">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mb-8 border-b border-border/40 pb-4 flex items-center gap-2">
                <BadgeInfo className="w-4 h-4" /> Identity & Contact
              </h4>
              <div className="space-y-6">
                <DetailItem label="Official Name" value={employee.nameWithInitials} icon={<User className="w-4 h-4 text-primary" />} />
                <DetailItem label="Email Address" value={employee.email} icon={<Mail className="w-4 h-4 text-primary" />} />
                <DetailItem label="Phone Line" value={employee.phone} icon={<Phone className="w-4 h-4 text-primary" />} />
                <DetailItem label="Address" value={employee.address} icon={<MapPin className="w-4 h-4 text-primary" />} />
              </div>
            </section>

            <section className="bg-card/30 backdrop-blur-sm rounded-[2rem] p-8 border border-border/40">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mb-8 border-b border-border/40 pb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Banking & Finance
              </h4>
              <div className="space-y-6">
                <DetailItem label="Account Number" value={employee.accNo} icon={<Hash className="w-4 h-4 text-primary" />} />
                <DetailItem label="Primary Bank" value={employee.bank} icon={<Briefcase className="w-4 h-4 text-primary" />} />
                <DetailItem label="Bank Branch" value={employee.bankBranch} icon={<MapPin className="w-4 h-4 text-primary" />} />
                <DetailItem label="EPF Registration" value={employee.epfNo} icon={<FileText className="w-4 h-4 text-primary" />} />
              </div>
            </section>
          </div>
        </div>

        {/* ── Sidebar Column ── */}
        <aside className="lg:col-span-4 space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Reporting Persons
            </h3>

            <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-3">
              {reportingPeople.map((person) => {
                const branchId = person.branches?.[0]?.branchId;

                return (
                  <Link
                    key={person.id}
                    href={`/features/branches/employees/${branchId}/${person.id}`}
                    className="group border rounded-xl p-3 bg-white hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">

                      {/* Profile Image */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {person.profilePic ? (
                          <img
                            src={person.profilePic}
                            alt={person.nameWithInitials ?? "profile"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">No Img</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600">
                          {person.nameWithInitials ?? "Unnamed"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {person.position?.title ?? "No Position"}
                        </p>

                        <p className="text-xs text-gray-400">
                          {person.empNo}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {reportingPeople.length === 0 && (
              <p className="text-xs text-gray-400 mt-2">
                No reporting persons assigned.
              </p>
            )}
          </div>
        </aside>
      </div>



      {/* ── Financial Statement Feed ── */}
      <section className="pt-12 border-t border-border/50">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-10 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-foreground flex items-center gap-4">
              Financial Statements
            </h3>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex bg-card/50 p-1 rounded-xl border border-border/40 backdrop-blur-md">

              {(isPermeant || isManagement) && (
                <button
                  onClick={() => setActiveTab("paysheets")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "paysheets"
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
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "commissions"
                    ? "bg-primary/50 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}
                >
                  Commissions
                </button>
              )}

            </div>
            {/* {!readOnly && <Back />} */}
          </div>
        </div>

        {activeTab === "paysheets" ? (
          <PaySheet payrolls={payrolls} member={employee} />

        ) : (
          allCommission && (
            <div className="bg-card/30 rounded-[3rem] p-2 sm:p-6 border border-border/40 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <CommissionStatementPage data={allCommission} />
            </div>
          )
        )}
      </section>

      {/* ── Identity Audit Details ── */}
      <section className="bg-primary/5 rounded-[2.5rem] p-8 sm:p-12 border border-primary/5">
        <h4 className="text-xs font-bold text-primary/40 uppercase tracking-[0.5em] mb-10 text-center">Identity Audit Archives</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <DetailItem label="EPF Registry" value={employee.epfNo} />
          <DetailItem label="NIC Reference" value={employee.nic} />
          <DetailItem label="Onboarding Date" value={new Date(employee.createdAt).toLocaleDateString()} />
          <DetailItem label="Designation Entry" value={employee.position?.title} />
        </div>
      </section>

      {/* ── Termination Protocol (Danger Zone) ── */}
      {
        !readOnly && (
          <div className="pt-12 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-8 opacity-40 hover:opacity-100 transition-all duration-500 py-10">
            <div className="text-center sm:text-left">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Delete Employee Record</h4>
              <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wider">
                Permanent delete from core enterprise records.
              </p>
            </div>
            <button
              onClick={() => handleDeleteClick(Number(params.empId))}
              className="flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-[1.5rem] text-xs font-bold uppercase tracking-widest shadow-xl shadow-red-600/20 hover:scale-105 transition-all">
              <Trash2 className="w-4 h-4" /> Delete This Record
            </button>
          </div>
        )
      }

      {/* Edit Modal */}
      {
        !readOnly && openModel && (
          <EmpModal
            mode="edit"
            initialData={employee}
            onClose={() => setModelOpen(false)}
            onSuccess={fetchMember}
          />
        )
      }

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
    </main >
  );
};

export default EmployeeDetailsPage;