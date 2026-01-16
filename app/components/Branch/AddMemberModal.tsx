"use client"

import { User, Briefcase, Phone, Wallet, Mail, X } from "lucide-react";
// කලින් තිබූ පේළිය: import { createMember } from "./actions"; 
// නිවැරදි පේළිය:
import { createMember } from "@/app/features/branches/employees/[id]/actions";import { useParams } from "next/navigation";
import { useState } from "react";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMemberModal({ isOpen, onClose }: AddMemberModalProps) {
  const params = useParams();
  const branchId = parseInt(params.id as string); // URL එකෙන් ID එක ලබා ගැනීම
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await createMember(formData, branchId);
    setLoading(false);

    if (res.success) {
      onClose(); // සාර්ථක නම් Modal එක වසන්න
    } else {
      alert(res.error); // දෝෂයක් නම් පණිවිඩයක් පෙන්වන්න
    }
  }

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300"
    >
      <div 
        onClick={(e) => e.stopPropagation()} // Form එක ඇතුළත ක්ලික් කළ විට වැසීම වළක්වයි
        className="relative w-full max-w-md overflow-hidden rounded-[1rem] bg-white p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-500"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-gray-900">Add New Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-5">
          {/* Name Field - 'name' attribute එක වැදගත් වේ */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input name="name" type="text" required placeholder="John Doe" className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Position</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input name="position" type="text" required placeholder="Branch Manager" className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Phone</label>
              <input name="phone" type="text" required placeholder="077..." className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 px-4 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Basic Salary</label>
              <input name="salary" type="number" required placeholder="50000" className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 px-4 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input name="email" type="email" required placeholder="example@office.com" className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:bg-blue-300"
          >
            {loading ? "Processing..." : "Create Member Account"}
          </button>
        </form>
      </div>
    </div>
  );
}