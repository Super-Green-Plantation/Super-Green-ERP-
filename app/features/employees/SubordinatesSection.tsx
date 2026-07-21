"use client";

import { useEffect, useState } from "react";
import { Users, Download, ChevronRight } from "lucide-react";
import { getSubordinatesTree } from "@/app/features/employees/actions";
import Link from "next/link";
import * as XLSX from "xlsx";

type Subordinate = {
    id: number;
    empNo: string;
    nameWithInitials: string | null;
    status: string;
    isActive: boolean;
    recruitedById: number | null;
    positionTitle: string | null;
    depth: number;
};

const STATUS_COLORS: Record<string, string> = {
    PERMANENT: "bg-green-100 text-green-700",
    PROBATION: "bg-yellow-100 text-yellow-700",
    MANAGEMENT: "bg-blue-100 text-blue-700",
    RESIGNED: "bg-red-100 text-red-600",
};

export default function SubordinatesSection({ memberId }: { memberId: number }) {
    const [rows, setRows] = useState<Subordinate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSubordinatesTree(memberId)
            .then((res) => setRows(res.subordinates))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [memberId]);

    const exportToExcel = () => {
        const data = rows.map((r) => ({
            Level: r.depth + 1,
            "Emp No": r.empNo,
            Name: r.nameWithInitials ?? "",
            Position: r.positionTitle ?? "",
            Status: r.status,
            Active: r.isActive ? "Yes" : "No",
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Subordinates");
        XLSX.writeFile(wb, `subordinates_${memberId}.xlsx`);
    };

    if (loading) {
        return (
            <div className="animate-pulse h-24 bg-card/30 rounded-[2rem] border border-border/40" />
        );
    }

    if (rows.length === 0) {
        return (
            <p className="text-xs text-muted-foreground mt-2">
                No subordinates found.
            </p>
        );
    }

    return (
        <section className="bg-card/30 backdrop-blur-sm rounded-[2rem] border border-border/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Managed Employees
                    <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                        {rows.length}
                    </span>
                </h3>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all"
                >
                    <Download className="w-3.5 h-3.5" />
                    Export
                </button>
            </div>

            {/* Tree Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40">
                            <th className="text-left px-6 py-3">Name</th>
                            <th className="text-left px-4 py-3">Emp No</th>
                            <th className="text-left px-4 py-3">Position</th>
                            <th className="text-left px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {rows.map((row) => (
                            <tr
                                key={row.id}
                                className="hover:bg-primary/5 transition-colors group"
                            >
                                {/* Name with depth indentation */}
                                <td className="px-6 py-3">
                                    <div
                                        className="flex items-center gap-1"
                                        style={{ paddingLeft: `${row.depth * 20}px` }}
                                    >
                                        {row.depth > 0 && (
                                            <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                        )}
                                        <Link
                                            href={`/features/branches/employees/${row.id}`}
                                            className="font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[180px]"
                                        >
                                            {row.nameWithInitials ?? "—"}
                                        </Link>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[row.status] ?? "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {row.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                                    {row.empNo}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {row.positionTitle ?? "—"}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {row.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}


//proposal form no and agreement same ************
//