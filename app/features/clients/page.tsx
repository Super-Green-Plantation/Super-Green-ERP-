'use client'

import { getClients } from '@/app/services/clients.service'
import { Client } from '@/app/types/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const Page = () => {
  const [clients, setClients] = useState<Client[]>([])

  const loadClients = async () => {
    const data = await getClients()
    setClients(data.clients)
  }

  useEffect(() => {
    loadClients()
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link
          href="/features/clients/createClient"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Add Client
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
  <table className="w-full min-w-full text-left text-sm">
    <thead className="border-b border-gray-100 bg-gray-50">
      <tr className="text-gray-600 uppercase text-xs tracking-wider">
        <th className="px-6 py-4 font-semibold text-gray-600">ID</th>
        <th className="px-6 py-4 font-semibold text-gray-600">Name</th>
        <th className="px-6 py-4 font-semibold text-gray-600">Contact Info</th>
        <th className="px-6 py-4 font-semibold text-gray-600">NIC</th>
        <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
        <th className="px-6 py-4 font-semibold text-gray-600 text-center">Action</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100 bg-white">
      {clients.length === 0 && (
        <tr>
          <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
            No clients found
          </td>
        </tr>
      )}

      {clients.map((client) => (
        <tr
          key={client.id}
          className="transition-colors hover:bg-gray-50"
        >
          {/* ID Column */}
          <td className="px-6 py-4 font-medium text-gray-400">
            #{client.id.toString().slice(-4)}
          </td>

          {/* Name Column */}
          <td className="px-6 py-4">
            <span className="font-semibold text-gray-900">
              {client.fullName}
            </span>
          </td>

          {/* Contact Info Column */}
          <td className="px-6 py-4">
            <div className="flex flex-col gap-1">
              <span className="text-gray-700 font-medium">{client.phoneMobile || '-'}</span>
              <span className="text-xs text-gray-400">{client.email || '-'}</span>
            </div>
          </td>

          {/* NIC Column */}
          <td className="px-6 py-4 text-gray-500">
            {client.nic || '-'}
          </td>

          {/* Status Column */}
          <td className="px-6 py-4">
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                client.status === 'Active'
                  ? 'bg-green-50 text-green-700 ring-green-600/20'
                  : 'bg-red-50 text-red-700 ring-red-600/20'
              }`}
            >
              {client.status}
            </span>
          </td>

          {/* Action Column */}
          <td className="px-6 py-4 text-center">
            <Link
              href={`/features/clients/${client.id}`}
              className="inline-flex items-center gap-1 cursor-pointer text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors rounded-md px-3 py-1.5 text-xs font-bold"
            >
              View Profile
            </Link>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>
  )
}

export default Page
