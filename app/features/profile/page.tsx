
import { getCurrentUser } from "@/lib/auth";
import {
  Briefcase,
  MapPin,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import EmployeeDetailsPage from "../branches/employees/[branchId]/[empId]/page";

export default async function Profile() {
  const user = await getCurrentUser();
  const member = user?.member;

  if (!user) return <div className="text-white font-bold p-8">Access Denied.</div>;

  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-4 sm:p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Identity Card */}
        <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="relative shrink-0">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-slate-100 border-2 border-white/20 flex items-center justify-center overflow-hidden shadow-xl">
                <UserIcon size={48} className="text-slate-800" />
              </div>
              {user.status && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-2 rounded-full border-4 border-slate-900 shadow-lg">
                  <ShieldCheck size={18} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tighter uppercase drop-shadow-sm">
                {user?.name || "Unregistered Member"}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-slate-200 text-sm font-bold">
                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-white/5">
                  <Briefcase size={18} className="text-blue-400" />
                  <span>{user?.role || "No Position Assigned"}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-white/5">
                  <MapPin size={18} className="text-emerald-400" />
                  <span>{member?.branches?.[0]?.branch.name || "Head Office"}</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto bg-slate-950 border border-blue-500/30 rounded-2xl md:rounded-3xl p-6 min-w-50 text-center shadow-2xl relative">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-2">
                Total Commission
              </p>
              <span className="text-xl font-bold text-white tracking-tight">
                <span className="text-blue-500 mr-1">LKR</span>
                {member?.totalCommission?.toLocaleString() || "0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pass member.id directly — no URL params needed */}
      {member?.id && <EmployeeDetailsPage empId={member.id} readOnly={true}/>}
    </div>
  );
}
