import { Member } from "@/app/types/member";

interface Props {
  member: Member;
}

export default function MemberCard({ member }: Props) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm border-l-4 border-blue-500">
      <p className="font-bold text-gray-800">{member.name}</p>
      <p className="text-xs text-blue-600 mb-3">
        {member.position?.title}
      </p>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
        <div>
          <p className="text-[10px] text-gray-500 uppercase">ORC Rate</p>
          <p className="font-bold text-gray-700">
            {member.position?.orc
              ? `${member.position.orc.rate}%`
              : "0%"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-gray-500 uppercase">
            Personal Comm Rate
          </p>
          <p className="font-bold text-gray-700">
            {member.position?.personalCommissionTiers?.length
              ? `${member.position.personalCommissionTiers[0].rate}%`
              : "0%"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-gray-500 uppercase">Total Earned</p>
          <p className="font-bold text-green-600">
            Rs. {member.totalCommission?.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
