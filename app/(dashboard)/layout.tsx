"use client"

import Sidebar from "@/components/layout/sidebar"
import Topbar from "@/components/layout/topbar"
import MobileBottomNav from "@/components/layout/mobile-bottom-nav"
import { usePathname } from "next/navigation"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"

type User = {
  name: string
  role: string
  email: string
}

type Props = {
  children: ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

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

  useEffect(() => {
    const restrictedForLeader = ["/ministeries", "/offerings", "/settings"]

    if (
      user?.role?.toLowerCase() === "lider" &&
      restrictedForLeader.some((path) => pathname.startsWith(path))
    ) {
      window.location.href = "/dashboard"
    }
  }, [pathname, user])

  if (loading) return <div>Cargando...</div>

  return (
    <div className="flex h-screen">

      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">

        <Topbar user={user} />

        <main className="p-6 bg-gray-50 flex-1 overflow-y-auto">
          {children}
        </main>

        <MobileBottomNav user={user} />

      </div>

    </div>
  )
}
