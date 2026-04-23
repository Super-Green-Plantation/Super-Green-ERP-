"use client";

import { Member } from "@/app/types/member";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  member: Member;
  investmentAmount?: number | null;
  isEnabled?: boolean;
  onToggle?: (empNo: string) => void;
}

export default function MemberCard({
  member,
  investmentAmount,
  isEnabled = true,
  onToggle,
}: Props) {
  const orcRate = member.position?.orc
    ? Number(
        member.status === "PERMANENT"
          ? member.position.orc.ratePermanent
          : member.position.orc.rateNonPermanent
      )
    : null;

  const estimatedCommission =
    isEnabled && orcRate != null && investmentAmount
      ? investmentAmount * orcRate
      : null;

  return (
    <div
      className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
        isEnabled
          ? "border-gray-100 hover:shadow-md"
          : "border-gray-100 opacity-40 grayscale"
      }`}
    >
      {/* Header Section */}
      <div className="bg-linear-to-r from-blue-50/50 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-gray-900 tracking-tight leading-none mb-1 truncate">
              {member.nameWithInitials}
            </p>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-600">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
              {member.position?.title}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-2">
            {/* Earnings Badge */}
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                Total Earned
              </p>
              <p className="text-sm font-bold text-emerald-600">
                Rs. {member.totalCommission?.toLocaleString()}
              </p>
            </div>

            {/* Toggle Button */}
            {onToggle && (
              <button
                onClick={() => onToggle(member.empNo)}
                title={isEnabled ? "Disable member" : "Enable member"}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                  isEnabled
                    ? "text-blue-500 hover:bg-blue-50"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                {isEnabled ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rates + Status Section */}
      <div className="grid grid-cols-3 divide-x divide-gray-50 border-t border-gray-100 bg-gray-50/30">
        <div className="p-3 text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            ORC Rate
          </p>
          <p className="text-base font-bold text-gray-700">
            {orcRate != null ? `${(orcRate * 100).toFixed(2)}%` : "0%"}
          </p>
        </div>

        <div className="p-3 text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Status
          </p>
          <p className="text-base font-bold text-gray-700">
            {member.status ?? "—"}
          </p>
        </div>

        <div className="p-3 text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Est. ORC
          </p>
          {!isEnabled ? (
            <p className="text-base font-bold text-gray-400">—</p>
          ) : estimatedCommission != null ? (
            <p className="text-[11px] font-bold text-emerald-600 leading-tight">
              Rs.{" "}
              {estimatedCommission.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          ) : (
            <p className="text-[9px] font-medium text-gray-400 leading-tight">
              Select investment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}