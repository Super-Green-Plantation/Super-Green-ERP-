"use client"

import { LogOut } from "lucide-react"
import { logout } from "../auth/logout/action"

export default function LogoutButton({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="p-4 border-t border-gray-800 bg-gray-900/50">
      <form action={logout}>
        <button
          type="submit"
          title={isCollapsed ? "Logout" : ""}
          className="
            flex items-center gap-4
            px-4 py-3 rounded-xl
            text-sm font-bold
            text-gray-400
            hover:bg-red-500/10 hover:text-red-500
            transition-all group
            w-full text-left
          "
        >
          <div className="shrink-0">
            <LogOut
              size={22}
              className="group-hover:rotate-12 transition-transform"
            />
          </div>
          {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
        </button>
      </form>
    </div>
  )
}