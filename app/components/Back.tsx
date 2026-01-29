import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const Back = () => {
  const router = useRouter();
  return (
    <div>
      <button
        onClick={() => router.back()}
        className="p-2 hover:bg-white rounded-xl border border-gray-200 transition-all active:scale-95"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
};

export default Back;
