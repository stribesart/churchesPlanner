"use client"

import Sidebar from "@/components/layout/sidebar"
import Topbar from "@/components/layout/topbar"

import { useEffect, useState } from "react"

export default function DashboardLayout({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()

        if (!data.user) {
          window.location.href = "/login"
          return
        }

        setUser(data.user)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (loading) return <div>Cargando...</div>

  return (
    <div className="flex h-screen">

      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">

        <Topbar user={user} />

        <main className="p-6 bg-gray-50 flex-1 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  )
}