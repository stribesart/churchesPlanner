"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersCreatedChart } from "@/components/dashboard/users-created-chart"

type User = {
  _id: string
  name?: string
  displayName?: string
  email?: string
  role?: string
  createdAt?: string
}

type Church = {
  churchName?: string
}

type Event = {
  _id: string
  date?: string
}

type Announcement = {
  _id: string
}

type DashboardState = {
  user: User | null
  church: Church | null
  users: User[]
  events: Event[]
  announcements: Announcement[]
}

function formatRole(role?: string) {
  if (!role) return "Miembro"

  return role.charAt(0).toUpperCase() + role.slice(1)
}

function isAdminDashboardRole(role?: string) {
  if (!role) return false

  const normalizedRole = role
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  return ["administrador", "admin", "pastor"].includes(normalizedRole)
}

function isUpcomingEvent(event: Event) {
  if (!event.date) return false

  const eventDate = new Date(`${event.date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return eventDate >= today
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardState>({
    user: null,
    church: null,
    users: [],
    events: [],
    announcements: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function fetchDashboardData() {
      try {
        const [meRes, usersRes, eventsRes, announcementsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/users"),
          fetch("/api/events"),
          fetch("/api/announcements"),
        ])

        const meData = meRes.ok ? await meRes.json() : null
        const usersData = usersRes.ok ? await usersRes.json() : []
        const eventsData = eventsRes.ok ? await eventsRes.json() : []
        const announcementsData = announcementsRes.ok
          ? await announcementsRes.json()
          : []

        if (ignore) {
          return
        }

        setData({
          user: meData?.user || null,
          church: meData?.church || null,
          users: Array.isArray(usersData) ? usersData : [],
          events: Array.isArray(eventsData) ? eventsData : [],
          announcements: Array.isArray(announcementsData)
            ? announcementsData
            : [],
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      ignore = true
    }
  }, [])

  const upcomingEvents = useMemo(
    () => data.events.filter(isUpcomingEvent).length,
    [data.events]
  )
  const churchName = data.church?.churchName || "Tu iglesia"
  const userName =
    data.user?.displayName || data.user?.name || data.user?.email || "usuario"
  const role = formatRole(data.user?.role)
  const canSeeAnalytics = isAdminDashboardRole(data.user?.role)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="@container/main space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {churchName}
        </h1>
        <p className="text-muted-foreground">
          Bienvenido, {userName}. Este es el resumen actual de tu comunidad.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs md:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Usuarios registrados</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {data.users.length}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Users />
                Total
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Comunidad visible <Users className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Usuarios disponibles para tu rol actual.
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Próximos eventos</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {upcomingEvents}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <CalendarDays />
                Agenda
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Eventos activos <CalendarDays className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Actividades con fecha de hoy en adelante.
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Anuncios</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {data.announcements.length}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Megaphone />
                Publicados
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Comunicación vigente <Megaphone className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Anuncios disponibles para la iglesia.
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Acceso actual</CardDescription>
            <CardTitle className="text-2xl font-semibold @[250px]/card:text-3xl">
              {role}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <ShieldCheck />
                Rol
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Sesión activa <ShieldCheck className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Permisos aplicados a tu navegación.
            </div>
          </CardFooter>
        </Card>
      </section>

      {canSeeAnalytics ? (
        <Tabs defaultValue="users" className="gap-4">
          <TabsList>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UsersCreatedChart users={data.users} />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  )
}
