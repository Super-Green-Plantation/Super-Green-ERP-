"use client"

import { useState } from "react";
import { Member } from "@/app/types/member";
import AddMemberModal from "./AddMemberModal";
import { 
  Phone, Mail, Wallet, BadgeDollarSign, User, 
  ChevronRight, Plus, X, Briefcase 
} from "lucide-react";

// --- Add Member Modal Component ---
// මෙම කොටස මඟින් සාමාජිකයෙකු ඇතුළත් කිරීමේ Form එක පෙන්වයි

// --- Main Member Card Component ---
export default function MemberCard({ member }: { member: Member }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Add New Member Button - Card එකට ඉහළින් හෝ ඔබේ පද්ධතියේ ඉහළින් */}
      <div className="flex justify-start px-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-[0.7rem] font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <div className="bg-white/20 rounded-lg p-1 group-hover:rotate-90 transition-transform">
            <Plus size={15} />
          </div>
          Add New Member
        </button>
      </div>

      {/* Member Card */}
      <div className="group relative w-full max-w-[320px] overflow-hidden rounded-[1rem] border border-gray-100 bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10">
        
        <div className="absolute top-0 left-0 h-1.5 w-0 bg-blue-600 transition-all duration-700 ease-out group-hover:w-full" />

        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 shadow-sm">
            <User size={28} />
          </div>
          <div className="overflow-hidden">
            <h3 className="truncate text-lg font-black text-gray-900 leading-tight">
              {member.name}
            </h3>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">
              {member.position.title}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-6 border-b border-gray-50 pb-5">
          <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-900 transition-colors">
            <Phone size={14} className="text-blue-400" />
            <span className="text-xs font-semibold">{member.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-900 transition-colors">
            <Mail size={14} className="text-blue-400" />
            <span className="text-xs font-semibold truncate">{member.email}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 transition-all group-hover:bg-blue-50/50">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm text-gray-400 group-hover:text-blue-600">
                <Wallet size={14} />
              </div>
              <span className="text-[10px] font-bold uppercase text-gray-400">Salary</span>
            </div>
            <span className="text-sm font-black text-gray-900">
              Rs. {member.position.baseSalary.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-green-50/50 p-3 transition-all group-hover:bg-green-50">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm text-green-400">
                <BadgeDollarSign size={14} />
              </div>
              <span className="text-[10px] font-bold uppercase text-gray-400">Comm.</span>
            </div>
            <span className="text-sm font-black text-green-600">
              Rs. {member.totalCommission.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-end opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase">
            View Details <ChevronRight size={12} />
          </div>
        </div>
      </div>

      {/* Modal - Rendered separate to keep focus */}
     <AddMemberModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}