"use client";

// app/features/layout.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/SideBar/Sidebar";
import Providers from "../providers";
import Toast from "../Toast";
import { createClient } from "@/lib/supabase/client";
import { useNavigationLoading } from "../hooks/useNavigationLoading";
import Loading from "../components/Status/Loading";
import { TopBar } from "../components/TopBar";

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { loading: navigating, startLoading } = useNavigationLoading();

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin");
        return;
      }

      const res = await fetch("/api/me");
      const data = await res.json();

      setRole(data.role);
      setUserName(data.dbUser?.name ?? "");
      setLoading(false);
    };

    loadUser();
  }, [router]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, []);

  return (
    <>
      {/* Sidebar overlay on mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <Sidebar
        role={role}
        loading={loading}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onNavigate={startLoading}
      />

      {/* App-wide top bar */}
      <TopBar
        role={role}
        userName={userName}
        isCollapsed={isCollapsed}
        onMenuClick={() => setIsCollapsed(false)}
      />

      <main
        className={`
          min-h-screen
          pt-14
          sm:pt-14
          p-4
          transition-all duration-300
          ${isCollapsed ? "md:ml-20" : "md:ml-60"}
        `}
      >
        <Providers>
          <Toast>{children}</Toast>
        </Providers>
      </main>

      {navigating && <Loading />}
    </>
  );
}