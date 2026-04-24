"use client";

import Heading from '@/app/components/Heading';
import Error from '@/app/components/Status/Error';
import Loading from '@/app/components/Status/Loading';
import { useUsers } from '@/app/hooks/useUsers';
import {
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Shield,
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
    <div className="max-w-7xl mx-auto sm:space-y-8 space-y-2 sm:p-4 md:p-8 min-h-screen">
      <div className="mb-8">
        <Heading>
          Access Control
        </Heading>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Manage employee accounts and permissions</p>
      </div>

      <div className="w-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Identity</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">System Role</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Branch</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map((user: any) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                  {/* Identity Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/10 uppercase">
                        {user?.name?.charAt(0) || <UserIcon size={16} />}
                      </div> */}
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground leading-tight">
                          {user?.name || "Unassigned"}
                        </span>
                        
                      </div>
                    </div>
                  </td>

                  {/* Role Column */}
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-tight">
                      <Shield size={12} className="opacity-70" />
                      {user.role}
                    </div>
                  </td>

                  {/* Branch Column */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                        <MapPin size={12} className="text-muted-foreground opacity-50" />
                        {user.member?.branches[0]?.branch.name || "N/A"}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold ml-4 uppercase">
                        {user.member?.branches[0]?.branch.location || "Head Office"}
                      </span>
                    </div>
                  </td>


                  {/* Status Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        disabled={isUpdating === user.id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer disabled:opacity-50 ${user.status ? 'bg-green-500' : 'bg-muted'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-card shadow-sm transition duration-200 ease-in-out ${user.status ? 'translate-x-4.5' : 'translate-x-1'}`}>
                          {isUpdating === user.id && <Loader2 size={8} className="animate-spin text-muted-foreground" />}
                        </span>
                      </button>

                      {/* Label Badge */}
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${user.status
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                        : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                        {user.status ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {user.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <ActionMenu userId={user.id} currentRole={user.role} email={user.email} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users?.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground/30">
              <UserIcon size={48} strokeWidth={1} className="mb-4 opacity-50" />
              <p className="text-sm font-bold uppercase tracking-widest">No users found in records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListPage;
