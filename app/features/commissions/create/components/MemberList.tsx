"use client";

import { Member } from "@/app/types/member";
import MemberCard from "./MemberCard";

interface Props {
  members?: Member[];
  manualMembers?: Member[];
  loading: boolean;
  selectedEmpNo: string;
  investmentAmount?: number | null;
  disabledEmpNos: Set<string>;
  onToggle: (empNo: string) => void;
}

export default function MemberList({
  members,
  manualMembers = [],
  loading,
  selectedEmpNo,
  investmentAmount,
  disabledEmpNos,
  onToggle,
}: Props) {
  if (loading) {
    return (
      <p className="text-sm text-gray-400 italic">Loading eligible members…</p>
    );
  }

  const hasEligible = members && members.length > 0;
  const hasManual = manualMembers.length > 0;

  if (selectedEmpNo && !hasEligible && !hasManual) {
    return (
      <p className="text-sm text-red-500 italic">No eligible members found</p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Eligible / hierarchy members */}
      {members?.map((m, index) => (
        <MemberCard
          key={index}
          member={m}
          investmentAmount={investmentAmount}
          isEnabled={!disabledEmpNos.has(m.empNo)}
          onToggle={onToggle}
        />
      ))}

      {/* Manually added members */}
      {hasManual && (
        <>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Manually Added
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {manualMembers.map((m,index) => (
            <MemberCard
              key={index}
              member={m}
              investmentAmount={investmentAmount}
              isEnabled={!disabledEmpNos.has(m.empNo)}
              onToggle={onToggle}
            />
          ))}
        </>
      )}
    </div>
  );
}