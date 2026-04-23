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

        // TODO: Obtener datos del dashboard desde la API
        // Por ahora usando datos de ejemplo
        const data = {
          totalMembers: 120,
          newMembers: 5,
          totalLeaders: 8,
          events: [
            { id: 1, title: "Servicio Dominical", date: "Domingo 10:00 AM" },
          ],
          activities: [
            { id: 1, description: "Nuevo miembro registrado" },
          ],
          groupMembers: 20,
          attendance: 85,
          groupName: "Jóvenes"
        };
        setData({
          totalMembers: 120,
          newMembers: 5,
          totalLeaders: 8,
          events: [
            { id: 1, title: "Servicio Dominical", date: "Domingo 10:00 AM" },
          ],
          activities: [
            { id: 1, description: "Nuevo miembro registrado" },
          ],
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
    return <div className="p-6">Cargando...</div>
  }

  return (
    <Dashboard
      role={user?.role || "miembro"}
      data={data}
    />
  )
}