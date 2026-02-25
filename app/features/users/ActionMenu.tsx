"use client";

import { useState, useRef, useEffect, use } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Loader2, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { sendPasswordReset, updateUserRole } from './action';
import { Role } from '@/app/types/role';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

// const ROLES = ['ADMIN', 'HR', 'IT_DEV', 'IT_US', 'BRANCH_MANAGER', 'EMPLOYEE'] as const;
// type Role = typeof ROLES[number];

export const ActionMenu = ({ userId, currentRole, email }: { userId: string; currentRole: Role; email: string }) => {
    const [open, setOpen] = useState(false);
    const [showRoles, setShowRoles] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const queryClient = useQueryClient();
    useEffect(() => {
        if (open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + window.scrollY + 4,
                left: rect.right + window.scrollX - 160,
            });
        }
    }, [open]);

    useEffect(() => {
        if (!open) {
            setShowRoles(false);
            return;
        }
        const handler = (e: MouseEvent) => {
            if (
                !buttonRef.current?.contains(e.target as Node) &&
                !menuRef.current?.contains(e.target as Node)  // ← add this
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleRoleChange = async (role: Role) => {
        if (role === currentRole) {
            setOpen(false);
            return;
        }
        setLoadingAction('role');
        try {
            await updateUserRole(userId, role); // your API call
            queryClient.invalidateQueries({ queryKey: ['users'] }); // invalidate users list to refresh data
            toast.success(`Role updated to ${role}`);
        } catch {
            toast.error('Failed to update role');
        } finally {
            setLoadingAction(null);
            setOpen(false);
        }
    };

    const handleResetPassword = async () => {
        setLoadingAction('reset');
        try {
            const supabase = await createClient()
            const { data, error } = await supabase.auth.resetPasswordForEmail(email);

            if (data && !error) {
                toast.success('Password reset email sent');
            } else {
                toast.error('Failed to send reset email');
            }
        } catch (error) {
            toast.error('Failed to send reset email');
        } finally {
            setLoadingAction(null);
            setOpen(false);
        }
    };

    const menu = open ? (
        <div
            ref={menuRef}   // ← add this
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed w-48 bg-white shadow-xl rounded-xl border border-slate-200 z-9999 overflow-hidden"
        >
            {/* Update Role — expands inline */}
            <button
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                onClick={() => setShowRoles((v) => !v)}
                disabled={loadingAction === 'role'}
            >
                <span className="flex items-center gap-2">
                    {loadingAction === 'role' && <Loader2 size={12} className="animate-spin" />}
                    Update Role
                </span>
                <ChevronRight
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${showRoles ? 'rotate-90' : ''}`}
                />
            </button>

            {/* Inline role list */}
            {showRoles && (
                <div className="border-t border-slate-100 bg-slate-50">
                    {Object.values(Role).map((role) => (
                        <button
                            key={role}
                            onClick={() => handleRoleChange(role)}
                            className="w-full text-left px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-between uppercase tracking-tight"
                        >
                            {role.replace('_', ' ')}
                            {role === currentRole && <Check size={12} className="text-emerald-500" />}
                        </button>
                    ))}
                </div>
            )}

            <div className="border-t border-slate-100" />

            {/* Reset Password */}
            <button
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                onClick={handleResetPassword}
                disabled={loadingAction === 'reset'}
            >
                {loadingAction === 'reset' && <Loader2 size={12} className="animate-spin" />}
                {loadingAction === 'reset' ? 'Sending...' : 'Reset Password'}
            </button>
        </div>
    ) : null;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setOpen((v) => !v)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all"
            >
                <MoreVertical size={18} />
            </button>
            {typeof window !== 'undefined' && createPortal(menu, document.body)}
        </>
    );
};