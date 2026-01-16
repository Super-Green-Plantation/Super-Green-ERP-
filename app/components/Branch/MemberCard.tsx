import { Member } from "@/app/types/member";

export default function MemberCard({ member }: { member: Member }) {
  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          {member.name}
        </h3>
        <p className="text-sm text-gray-500">
          {member.position.title}
        </p>
      </div>

      {/* Body */}
      <div className="space-y-2 text-sm text-gray-700">
        <p>
          📞 <span className="font-medium">{member.phone}</span>
        </p>
        <p>
          ✉️ <span className="font-medium">{member.email}</span>
        </p>
        <p>
          💼 Salary:{" "}
          <span className="font-semibold">
            Rs. {member.position.baseSalary.toLocaleString()}
          </span>
        </p>
        <p>
          💰 Commission:{" "}
          <span className="font-semibold text-green-600">
            Rs. {member.totalCommission.toLocaleString()}
          </span>
        </p>
      </div>
    </div>
  );
}
