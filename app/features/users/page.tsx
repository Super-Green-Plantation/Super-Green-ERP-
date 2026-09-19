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
  Search,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const ITEMS_PER_PAGE = 10;

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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedQuery) return true;
    const branch = user.member?.branches?.[0]?.branch;
    return [user.name, user.email, user.role, branch?.name, branch?.location]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const activeUsers = filteredUsers.filter((user) => user.status).length;
  const inactiveUsers = filteredUsers.length - activeUsers;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen w-full space-y-4 px-3 pb-8 pt-4 sm:px-5 lg:px-7">
      <div className="border-b border-border/70 pb-4">
        <Heading>
          Access Control
        </Heading>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Manage employee accounts and permissions</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        <div className="rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-sm"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Total users</p><p className="mt-1 text-base font-black tabular-nums">{users.length}</p></div>
        <div className="rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-sm"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Active access</p><p className="mt-1 text-base font-black text-primary tabular-nums">{activeUsers}</p></div>
        <div className="col-span-2 rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-sm lg:col-span-1"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Inactive access</p><p className="mt-1 text-base font-black text-muted-foreground tabular-nums">{inactiveUsers}</p></div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-3 py-2 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
        <Search size={15} className="shrink-0 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }}
          placeholder="Search by name, email, role, branch, or location"
          className="w-full bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
          aria-label="Search users"
        />
        {searchQuery && <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">Clear</button>}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Identity</th>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">System Role</th>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Branch</th>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedUsers?.map((user: any) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                  {/* Identity Column */}
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-tight">
                      <Shield size={12} className="opacity-70" />
                      {user.role}
                    </div>
                  </td>

                  {/* Branch Column */}
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        disabled={isUpdating === user.id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer disabled:opacity-50 ${user.status ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-card shadow-sm transition duration-200 ease-in-out ${user.status ? 'translate-x-4.5' : 'translate-x-1'}`}>
                          {isUpdating === user.id && <Loader2 size={8} className="animate-spin text-muted-foreground" />}
                        </span>
                      </button>

                      {/* Label Badge */}
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${user.status
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                        {user.status ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {user.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <ActionMenu userId={user.id} currentRole={user.role} email={user.email} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="py-14 flex flex-col items-center justify-center text-muted-foreground/30">
              <UserIcon size={48} strokeWidth={1} className="mb-4 opacity-50" />
              <p className="text-sm font-bold uppercase tracking-widest">{normalizedQuery ? 'No users match your search' : 'No users found in records'}</p>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-card border border-border rounded-lg disabled:opacity-50 hover:bg-muted/80 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-card border border-border rounded-lg disabled:opacity-50 hover:bg-muted/80 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserListPage;
