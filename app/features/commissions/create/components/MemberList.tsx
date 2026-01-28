import { Member } from "@/app/types/member";
import MemberCard from "./MemberCard";

interface Props {
  members?: Member[];
  loading: boolean;
  selectedEmpNo: string;
}

export default function MemberList({
  members,
  loading,
  selectedEmpNo,
}: Props) {
  if (loading) {
    return (
      <p className="text-sm text-gray-400 italic">
        Loading eligible members…
      </p>
    );
  }

  if (selectedEmpNo && (!members || members.length === 0)) {
    return (
      <p className="text-sm text-red-500 italic">
        No eligible members found
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {members?.map((m) => (
        <MemberCard key={m.id} member={m} />
      ))}
    </div>
  );
}
