"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/SideBar/Sidebar";
import Providers from "../providers";
import Toast from "../Toast";
import { createClient } from "@/lib/supabase/client";

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin");
        return;
      }

      const res = await fetch("/api/me");
      const data = await res.json();

      setRole(data.role);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  return (
    <>
      <Sidebar
        role={role}
        loading={loading}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <main
        className={`
          min-h-screen sm:pt-10 pt-8 p-4
          transition-all duration-300
          ml-20 ${isCollapsed ? "md:ml-20" : "md:ml-60"}
        `}
      >
        <Providers>
          <Toast>{children}</Toast>
        </Providers>
      </main>
    </>
  );
}