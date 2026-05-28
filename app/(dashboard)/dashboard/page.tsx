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
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { OfferingsChart } from "@/components/dashboard/offerings-chart"
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
  name?: string
  description?: string
  date?: string
  startTime?: string
  location?: string
}

type Announcement = {
  _id: string
  title?: string
  content?: string
  authorName?: string
  createdAt?: string
}

type Offering = {
  _id: string
  amount: number
  currency?: string
  createdAt?: string
}

type DashboardState = {
  user: User | null
  church: Church | null
  users: User[]
  events: Event[]
  announcements: Announcement[]
  offerings: Offering[]
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

function formatDate(value?: string) {
  if (!value) return "Sin fecha"

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return "Sin fecha"

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatDateTime(value?: string) {
  if (!value) return "Sin fecha"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Sin fecha"

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardState>({
    user: null,
    church: null,
    users: [],
    events: [],
    announcements: [],
    offerings: [],
  })
  const [loading, setLoading] = useState(true)
  const [dashboardTab, setDashboardTab] = useState("administration")
  const [analyticsTab, setAnalyticsTab] = useState("users")

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
        const canFetchOfferings = isAdminDashboardRole(meData?.user?.role)
        const offeringsData = canFetchOfferings
          ? await fetch("/api/offerings").then((res) =>
              res.ok ? res.json() : { offerings: [] }
            )
          : { offerings: [] }

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
          offerings: Array.isArray(offeringsData.offerings)
            ? offeringsData.offerings
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
  const nextEvents = useMemo(() => {
    return data.events
      .filter(isUpcomingEvent)
      .sort((first, second) => {
        const firstDate = first.date ? new Date(`${first.date}T00:00:00`) : null
        const secondDate = second.date
          ? new Date(`${second.date}T00:00:00`)
          : null

        return (firstDate?.getTime() || 0) - (secondDate?.getTime() || 0)
      })
      .slice(0, 5)
  }, [data.events])
  const recentAnnouncements = useMemo(() => {
    return [...data.announcements]
      .sort((first, second) => {
        const firstDate = first.createdAt ? new Date(first.createdAt) : null
        const secondDate = second.createdAt ? new Date(second.createdAt) : null

        return (secondDate?.getTime() || 0) - (firstDate?.getTime() || 0)
      })
      .slice(0, 5)
  }, [data.announcements])
  const churchName = data.church?.churchName || "Tu iglesia"
  const userName =
    data.user?.displayName || data.user?.name || data.user?.email || "usuario"
  const role = formatRole(data.user?.role)
  const canSeeAnalytics = isAdminDashboardRole(data.user?.role)
  const activeDashboardTab =
    canSeeAnalytics && dashboardTab === "administration"
      ? "administration"
      : "community"

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-16" />
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {churchName}
        </h1>
        <p className="text-muted-foreground">
          Bienvenido, {userName}. Este es el resumen actual de tu comunidad.
        </p>
      </section>

      <Tabs
        value={activeDashboardTab}
        onValueChange={setDashboardTab}
        className="w-full gap-4"
      >
        <TabsList className="inline-grid w-full grid-flow-col auto-cols-fr sm:w-fit sm:auto-cols-auto">
          {canSeeAnalytics ? (
            <TabsTrigger value="administration">Administración</TabsTrigger>
          ) : null}
          <TabsTrigger value="community">Comunidad</TabsTrigger>
        </TabsList>

        {canSeeAnalytics ? (
          <TabsContent value="administration" className="space-y-6">
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

            <Tabs
              value={analyticsTab}
              onValueChange={setAnalyticsTab}
              className="w-full gap-4"
            >
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="users">Usuarios</TabsTrigger>
                <TabsTrigger value="offerings">Ofrendas</TabsTrigger>
              </TabsList>
              <TabsContent value="users">
                {activeDashboardTab === "administration" &&
                analyticsTab === "users" ? (
                  <UsersCreatedChart users={data.users} />
                ) : null}
              </TabsContent>
              <TabsContent value="offerings">
                {activeDashboardTab === "administration" &&
                analyticsTab === "offerings" ? (
                  <OfferingsChart offerings={data.offerings} />
                ) : null}
              </TabsContent>
            </Tabs>
          </TabsContent>
        ) : null}

        <TabsContent value="community">
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="size-5" />
                  Próximos eventos
                </CardTitle>
                <CardDescription>
                  Actividades programadas para la comunidad.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {nextEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay eventos próximos registrados.
                  </p>
                ) : (
                  nextEvents.map((event) => (
                    <div
                      key={event._id}
                      className="rounded-lg border bg-background px-3 py-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {event.name || "Evento"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {event.description || "Sin descripción"}
                          </p>
                        </div>
                        <Badge variant="outline" className="w-fit">
                          {formatDate(event.date)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {event.startTime ? `${event.startTime}` : "Hora por definir"}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="size-5" />
                  Anuncios recientes
                </CardTitle>
                <CardDescription>
                  Comunicados publicados para la iglesia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAnnouncements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay anuncios publicados todavía.
                  </p>
                ) : (
                  recentAnnouncements.map((announcement) => (
                    <div
                      key={announcement._id}
                      className="rounded-lg border bg-background px-3 py-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {announcement.title || "Anuncio"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {announcement.content || "Sin contenido"}
                          </p>
                        </div>
                        <Badge variant="outline" className="w-fit">
                          {formatDateTime(announcement.createdAt)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {announcement.authorName
                          ? `Publicado por ${announcement.authorName}`
                          : "Publicado para la comunidad"}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
