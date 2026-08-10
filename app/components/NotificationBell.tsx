// app/components/NotificationBell.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Building2, TrendingUp, CheckCheck, X } from "lucide-react";

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
      // silently fail — bell stays empty
    } finally {
      setLoading(false);
    }
  };

  // Poll every 2 minutes while mounted
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
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

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) fetchNotifications();
  };

  const typeIcon = (type: Notification["type"]) => {
    if (type === "INVESTMENT_MATURITY")
      return <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />;
    return <Building2 className="w-4 h-4 text-red-500 shrink-0" />;
  };

  const typeBadgeClass = (type: Notification["type"]) =>
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
        className="relative text-[#0f5132] dark:text-[#4ade80] hover:text-green-800 dark:hover:text-green-400 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[380px] max-h-[520px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl shadow-black/10 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-bold px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-semibold text-[#0f5132] dark:text-[#4ade80] hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
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
                <p className="text-sm font-semibold text-gray-400">
                  All caught up
                </p>
              </div>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-3 transition-colors ${
                  !n.isRead
                    ? "bg-green-50/60 dark:bg-green-900/10"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                {/* Icon */}
                <div
                  className={`mt-0.5 p-1.5 rounded-lg border ${typeBadgeClass(n.type)}`}
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

                {/* Unread dot / mark-read */}
                {!n.isRead && (
                  <button
                    onClick={() => markOneRead(n.id)}
                    title="Mark as read"
                    className="mt-1 w-2 h-2 rounded-full bg-[#0f5132] dark:bg-[#4ade80] shrink-0 hover:opacity-60 transition-opacity"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}