"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/SideBar/Sidebar";
import Providers from "../providers";
import Toast from "../Toast";
import { createClient } from "@/lib/supabase/client"; // Browser client

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient(); 
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/signin"); // Client-side redirect
      }
    });
  }, [router]);

  return (
    <>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

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