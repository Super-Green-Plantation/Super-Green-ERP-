// app/components/NotificationBell.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Building2, TrendingUp, CheckCheck, X, Check, Trash2 } from "lucide-react";

interface Notification {
  id: number;
  type: "INVESTMENT_MATURITY" | "EMPLOYEE_DEACTIVATION";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id: number) => {
    await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const dismissOne = async (id: number) => {
    // Optimistic remove
    const n = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (n && !n.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await fetch("/api/notifications", { method: "DELETE" });
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setClearing(false);
    }
  };

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) fetchNotifications();
  };

  const typeIcon = (type: Notification["type"]) => {
    if (type === "INVESTMENT_MATURITY")
      return <TrendingUp className="w-4 h-4 text-amber-500" />;
    return <Building2 className="w-4 h-4 text-red-500" />;
  };

  const typeIconBg = (type: Notification["type"]) =>
    type === "INVESTMENT_MATURITY"
      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return "Just now";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center text-[#0f5132] dark:text-[#4ade80] hover:text-green-800 dark:hover:text-green-400 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full leading-none pointer-events-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[400px] max-h-[540px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl shadow-black/10 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg text-[#0f5132] dark:text-[#4ade80] hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  disabled={clearing}
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {clearing ? "Clearing…" : "Clear all"}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800">
            {loading && notifications.length === 0 && (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                Loading…
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Bell className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                <p className="text-sm font-semibold text-gray-400">All caught up</p>
              </div>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                className={`group flex gap-3 px-4 py-3 transition-colors ${
                  !n.isRead
                    ? "bg-green-50/60 dark:bg-green-900/10"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                {/* Type icon — fixed size, no stretch */}
                <div
                  className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border ${typeIconBg(n.type)}`}
                >
                  {typeIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-bold mb-0.5 ${
                      !n.isRead
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                    {n.body}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1 font-medium">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#0f5132] dark:bg-[#4ade80]" />
                  )}
                  <div className={`flex flex-col gap-1 ${!n.isRead ? "mt-1" : ""} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {!n.isRead && (
                      <button
                        onClick={() => markOneRead(n.id)}
                        title="Mark as read"
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-green-50 dark:bg-green-900/20 text-[#0f5132] dark:text-[#4ade80] hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => dismissOne(n.id)}
                      title="Dismiss"
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}