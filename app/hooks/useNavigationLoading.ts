"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useNavigationLoading() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  const startLoading = () => setLoading(true);

  useEffect(() => {
    if (pathname !== prevPathname) {
      setLoading(false);
      setPrevPathname(pathname);
    }
  }, [pathname]);

  return { loading, startLoading };
}