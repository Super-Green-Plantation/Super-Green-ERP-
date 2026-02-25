import { getCurrentUser } from "@/lib/auth";
import {
  Briefcase,
  MapPin,
  ShieldCheck,
  User as UserIcon
} from "lucide-react";

export default async function Profile() {
 const user = await getCurrentUser();
 
  const member = user.member;

  // Handle case where user session might not exist
  if (!user) return <div className="text-white">Access Denied.</div>;


  return (
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* TOP SECTION: IDENTITY CARD */}
        <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Avatar Area */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                <UserIcon size={48} className="text-slate-600" />
              </div>
              {user.status && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-full border-4 border-slate-900 shadow-lg">
                  <ShieldCheck size={16} className="text-white" />
                </div>
              )}
            </div>

            {/* Main Member Info */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">
                  {member?.name || "Unregistered Member"}
                </h1>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] w-fit mx-auto md:mx-0">
                  {user.role}
                </span>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-5 text-slate-400 text-sm font-bold">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-500" />
                  <span className="truncate">{member?.position?.title || "No Position Assigned"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-500" />
                  <span>{member?.branch?.name || "Head Office"}</span>
                </div>
              </div>
            </div>

            {/* Earnings Stat - Full width on mobile */}
            <div className="w-full md:w-auto bg-slate-950/60 border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6 min-w-[180px] text-center backdrop-blur-md">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">
                Total Commission
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  ${member?.totalCommission?.toLocaleString() || "0"}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
