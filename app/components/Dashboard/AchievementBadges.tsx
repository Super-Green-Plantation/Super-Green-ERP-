import { Trophy, Star } from "lucide-react";

interface AchievementBadgesProps {
  incentiveHit: boolean;
  allowanceHit: boolean;
}

export const AchievementBadges = ({
  incentiveHit,
  allowanceHit,
}: AchievementBadgesProps) => {
  return (
    <>
      {(incentiveHit || allowanceHit) && (
        <div className="flex gap-2 flex-wrap pt-1">
          {incentiveHit && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Trophy className="w-3 h-3" /> Incentive hit
            </span>
          )}
          {allowanceHit && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Star className="w-3 h-3" /> Allowance hit
            </span>
          )}
        </div>
      )}
    </>
  );
};