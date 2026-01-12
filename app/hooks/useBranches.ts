'use client'
import { useEffect, useState } from "react";

export const useBranches = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBranches() {
      try {
        setLoading(true)
        const res = await fetch("/api/src/modules/branches");
        const data = await res.json();
        setBranches(data.res);
        setLoading(false);
      } catch {
        setError("Failed to fetch branches");
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, []);

  return { branches, loading, error };
};
