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
    <div className="p-6">
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
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100 text-left text-sm uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">NIC</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No clients found
                </td>
              </tr>
            )}

            {clients.map((client) => (
              <tr
                key={client.id}
                className="hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3 font-medium">
                  {client.fullName}
                </td>
                <td className="px-4 py-3">
                  {client.email || '-'}
                </td>
                <td className="px-4 py-3">
                  {client.phoneMobile || '-'}
                </td>
                <td className="px-4 py-3">
                  {client.nic || '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-semibold
                      ${
                        client.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                  >
                    {client.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Link
                    href={`/features/clients/${client.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
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
