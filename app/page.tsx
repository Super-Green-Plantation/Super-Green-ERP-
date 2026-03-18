'use client'
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        // Already logged in — redirect based on role
        if (data.dbUser?.role === "ADMIN") {
          router.replace("/features/dashboard");
        } else {
          router.replace("/features/dashboard");
        }
      } else {
        // Not logged in
        router.replace("/auth/signin");
      }
    };

    checkUser();
  }, [router]);

  return <div />;
}