// app/hooks/useGreeting.ts
"use client";

import { useEffect, useState } from "react";

type Period = "morning" | "afternoon" | "evening";

function getPeriod(): Period {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const GREETINGS: Record<Period, string> = {
  morning:   "Good morning",
  afternoon: "Good afternoon",
  evening:   "Good evening",
};

const SUBTITLES: Record<Period, string> = {
  morning:   "here's what's happening today.",
  afternoon: "here's your afternoon overview.",
  evening:   "here's how the day wrapped up.",
};

export function useGreeting() {
  // Start with null so SSR and client first-render match (avoids hydration mismatch)
  const [period, setPeriod] = useState<Period | null>(null);

  useEffect(() => {
    setPeriod(getPeriod());

    // Recheck every minute so the greeting updates if the user leaves the tab open
    const id = setInterval(() => setPeriod(getPeriod()), 60_000);
    return () => clearInterval(id);
  }, []);

  return {
    greeting: period ? GREETINGS[period] : "Good morning", // fallback for SSR
    subtitle: period ? SUBTITLES[period] : "here's what's happening today.",
  };
}