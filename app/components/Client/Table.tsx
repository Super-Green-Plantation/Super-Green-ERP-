import { ExternalLink, User } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Table = (data: any) => {

    return (
        <div className="w-full overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/30 border-b border-border">
                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Proposal Form No.
                            </th>
                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Name
                            </th>
                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Contact Info
                            </th>
                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                NIC
                            </th>
                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data?.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground/30">
                                            <User size={20} />
                                        </div>
                                        <span className="text-sm font-bold text-muted-foreground italic">
                                            No clients found in the ledger
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.data.map((client: any, index: number) => (
                                <tr
                                    key={index}
                                    className="hover:bg-muted/20 transition-colors group"
                                >
                                    {/* ID Column */}
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-muted-foreground">
                                            {client.proposalFormNo || "#" + client?.id}
                                        </span>
                                    </td>

                                    {/* Name Column */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">

                                            <span className="text-sm font-bold text-foreground leading-tight">
                                                {client.fullName}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Contact Info Column */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="text-[11px] text-muted-foreground font-medium ml-4">
                                                <span className="text-[10px] text-muted-foreground/30">
                                                </span>
                                                {client.phoneMobile || "No Phone"}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground font-medium ml-4">
                                                {client.email || "No Email"}
                                            </div>
                                        </div>
                                    </td>

                                    {/* NIC Column */}
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted text-muted-foreground rounded font-bold text-[11px] uppercase">
                                            {client.nic || "Pending"}
                                        </div>
                                    </td>

                                 

                                    {/* Action Column */}
                                    <td className="px-6 py-4 text-center">
                                        <Link
                                            href={`/features/clients/${client.id}`}
                                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary bg-transparent hover:bg-card hover:shadow-sm border border-transparent hover:border-border transition-all rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-tighter"
                                        >
                                            Profile
                                            <ExternalLink size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Table