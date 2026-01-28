import { Member } from "@/app/types/member";

interface Props {
  member: Member;
}

export default function MemberCard({ member }: Props) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Header Section */}
      <div className="border-l-4 border-blue-500 bg-linear-to-r from-blue-50/50 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-extrabold text-gray-900 tracking-tight leading-none mb-1">
              {member.name}
            </p>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-600">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              {member.position?.title}
            </span>
          </div>

          {/* Earnings Badge */}
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              Total Earned
            </p>
            <p className="text-sm font-black text-emerald-600">
              Rs. {member.totalCommission?.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Rates Section */}
      <div className="grid grid-cols-2 divide-x divide-gray-50 border-t border-gray-100 bg-gray-50/30">
        <div className="p-3 text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            ORC Rate
          </p>
          <p className="text-base font-bold text-gray-700">
            {member.position?.orc ? `${member.position.orc.rate}%` : "0%"}
          </p>
        </div>

        <div className="p-3 text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Personal Rate
          </p>
          
            {member.position?.personalCommissionTiers?.length ? (
              <div className="space-y-0.5">
                {member.position.personalCommissionTiers.map((p) => (
                  <span key={p.id} className="block text-sm">
                    {p.rate}%
                  </span>
                ))}
              </div>
            ) : (
              "0%"
            )}
        </div>
      </div>
    </div>
  );
}
