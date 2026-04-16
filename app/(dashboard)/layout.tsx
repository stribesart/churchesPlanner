"use client"

import Sidebar from "@/components/layout/sidebar"
import Topbar from "@/components/layout/topbar"

import { useEffect, useState } from "react"

export default function DashboardLayout({ children }: any) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me")
      const data = await res.json()
      setUser(data.user)
    }

    fetchUser()
  }, [])

  return (
    <div className="flex">

      <Sidebar user={user} />

      <div className="flex-1 flex flex-col">

        <Topbar />

        <main className="p-6 bg-gray-50 min-h-screen">
          {children}
        </main>

      </div>

    </div>
  )
}