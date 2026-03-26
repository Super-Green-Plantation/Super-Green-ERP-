"use client";

import Back from "@/app/components/Buttons/Back";
import { DetailItem } from "@/app/components/DetailItem";
import { getMemberDetails } from "@/app/features/employees/actions";
import { getEmployeeCommissions } from "@/app/features/commissions/actions";
import {
  BadgeInfo,
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Pen,
  Phone,
  Trash2,
  User,
  Star,
  ShieldCheck,
  TrendingUp,
  Wallet,
  ArrowRight,
  Lock,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CommissionStatementPage from "@/app/components/Commission/CommissionStatementPage";
import { generateEmployeeCommissionPDF } from "@/app/utils/pdfGenerator";
import ExportButton from "@/app/components/Doc/ExportStatement";
import EmpModal from "@/app/components/Employee/Model";
import { Member } from "@/app/types/member";
import EmployeeStatusSection from "@/app/components/Employee/Employeestatussection";
import Loading from "@/app/components/Status/Loading";
import Image from "next/image";

import { getEmployeePerformance } from "./getEmployeePerfomance";

const EmployeeDetailsPage = ({ empId: propEmpId, readOnly = false }: { empId?: number; readOnly?: boolean }) => {
  const params = useParams();
  const resolvedEmpId = propEmpId ?? Number(params.empId);
  
  const [employee, setEmployee] = useState<Member | null>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allCommission, setAllCommission] = useState();
  const [openModel, setModelOpen] = useState(false);
  const [orc, setOrc] = useState(0);

  useEffect(() => {
    if (employee?.status === "PERMANENT") {
      setOrc(employee.position?.orc?.ratePermanent * 100 || 0);
    } else if (employee?.status === "PROBATION") {
      setOrc(employee.position?.orc?.rateNonPermanent * 100 || 0);
    }
  }, [employee]);

  const fetchMember = async () => {
    setLoading(true);
    try {
      const data = await getMemberDetails(resolvedEmpId);
      setEmployee(data.res as Member);
      
      // Fetch performance data
      const perfData = await getEmployeePerformance(resolvedEmpId);
      setPerformance(perfData);
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
      };
      fetchAll();
    }
  }, [resolvedEmpId]);

  if (loading) return <Loading />;
  if (!employee) return null;

  // Calculate target progress
  let targetValue = 0;
  let achievedValue = 0;
  let targetLabel = "Monthly Target";

  if (performance?.status === "PROBATION") {
    targetValue = performance.target?.targetAmount || 0;
    achievedValue = performance.evaluation?.volumeAchieved || 0;
    targetLabel = `Probation Target (P${performance.periodNumber} M${performance.monthInPeriod})`;
  } else if (performance?.status === "PERMANENT") {
    targetValue = performance.salary?.monthlyTarget || 0;
    achievedValue = performance.currentPayroll?.volumeAchieved || 0;
  }

  const progressPercentage = targetValue > 0 ? Math.min(Math.round((achievedValue / targetValue) * 100), 100) : 0;

  return (
    <main className="max-w-7xl mx-auto min-h-screen bg-background p-4 sm:p-8 space-y-8 animate-in fade-in duration-700">
      
      {/* ── Premium Hero Section: Glassmorphic Profile ── */}
      <section className="relative h-72 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/10 border border-white/10 group">
        <div className="absolute inset-0 bg-linear-to-br from-primary/95 via-primary to-primary-container z-0" />
        <div className="absolute top-0 right-0 w-125 h-125 bg-secondary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative h-full flex items-end p-8 sm:p-12 z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8 w-full">
            
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
              <div className="absolute -bottom-2 -right-2 bg-secondary p-2.5 rounded-2xl shadow-lg border-4 border-primary">
                 <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row justify-between items-center sm:items-end w-full gap-6">
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                  <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-heading">
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
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                  <span className="px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-[0.2em] border border-white/5">
                    {employee.status || "PROBATION"}
                  </span>
                  <span className="px-4 py-1.5 bg-secondary/20 backdrop-blur-md rounded-full text-[10px] font-bold text-secondary uppercase tracking-[0.2em] border border-secondary/10">
                    ID: {employee.empNo}
                  </span>
                </div>
              </div>

    
              
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Main Column: Calibration ── */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Real-time Performance Calibration */}
          <section className="bg-card/50 backdrop-blur-md rounded-[2.5rem] p-8 sm:p-10 border border-border/50 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-4">
                   <TrendingUp className="w-7 h-7 text-primary" />
                   Performance Calibration
                </h3>
             </div>
             
             <div className="space-y-10">
                {/* Main Volume Progress */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                     <div>
                       <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{targetLabel}</span>
                       <p className="text-xs text-primary font-bold mt-1">Goal: {targetValue.toLocaleString()}</p>
                     </div>
                     <div className="text-right">
                       <span className="text-2xl font-bold text-primary">{achievedValue.toLocaleString()}</span>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Achieved Volume</p>
                     </div>
                  </div>
                  <div className="h-4 w-full bg-muted/20 rounded-full overflow-hidden border border-border/30">
                     <div 
                       className={`h-full bg-teal-700 rounded-full shadow-lg shadow-secondary/10 transition-all duration-1000 ease-out`}
                       style={{ width: `${progressPercentage}%` }}
                     />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                     <span>0% Start</span>
                     <span>{progressPercentage}% Progress</span>
                     <span>100% Target</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/30">
                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                       <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">Status Calibration</p>
                       <p className="text-lg font-bold text-primary">{employee.status}</p>
                       <p className="text-xs text-muted-foreground mt-1">Current employment lifecycle phase.</p>
                    </div>
                    <div className="p-6 bg-secondary/5 rounded-2xl border border-secondary/10">
                       <p className="text-[10px] font-bold text-secondary/60 uppercase tracking-widest mb-1">Overriding Rate (ORC)</p>
                       <p className="text-lg font-bold text-secondary">{orc}% Yield</p>
                       <p className="text-xs text-muted-foreground mt-1">Strategic yield on branch performance.</p>
                    </div>
                </div>
             </div>
          </section>

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
          
          {/* High-Fidelity Payroll Summary */}
          <section className="bg-primary rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 bg-secondary/10 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                   <div>
                      <p className="text-emerald-100/40 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Total Earned YTD</p>
                      <p className="text-4xl font-bold font-heading leading-none">
                         <span className="text-sm font-medium opacity-60 mr-1.5">Rs.</span>
                         {employee.totalCommission?.toLocaleString()}
                      </p>
                   </div>
                   <div className="p-4 bg-white/10 rounded-[1.5rem] border border-white/10 backdrop-blur-md">
                      <Wallet className="w-6 h-6 text-secondary" />
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5">
                      <div>
                         <p className="text-emerald-100/40 text-[9px] font-bold uppercase tracking-widest mb-1">Rank Seniority</p>
                         <p className="text-lg font-bold">Level {employee.position?.rank || 1}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-emerald-100/40 text-[9px] font-bold uppercase tracking-widest mb-1">ORC Yield</p>
                         <p className="text-lg font-bold text-secondary">{orc}%</p>
                      </div>
                   </div>

                   <ExportButton 
                     data={{ ...employee, allCommission }} 
                     exportFn={generateEmployeeCommissionPDF} 
                     className="w-full bg-white/10 hover:bg-white/20 text-white rounded-[1.5rem] py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-white/5 transition-all shadow-lg active:scale-95"
                   />
                </div>
             </div>
          </section>

          {/* Employment Cycle Section */}
          <EmployeeStatusSection
            memberId={employee.id}
            status={employee.status}
            onStatusChange={(newStatus) =>
              setEmployee((prev) => prev ? { ...prev, status: newStatus } : prev)
            }
          />
        </aside>
      </div>

      {/* ── Financial Statement Feed ── */}
      <section className="pt-12 border-t border-border/50">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
           <div>
              <h3 className="text-4xl font-bold text-foreground tracking-tight font-heading">Financial Pulse</h3>
              <p className="text-muted-foreground font-medium">Archival record of commission cycles and distributions.</p>
           </div>
           {!readOnly && <Back />}
        </div>
        
        {allCommission && (
          <div className="bg-card/30 rounded-[3rem] p-2 sm:p-6 border border-border/40 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <CommissionStatementPage data={allCommission} />
          </div>
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
      {!readOnly && (
        <div className="pt-12 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-8 opacity-40 hover:opacity-100 transition-all duration-500 py-10">
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Protocol Override</h4>
            <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wider">
              Permanent archival extraction from core enterprise records.
            </p>
          </div>
          <button className="flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-[1.5rem] text-xs font-bold uppercase tracking-widest shadow-xl shadow-red-600/20 hover:scale-105 transition-all">
            <Trash2 className="w-4 h-4" /> Execute Record Termination
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
    </main>
  );
};

export default EmployeeDetailsPage;