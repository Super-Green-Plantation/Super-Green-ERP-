'use client'
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  router.push("/features/dashboard");
  return (
    <div>
      Welcome to Super Green ERP!
      
    </div>
  );
}
