"use client";

import Error from '@/app/components/Error';
import Loading from '@/app/components/Loading';
import { useUsers } from '@/app/hooks/useUsers';
import {
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MoreVertical,
  Shield,
  TrendingUp,
  User as UserIcon
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { updateUserStatus } from './action';
import { ActionMenu } from './ActionMenu';

const UserListPage = () => {

  const { data: usersData, isLoading, isError } = useUsers();
  const [users, setUsers] = useState<any[]>([]);

  // Initialize local state when hook finishes loading
  useEffect(() => {
    if (usersData) {
      setUsers(
        usersData.map((u: any) => ({
          ...u,
          status: u.status, // already boolean, no conversion needed
        }))
      );
    }
  }, [usersData]);


  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  if (isLoading) return <Loading />

  if (isError) return <Error />

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    setIsUpdating(userId); // disable button

    try {
      await updateUserStatus(userId, newStatus); // API call
      toast.success(`User access set to ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (error) {
      // rollback if API fails
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: currentStatus } : u))
      );
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(null);
    }
  };
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Access Control</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Manage employee accounts and permissions</p>
      </div>

      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Identity</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">System Role</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Branch</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users?.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Identity Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-slate-200 uppercase">
                        {user.member?.name?.charAt(0) || <UserIcon size={16} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 leading-tight">
                          {user.member?.name || "Unassigned"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                          Ref: {user.member?.empNo || user.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Role Column */}
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-tight">
                      <Shield size={12} className="opacity-70" />
                      {user.role}
                    </div>
                  </td>

                  {/* Branch Column */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-600">
                        <MapPin size={12} className="text-slate-300" />
                        {user.member?.branch?.name || "N/A"}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold ml-4 uppercase">
                        {user.member?.branch?.location || "Head Office"}
                      </span>
                    </div>
                  </td>


                  {/* Status Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        disabled={isUpdating === user.id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer disabled:opacity-50 ${user.status ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${user.status ? 'translate-x-4.5' : 'translate-x-1'}`}>
                          {isUpdating === user.id && <Loader2 size={8} className="animate-spin text-slate-400" />}
                        </span>
                      </button>

                      {/* Label Badge */}
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${user.status
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                        {user.status ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {user.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                     <ActionMenu userId={user.id} currentRole={user.role} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users?.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <UserIcon size={48} strokeWidth={1} className="mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">No users found in records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListPage;