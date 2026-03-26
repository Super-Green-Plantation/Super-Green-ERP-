import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const Back = () => {
  const router = useRouter();
  return (
    <div>
      <button
        onClick={() => router.back()}
        className="p-2 hover:bg-muted rounded-xl border border-border transition-all active:scale-95 text-foreground"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Back;
