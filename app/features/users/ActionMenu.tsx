"use client";

import { Role } from '@/app/types/role';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteUser, updateUserRole } from './action';

export const ActionMenu = ({ userId, currentRole, email }: { userId: string; currentRole: Role; email: string }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleRoleChange = async (role: Role) => {
    if (role === currentRole) return;
    setLoadingAction('role');
    try {
      await updateUserRole(userId, role);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Role updated to ${role}`);
    } catch {
      toast.error('Failed to update role');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetPassword = async () => {
    setLoadingAction('reset');
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (data && !error) {
        toast.success('Password reset email sent');
      } else {
        toast.error('Failed to send reset email');
      }
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteUser = async () => {
    setLoadingAction('delete');
    try {
      await deleteUser(userId);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-card hover:shadow-sm border border-transparent hover:border-border rounded-xl transition-all">
          {loadingAction ? <Loader2 size={18} className="animate-spin" /> : <MoreVertical size={18} />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {/* Update Role submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="font-semibold text-sm">
            Update Role
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            {Object.values(Role).map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={() => handleRoleChange(role)}
                className="flex items-center justify-between text-xs font-bold uppercase tracking-tight"
              >
                {role.replace('_', ' ')}
                {role === currentRole && <Check size={12} className="text-green-500" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Reset Password */}
        <DropdownMenuItem
          onClick={handleResetPassword}
          disabled={loadingAction === 'reset'}
          className="font-semibold text-sm"
        >
          {loadingAction === 'reset' && <Loader2 size={12} className="animate-spin mr-2" />}
          Reset Password
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Delete User */}
        <DropdownMenuItem
          onClick={handleDeleteUser}
          disabled={loadingAction === 'delete'}
          className="font-semibold text-sm text-destructive focus:text-destructive"
        >
          {loadingAction === 'delete' && <Loader2 size={12} className="animate-spin mr-2" />}
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};