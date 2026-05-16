"use client"

import { useEffect, useState } from "react"
import Dashboard from "@/components/dashboard/Dashboard"

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState({
    totalMembers: 0,
    newMembers: 0,
    totalLeaders: 0,
    groupMembers: 0,
    attendance: 0,
    events: [],
    activities: [],
    announcements: [],
    groupName: "",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener datos del usuario actual
        const userRes = await fetch("/api/auth/me")
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }

        // Obtener anuncios
        const announcementsRes = await fetch("/api/announcements")
        const announcements = announcementsRes.ok ? await announcementsRes.json() : []

        // TODO: Obtener datos del dashboard desde la API
        // Por ahora usando datos de ejemplo
        setData({
          totalMembers: 120,
          newMembers: 5,
          totalLeaders: 8,
          events: [
            { id: 1, title: "Servicio Dominical", date: "Domingo 10:00 AM" },
            { id: 2, title: "Reunión de Jóvenes", date: "Sábado 7:00 PM" },
          ],
          activities: [
            { id: 1, description: "Nuevo miembro registrado" },
          ],
          announcements,
          groupMembers: 20,
          attendance: 85,
          groupName: "Jóvenes"
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-20">
          <div className="w-full rounded-3xl border bg-white p-8 shadow-xl sm:p-10">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 animate-pulse rounded-full bg-blue-100" />
              <div className="space-y-3">
                <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-44 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dashboard
      role={user?.role || "miembro"}
      data={data}
    />
  )
}
