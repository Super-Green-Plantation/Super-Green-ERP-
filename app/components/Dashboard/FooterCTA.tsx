import Link from "next/link";
import { UserAvatar } from "./UserAvatar";
import { BanknoteArrowUp, TrendingUp } from "lucide-react";

interface FooterCTAProps {
  userName: string | null | undefined;
  onNewProposalClick?: () => void;
}

export const FooterCTA = ({
  userName,
  onNewProposalClick,
}: FooterCTAProps) => {
  const firstName = userName?.split(" ")[0] ?? "there";

  return (
    <div className="bg-card/60 border border-border/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <UserAvatar seed={userName ?? ""} className="w-full h-full" />
        </div>
        <div>
          <p className="text-sm font-black text-foreground">{userName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
              Keep pushing forward
            </p>
          </div>
        </div>
      </div>
      <Link
        href="/features/clients"
        onClick={onNewProposalClick}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
      >
        <BanknoteArrowUp className="w-3.5 h-3.5" />
        New proposal
      </Link>
    </div>
  );
};