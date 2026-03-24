import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function useNavigationLoading() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  const startLoading = () => {
    // Small delay ensures loader is visible
    setTimeout(() => setLoading(true), 50);
  };

  useEffect(() => {
    if (pathname !== prevPathname) {
      // Keep loader visible briefly for UX
      setTimeout(() => {
        setLoading(false);
        setPrevPathname(pathname);
      }, 200);
    }
  }, [pathname, prevPathname]);

  return { loading, startLoading };
}