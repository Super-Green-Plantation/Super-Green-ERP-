import { Member } from "@/app/types/member";
import { POSITION_RANK } from "./positionRank";

export function getEligibleCommissionMembers(
  businessOwnerPosition: keyof typeof POSITION_RANK,
  allMembers: Member[]
) {
  const ownerRank = POSITION_RANK[businessOwnerPosition];

  return allMembers.filter(
    (member) => POSITION_RANK[member.position.title] >= ownerRank
  );
}
