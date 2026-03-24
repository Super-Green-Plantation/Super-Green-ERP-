import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function useNavigationLoading() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [isPending, startTransition] = useTransition();

  const startLoading = () => {
    startTransition(() => {
      setLoading(true);
    });
  };

  useEffect(() => {
    if (pathname !== prevPathname) {
      setLoading(false);
      setPrevPathname(pathname);
    }
  }, [pathname, prevPathname]);

  return { loading: loading || isPending, startLoading };
}