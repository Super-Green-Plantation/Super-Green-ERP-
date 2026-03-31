"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { getClientRegistrationByBranch } from "./actions";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type ChartData = Awaited<ReturnType<typeof getClientRegistrationByBranch>>;

// 10+ distinct colors for branches
const BRANCH_COLORS = [
  "#378ADD", "#1D9E75", "#D85A30", "#7F77DD", "#BA7517",
  "#D4537E", "#639922", "#E24B4A", "#0F6E56", "#533AB7",
  "#888780", "#F09595",
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface Props {
  initialData: ChartData;
}

export function ClientRegistrationChart({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [isPending, startTransition] = useTransition();

  const navigate = (dir: -1 | 1) => {
    let m = data.month + dir;
    let y = data.year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    startTransition(async () => {
      const next = await getClientRegistrationByBranch(y, m);
      setData(next);
    });
  };

  // Build labels and datasets
  const labels = view === "daily"
    ? data.days.map((d) => new Date(d + "T00:00:00").getDate().toString())
    : (() => {
        const weeks: string[] = [];
        data.days.forEach((_, i) => {
          const w = Math.floor(i / 7) + 1;
          if (!weeks.includes(`W${w}`)) weeks.push(`W${w}`);
        });
        return weeks;
      })();

  const datasets = data.branches.map((branch, i) => ({
    label: branch.branchName,
    data: view === "daily"
      ? branch.daily
      : (() => {
          const weeks: number[] = [];
          branch.daily.forEach((v, i) => {
            const w = Math.floor(i / 7);
            weeks[w] = (weeks[w] || 0) + v;
          });
          return weeks;
        })(),
    backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length],
    borderRadius: 2,
    borderSkipped: false,
  }));

  const isCurrentMonth =
    data.month === new Date().getMonth() &&
    data.year === new Date().getFullYear();

  return (
    <div className="flex flex-col gap-3 ">
      {/* Header */}
      <div className="sm:flex items-center justify-between">
        <div className="flex items-center gap-1 ">
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-foreground/70 min-w-[90px] text-center">
            {MONTH_NAMES[data.month]} {data.year}
          </span>
          <button
            onClick={() => navigate(1)}
            disabled={isCurrentMonth}
            className="p-1 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Toggle */}
        <div className="my-3 flex justify-center items-center gap-1 bg-muted/40 rounded-lg p-0.5">
          {(["daily", "weekly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${
                view === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className={`relative h-48 transition-opacity ${isPending ? "opacity-40" : "opacity-100"}`}>
        <Bar
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                  title: (items) =>
                    view === "daily"
                      ? `${MONTH_NAMES[data.month]} ${items[0].label}`
                      : items[0].label,
                },
              },
            },
            scales: {
              x: {
                stacked: true,
                grid: { display: false },
                ticks: {
                  font: { size: 10 },
                  color: "#888",
                  autoSkip: true,
                  maxTicksLimit: view === "daily" ? 10 : 6,
                },
                border: { display: false },
              },
              y: {
                stacked: true,
                grid: { color: "rgba(128,128,128,0.08)" },
                ticks: {
                  font: { size: 10 },
                  color: "#888",
                  precision: 0,
                },
                border: { display: false },
              },
            },
          }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {data.branches.map((branch, i) => (
          <div key={branch.branchId} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-sm flex-shrink-0"
              style={{ background: BRANCH_COLORS[i % BRANCH_COLORS.length] }}
            />
            <span className="text-[10px] text-muted-foreground/70 truncate max-w-[80px]">
              {branch.branchName}
            </span>
            <span className="text-[10px] font-medium text-foreground/60">
              {branch.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}