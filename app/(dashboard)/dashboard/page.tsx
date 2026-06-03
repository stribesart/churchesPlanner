"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  CalendarDays,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SubmittingOverlay } from "@/components/ui/submitting-overlay"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { OfferingsChart } from "@/components/dashboard/offerings-chart"
import { EventRegistrationsChart } from "@/components/dashboard/event-registrations-chart"
import { UsersCreatedChart } from "@/components/dashboard/users-created-chart"

type User = {
  _id: string
  name?: string
  displayName?: string
  email?: string
  contact?: string
  phone?: string
  role?: string
  createdAt?: string
}

type Church = {
  churchName?: string
}

type PaymentMethod = "transfer" | "card"

type Event = {
  _id: string
  name?: string
  description?: string
  date?: string
  startTime?: string
  endTime?: string
  location?: string
  organizerName?: string
  requiresRegistration?: boolean
  isPaidEvent?: boolean
  expectedAttendees?: number | null
  paymentAmount?: number | null
  paymentMethod?: PaymentMethod | null
}

type Announcement = {
  _id: string
  title?: string
  content?: string
  date?: string
  authorName?: string
  createdAt?: string
  registry?: {
    name?: string
    email?: string
  } | null
}

type Offering = {
  _id: string
  amount: number
  currency?: string
  createdAt?: string
}

type PaymentStatus = "paid" | "pending" | "not_required"

type EventRegistration = {
  _id: string
  eventId: string
  name?: string
  email?: string
  contact?: string
  paymentRequired?: boolean
  paymentAmount?: number | null
  paymentMethod?: PaymentMethod | null
  paymentStatus?: PaymentStatus
  paymentPending?: boolean
}

type DashboardState = {
  user: User | null
  church: Church | null
  users: User[]
  events: Event[]
  announcements: Announcement[]
  offerings: Offering[]
  eventRegistrations: EventRegistration[]
  adminEventRegistrations: EventRegistration[]
}

type CommunityItemDetail = {
  id: string
  type: "event" | "announcement"
  title: string
  description: string
  dateLabel: string
  timeLabel?: string
  location?: string
  createdBy?: string
  requiresRegistration?: boolean
  isPaidEvent?: boolean
  paymentAmount?: number | null
  paymentMethod?: PaymentMethod | null
  registration?: EventRegistration | null
  registeredCount?: number
  paidRegistrationsCount?: number
  pendingPaymentRegistrationsCount?: number
  registry?: {
    name?: string
    email?: string
  } | null
}

type CommunityMessage = {
  tone: "success" | "warning"
  text: string
} | null

type RegistrationField = "name" | "email" | "contact"
type RegistrationFieldErrors = Partial<Record<RegistrationField, string>>
type PendingPaymentField = "quantity"
type PendingPaymentFieldErrors = Partial<Record<PendingPaymentField, string>>
type EventParticipationTone = "default" | "warning" | "danger" | "success"

type EventParticipationStatus = {
  tone: EventParticipationTone
  label: string
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

function formatMoney(amount?: number | null) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "$0.00 MXN"
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

function getEventDetail(
  event: Event,
  registrations: EventRegistration[],
  currentUserEmail?: string,
  currentUserName?: string
): CommunityItemDetail {
  const timeLabel =
    event.startTime && event.endTime
      ? `${event.startTime} - ${event.endTime}`
      : event.startTime || undefined
  const normalizedCurrentEmail = currentUserEmail?.trim().toLowerCase()
  const eventRegistrations = registrations.filter(
    (registration) => registration.eventId === event._id
  )
  const currentUserRegistration =
    eventRegistrations.find(
      (registration) =>
        normalizedCurrentEmail &&
        registration.email?.trim().toLowerCase() === normalizedCurrentEmail &&
        (!currentUserName ||
          registration.name?.trim().toLowerCase() ===
            currentUserName.trim().toLowerCase())
    ) || null
  const currentEmailRegistrations = normalizedCurrentEmail
    ? eventRegistrations.filter(
        (registration) =>
          registration.email?.trim().toLowerCase() === normalizedCurrentEmail
      )
    : []
  const paidRegistrationsCount = currentEmailRegistrations.filter(
    (registration) => registration.paymentStatus === "paid"
  ).length
  const pendingPaymentRegistrationsCount = currentEmailRegistrations.filter(
    (registration) =>
      registration.paymentStatus === "pending" ||
      registration.paymentPending === true
  ).length

  return {
    id: event._id,
    type: "event",
    title: event.name || "Evento",
    description: event.description || "Sin descripción",
    dateLabel: formatDate(event.date),
    timeLabel,
    location: event.location,
    createdBy: event.organizerName,
    requiresRegistration: event.requiresRegistration,
    isPaidEvent: event.isPaidEvent,
    paymentAmount: event.paymentAmount,
    paymentMethod: event.paymentMethod,
    registration: currentUserRegistration,
    registeredCount: eventRegistrations.length,
    paidRegistrationsCount,
    pendingPaymentRegistrationsCount,
  }
}

function getAnnouncementDetail(announcement: Announcement): CommunityItemDetail {
  return {
    id: announcement._id,
    type: "announcement",
    title: announcement.title || "Anuncio",
    description: announcement.content || "Sin contenido",
    dateLabel: announcement.date
      ? formatDate(announcement.date)
      : formatDateTime(announcement.createdAt),
    createdBy: announcement.authorName,
    registry: announcement.registry,
  }
}

function getUserRegistrationName(user?: User | null) {
  return user?.displayName || user?.name || ""
}

function getCommunityItemWithRegistrations(
  item: CommunityItemDetail | null,
  registrations: EventRegistration[],
  user?: User | null
) {
  if (!item || item.type !== "event") return item

  const normalizedCurrentEmail = user?.email?.trim().toLowerCase()
  const currentUserName = getUserRegistrationName(user)
  const eventRegistrations = registrations.filter(
    (registration) => registration.eventId === item.id
  )
  const currentUserRegistration =
    eventRegistrations.find(
      (registration) =>
        normalizedCurrentEmail &&
        registration.email?.trim().toLowerCase() === normalizedCurrentEmail &&
        (!currentUserName ||
          registration.name?.trim().toLowerCase() ===
            currentUserName.trim().toLowerCase())
    ) || null
  const currentEmailRegistrations = normalizedCurrentEmail
    ? eventRegistrations.filter(
        (registration) =>
          registration.email?.trim().toLowerCase() === normalizedCurrentEmail
      )
    : []
  const paidRegistrationsCount = currentEmailRegistrations.filter(
    (registration) => registration.paymentStatus === "paid"
  ).length
  const pendingPaymentRegistrationsCount = currentEmailRegistrations.filter(
    (registration) =>
      registration.paymentStatus === "pending" ||
      registration.paymentPending === true
  ).length

  return {
    ...item,
    registration: currentUserRegistration,
    registeredCount: eventRegistrations.length,
    paidRegistrationsCount,
    pendingPaymentRegistrationsCount,
  }
}

function getEventParticipationStatus(
  event: Event,
  registrations: EventRegistration[],
  user?: User | null
): EventParticipationStatus {
  if (!event.requiresRegistration && !event.isPaidEvent) {
    return { tone: "default", label: "Informativo" }
  }

  const userName = getUserRegistrationName(user)
  const normalizedEmail = user?.email?.trim().toLowerCase()
  const eventRegistrations = registrations.filter(
    (registration) =>
      registration.eventId === event._id &&
      normalizedEmail &&
      registration.email?.trim().toLowerCase() === normalizedEmail
  )
  const ownRegistration = eventRegistrations.find(
    (registration) =>
      !userName ||
      registration.name?.trim().toLowerCase() === userName.trim().toLowerCase()
  )
  const hasPendingPayment = eventRegistrations.some(
    (registration) =>
      registration.paymentStatus === "pending" ||
      registration.paymentPending === true
  )
  const hasPaidRegistration = eventRegistrations.some(
    (registration) => registration.paymentStatus === "paid"
  )

  if (event.isPaidEvent) {
    if (!ownRegistration && eventRegistrations.length === 0) {
      return { tone: "warning", label: "Registro y pago pendiente" }
    }

    if (hasPendingPayment) {
      return { tone: "danger", label: "Pago pendiente" }
    }

    if (hasPaidRegistration || ownRegistration?.paymentStatus === "paid") {
      return { tone: "success", label: "Pagado" }
    }

    return { tone: "warning", label: "Pago pendiente" }
  }

  if (!ownRegistration) {
    return { tone: "warning", label: "Registro pendiente" }
  }

  return { tone: "success", label: "Registrado" }
}

function getEventParticipationClasses(tone: EventParticipationTone) {
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 hover:bg-amber-100/70"
  }

  if (tone === "danger") {
    return "border-destructive/30 bg-destructive/10 hover:bg-destructive/15"
  }

  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70"
  }

  return "border bg-background hover:bg-muted/50"
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardState>({
    user: null,
    church: null,
    users: [],
    events: [],
    announcements: [],
    offerings: [],
    eventRegistrations: [],
    adminEventRegistrations: [],
  })
  const [loading, setLoading] = useState(true)
  const [dashboardTab, setDashboardTab] = useState("administration")
  const [analyticsTab, setAnalyticsTab] = useState("users")
  const [selectedCommunityItem, setSelectedCommunityItem] =
    useState<CommunityItemDetail | null>(null)
  const [communityMessage, setCommunityMessage] =
    useState<CommunityMessage>(null)

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
        const eventRegistrationsData = meRes.ok
          ? await fetch("/api/event-registrations").then((res) =>
              res.ok ? res.json() : { registrations: [] }
            )
          : { registrations: [] }
        const canFetchOfferings = isAdminDashboardRole(meData?.user?.role)
        const adminEventRegistrationsData = canFetchOfferings
          ? await fetch("/api/event-registrations?scope=all").then((res) =>
              res.ok ? res.json() : { registrations: [] }
            )
          : { registrations: [] }
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
          eventRegistrations: Array.isArray(eventRegistrationsData.registrations)
            ? eventRegistrationsData.registrations
            : [],
          adminEventRegistrations: Array.isArray(
            adminEventRegistrationsData.registrations
          )
            ? adminEventRegistrationsData.registrations
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

  async function refreshEventRegistrations() {
    const [res, adminRes] = await Promise.all([
      fetch("/api/event-registrations"),
      canSeeAnalytics
        ? fetch("/api/event-registrations?scope=all")
        : Promise.resolve(null),
    ])
    const responseData = res.ok ? await res.json() : { registrations: [] }
    const adminResponseData = adminRes?.ok
      ? await adminRes.json()
      : { registrations: [] }
    const registrations = Array.isArray(responseData.registrations)
      ? responseData.registrations
      : []
    const adminRegistrations = Array.isArray(adminResponseData.registrations)
      ? adminResponseData.registrations
      : []

    setData((currentData) => ({
      ...currentData,
      eventRegistrations: registrations,
      adminEventRegistrations: canSeeAnalytics
        ? adminRegistrations
        : currentData.adminEventRegistrations,
    }))
    setSelectedCommunityItem((currentItem) =>
      getCommunityItemWithRegistrations(currentItem, registrations, data.user)
    )

    return registrations
  }

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
                <TabsTrigger value="registrations">Registros</TabsTrigger>
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
              <TabsContent value="registrations">
                {activeDashboardTab === "administration" &&
                analyticsTab === "registrations" ? (
                  <EventRegistrationsChart
                    events={data.events}
                    registrations={data.adminEventRegistrations}
                    usersCount={data.users.length}
                  />
                ) : null}
              </TabsContent>
            </Tabs>
          </TabsContent>
        ) : null}

        <TabsContent value="community">
          {communityMessage ? (
            <div
              className={
                communityMessage.tone === "warning"
                  ? "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
                  : "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
              }
            >
              {communityMessage.text}
            </div>
          ) : null}

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
                  nextEvents.map((event) => {
                    const participationStatus = getEventParticipationStatus(
                      event,
                      data.eventRegistrations,
                      data.user
                    )

                    return (
                      <button
                        key={event._id}
                        type="button"
                        onClick={() =>
                          setSelectedCommunityItem(
                            getEventDetail(
                              event,
                              data.eventRegistrations,
                              data.user?.email,
                              userName
                            )
                          )
                        }
                        className={`w-full rounded-lg px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${getEventParticipationClasses(participationStatus.tone)}`}
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
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            {participationStatus.tone !== "default" ? (
                              <Badge variant="outline" className="w-fit">
                                {participationStatus.label}
                              </Badge>
                            ) : null}
                            <Badge variant="outline" className="w-fit">
                              {formatDate(event.date)}
                            </Badge>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {event.startTime ? `${event.startTime}` : "Hora por definir"}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </button>
                    )
                  })
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
                    <button
                      key={announcement._id}
                      type="button"
                      onClick={() =>
                        setSelectedCommunityItem(
                          getAnnouncementDetail(announcement)
                        )
                      }
                      className="w-full rounded-lg border bg-background px-3 py-3 text-left transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>

      <CommunityItemModal
        item={selectedCommunityItem}
        currentUser={data.user}
        onActionSuccess={setCommunityMessage}
        onRegistrationsRefresh={refreshEventRegistrations}
        open={Boolean(selectedCommunityItem)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedCommunityItem(null)
          }
        }}
      />
    </div>
  )
}

function CommunityItemModal({
  item,
  currentUser,
  onActionSuccess,
  onRegistrationsRefresh,
  open,
  onOpenChange,
}: {
  item: CommunityItemDetail | null
  currentUser: User | null
  onActionSuccess: (message: CommunityMessage) => void
  onRegistrationsRefresh: () => Promise<EventRegistration[]>
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const userName =
    currentUser?.displayName || currentUser?.name || ""
  const userEmail = currentUser?.email || ""
  const userContact = currentUser?.contact || currentUser?.phone || ""
  const [registrationName, setRegistrationName] = useState(userName)
  const [registrationEmail, setRegistrationEmail] = useState(userEmail)
  const [registrationContact, setRegistrationContact] = useState(userContact)
  const [registrationFieldErrors, setRegistrationFieldErrors] =
    useState<RegistrationFieldErrors>({})
  const [activePaymentMethod, setActivePaymentMethod] =
    useState<PaymentMethod>("transfer")
  const [registrationError, setRegistrationError] = useState("")
  const [registrationSubmitting, setRegistrationSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [pendingPaymentQuantity, setPendingPaymentQuantity] = useState("1")
  const [pendingPaymentFieldErrors, setPendingPaymentFieldErrors] =
    useState<PendingPaymentFieldErrors>({})
  const [pendingPaymentSubmitting, setPendingPaymentSubmitting] =
    useState(false)
  const [registeringAnotherPerson, setRegisteringAnotherPerson] =
    useState(false)
  const contentScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRegistrationName(item?.registration?.name || userName)
    setRegistrationEmail(item?.registration?.email || userEmail)
    setRegistrationContact(item?.registration?.contact || userContact)
    setRegistrationFieldErrors({})
    setActivePaymentMethod(
      item?.registration?.paymentMethod || item?.paymentMethod || "transfer"
    )
    setRegistrationError("")
    setPaymentError("")
    setPendingPaymentQuantity("1")
    setPendingPaymentFieldErrors({})
    setRegisteringAnotherPerson(false)
  }, [
    item?.id,
    item?.paymentMethod,
    item?.registration?.contact,
    item?.registration?.email,
    item?.registration?.name,
    item?.registration?.paymentMethod,
    userContact,
    userEmail,
    userName,
  ])

  useEffect(() => {
    if (!open) return

    requestAnimationFrame(() => {
      contentScrollRef.current?.scrollTo({ top: 0 })
    })
  }, [item?.id, open])

  if (!item) return null

  const isRegistered = item.type === "event" && Boolean(item.registration)
  const paymentIsPaid = item.registration?.paymentStatus === "paid"
  const paymentActionIsPaid = paymentIsPaid && !registeringAnotherPerson
  const pendingPaymentCount = item.pendingPaymentRegistrationsCount || 0
  const paidPaymentCount = item.paidRegistrationsCount || 0
  const parsedPendingPaymentQuantity = Number(pendingPaymentQuantity)
  const pendingPaymentTotal =
    item.paymentAmount && Number.isFinite(item.paymentAmount)
      ? item.paymentAmount * (Number.isFinite(parsedPendingPaymentQuantity)
        ? parsedPendingPaymentQuantity
        : 0)
      : 0
  const shouldDisableOwnRegistration =
    isRegistered && !registeringAnotherPerson
  const showRegisterAnotherAction =
    item.type === "event" &&
    item.requiresRegistration &&
    isRegistered &&
    !registeringAnotherPerson

  async function submitEventRegistration(markAsPaid: boolean) {
    if (!item || item.type !== "event") return

    const endpointLabel = markAsPaid ? "pago" : "registro"
    const setSubmitting = markAsPaid
      ? setPaymentSubmitting
      : setRegistrationSubmitting
    const setError = markAsPaid ? setPaymentError : setRegistrationError
    const trimmedName = registrationName.trim()
    const trimmedEmail = registrationEmail.trim().toLowerCase()
    const trimmedContact = registrationContact.trim()
    const nextFieldErrors: RegistrationFieldErrors = {}

    if (!trimmedName) {
      nextFieldErrors.name = "El nombre es obligatorio."
    }

    if (!trimmedEmail) {
      nextFieldErrors.email = "El correo es obligatorio."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextFieldErrors.email = "Ingresa un correo válido."
    }

    if (item.requiresRegistration && !trimmedContact) {
      nextFieldErrors.contact = "El contacto es obligatorio."
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setRegistrationFieldErrors(nextFieldErrors)
      return
    }

    setSubmitting(true)
    setError("")
    setRegistrationFieldErrors({})

    try {
      const res = await fetch("/api/event-registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: item.id,
          name: trimmedName,
          email: trimmedEmail,
          contact: trimmedContact,
          paymentMethod: activePaymentMethod,
          markAsPaid,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.message || `No se pudo guardar el ${endpointLabel}.`)
        return
      }

      const successMessage =
        data?.message || (markAsPaid ? "Pago registrado" : "Registro guardado")

      if (data?.paymentStatus === "pending" || !markAsPaid) {
        onActionSuccess({
          tone: data?.paymentStatus === "pending" ? "warning" : "success",
          text: successMessage,
        })
      } else {
        onActionSuccess(null)
      }
      await onRegistrationsRefresh()
      if (!markAsPaid) {
        onOpenChange(false)
      }
    } catch {
      setError(`No se pudo guardar el ${endpointLabel}.`)
    } finally {
      setSubmitting(false)
    }
  }

  async function submitPendingPayments() {
    if (!item || item.type !== "event") return

    const quantity = Number(pendingPaymentQuantity)
    const nextFieldErrors: PendingPaymentFieldErrors = {}

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > pendingPaymentCount
    ) {
      nextFieldErrors.quantity =
        "Selecciona una cantidad válida de personas pendientes."
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setPendingPaymentFieldErrors(nextFieldErrors)
      return
    }

    setPendingPaymentSubmitting(true)
    setPendingPaymentFieldErrors({})
    setPaymentError("")

    try {
      const res = await fetch("/api/event-registrations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: item.id,
          quantity,
          paymentMethod: activePaymentMethod,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setPaymentError(data?.message || "No se pudo registrar el pago.")
        return
      }

      onActionSuccess(null)
      await onRegistrationsRefresh()
      setPendingPaymentQuantity("1")
    } catch {
      setPaymentError("No se pudo registrar el pago.")
    } finally {
      setPendingPaymentSubmitting(false)
    }
  }

  function clearRegistrationFieldError(field: RegistrationField) {
    setRegistrationFieldErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]

      return nextErrors
    })
    setRegistrationError("")
    setPaymentError("")
  }

  function clearPendingPaymentFieldError(field: PendingPaymentField) {
    setPendingPaymentFieldErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]

      return nextErrors
    })
    setPaymentError("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative gap-0 overflow-hidden sm:max-w-lg">
        <SubmittingOverlay
          show={
            registrationSubmitting ||
            paymentSubmitting ||
            pendingPaymentSubmitting
          }
          label={
            paymentSubmitting || pendingPaymentSubmitting
              ? "Procesando pago..."
              : "Registrando..."
          }
        />
        <button
          type="button"
          className="sr-only"
          aria-label="Inicio del modal"
        />
        <DialogHeader className="pb-4 pr-8">
          <DialogTitle className="text-2xl leading-tight">
            {item.title}
          </DialogTitle>
          <DialogDescription>
            {item.type === "event"
              ? "Información completa del evento."
              : "Información completa del anuncio."}
          </DialogDescription>
        </DialogHeader>

        <div
          ref={contentScrollRef}
          className="-mx-4 max-h-[60vh] space-y-4 overflow-y-auto px-4 py-1 text-sm"
          aria-busy={
            registrationSubmitting ||
            paymentSubmitting ||
            pendingPaymentSubmitting
          }
        >
          <p className="whitespace-pre-wrap leading-6 text-foreground">
            {item.description}
          </p>

          <div className="grid gap-3 rounded-lg border bg-muted/30 p-3">
            <InfoRow label="Fecha" value={item.dateLabel} />
            {item.timeLabel ? (
              <InfoRow label="Hora" value={item.timeLabel} />
            ) : null}
            {item.location ? (
              <InfoRow label="Ubicación" value={item.location} />
            ) : null}
            {item.createdBy ? (
              <InfoRow
                label={item.type === "event" ? "Organiza" : "Creado por"}
                value={item.createdBy}
              />
            ) : null}
          </div>

          {item.type === "event" && isRegistered ? (
            <div
              className={
                pendingPaymentCount > 0
                  ? "grid gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950"
                  : "grid gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950"
              }
            >
              <p className="font-medium">Ya estás registrado al evento.</p>
              {pendingPaymentCount > 0 ? (
                <p>
                  Pago de {pendingPaymentCount}{" "}
                  {pendingPaymentCount === 1 ? "persona" : "personas"} pendiente.
                </p>
              ) : paidPaymentCount > 0 ? (
                <p>
                  Pago de {paidPaymentCount}{" "}
                  {paidPaymentCount === 1 ? "persona" : "personas"} completado.
                </p>
              ) : (
                <p>Registro confirmado.</p>
              )}
              {item.registeredCount && item.registeredCount > 1 ? (
                <p className="text-xs">
                  Has enviado {item.registeredCount} registros para este evento.
                </p>
              ) : null}
            </div>
          ) : null}

          {item.registry ? (
            <div className="grid gap-3 rounded-lg border bg-muted/30 p-3">
              <p className="font-medium">Registro</p>
              <InfoRow label="Nombre" value={item.registry.name || "-"} />
              <InfoRow label="Correo" value={item.registry.email || "-"} />
            </div>
          ) : null}

          {item.type === "event" && item.requiresRegistration ? (
            <div className="grid gap-3 rounded-lg border bg-muted/30 p-3">
              <p className="font-medium">Registro</p>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <label className="text-muted-foreground" htmlFor="event-registration-name">
                    Nombre
                  </label>
                  <Input
                    id="event-registration-name"
                    value={registrationName}
                    onChange={(event) => {
                      setRegistrationName(event.target.value)
                      clearRegistrationFieldError("name")
                    }}
                    aria-invalid={Boolean(registrationFieldErrors.name)}
                    placeholder="Nombre completo"
                    disabled={
                      registrationSubmitting ||
                      paymentSubmitting ||
                      pendingPaymentSubmitting ||
                      shouldDisableOwnRegistration
                    }
                  />
                  <FieldError>{registrationFieldErrors.name}</FieldError>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-muted-foreground" htmlFor="event-registration-email">
                    Correo
                  </label>
                  <Input
                    id="event-registration-email"
                    type="email"
                    value={registrationEmail}
                    aria-invalid={Boolean(registrationFieldErrors.email)}
                    placeholder="correo@ejemplo.com"
                    disabled
                  />
                  <FieldError>{registrationFieldErrors.email}</FieldError>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-muted-foreground" htmlFor="event-registration-contact">
                    Contacto
                  </label>
                  <Input
                    id="event-registration-contact"
                    value={registrationContact}
                    onChange={(event) => {
                      setRegistrationContact(event.target.value)
                      clearRegistrationFieldError("contact")
                    }}
                    aria-invalid={Boolean(registrationFieldErrors.contact)}
                    placeholder="Teléfono o WhatsApp"
                    disabled={
                      registrationSubmitting ||
                      paymentSubmitting ||
                      pendingPaymentSubmitting ||
                      shouldDisableOwnRegistration
                    }
                  />
                  <FieldError>{registrationFieldErrors.contact}</FieldError>
                </div>
                {registrationError ? (
                  <p className="text-sm text-destructive">{registrationError}</p>
                ) : null}
                <Button
                  type="button"
                  onClick={() => submitEventRegistration(false)}
                  disabled={
                    registrationSubmitting ||
                    paymentSubmitting ||
                    pendingPaymentSubmitting ||
                    shouldDisableOwnRegistration
                  }
                >
                  {registrationSubmitting ? (
                    <>
                      <LoadingSpinner />
                      Registrando...
                    </>
                  ) : (
                    "Registrar asistencia"
                  )}
                </Button>
                {showRegisterAnotherAction ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRegisteringAnotherPerson(true)
                      setRegistrationName("")
                      setRegistrationEmail(userEmail)
                      setRegistrationContact("")
                      setRegistrationFieldErrors({})
                      setRegistrationError("")
                    }}
                    disabled={
                      registrationSubmitting ||
                      paymentSubmitting ||
                      pendingPaymentSubmitting
                    }
                  >
                    Registrar a otra persona
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {item.type === "event" && item.isPaidEvent ? (
            <div className="grid gap-3 rounded-lg border bg-muted/30 p-3">
              <p className="font-medium">Pago del evento</p>
              <InfoRow label="Monto" value={formatMoney(item.paymentAmount)} />
              {pendingPaymentCount > 0 && !registeringAnotherPerson ? (
                <div className="grid gap-3 rounded-lg border bg-background p-3">
                  <p className="font-medium">Pagos pendientes</p>
                  <InfoRow
                    label="Pendientes"
                    value={`${pendingPaymentCount} ${
                      pendingPaymentCount === 1 ? "persona" : "personas"
                    }`}
                  />
                  <InfoRow
                    label="Monto pendiente"
                    value={formatMoney(
                      item.paymentAmount
                        ? item.paymentAmount * pendingPaymentCount
                        : 0
                    )}
                  />
                  <div className="grid gap-1.5">
                    <label
                      className="text-muted-foreground"
                      htmlFor="event-pending-payment-quantity"
                    >
                      ¿De cuántas personas quieres hacer el pago?
                    </label>
                    <Input
                      id="event-pending-payment-quantity"
                      type="number"
                      min="1"
                      max={pendingPaymentCount}
                      value={pendingPaymentQuantity}
                      onChange={(event) => {
                        setPendingPaymentQuantity(event.target.value)
                        clearPendingPaymentFieldError("quantity")
                      }}
                      aria-invalid={Boolean(
                        pendingPaymentFieldErrors.quantity
                      )}
                      disabled={
                        registrationSubmitting ||
                        paymentSubmitting ||
                        pendingPaymentSubmitting
                      }
                    />
                    <FieldError>
                      {pendingPaymentFieldErrors.quantity}
                    </FieldError>
                  </div>
                  <InfoRow
                    label="Total a pagar"
                    value={formatMoney(pendingPaymentTotal)}
                  />
                  <Button
                    type="button"
                    onClick={submitPendingPayments}
                    disabled={
                      registrationSubmitting ||
                      paymentSubmitting ||
                      pendingPaymentSubmitting
                    }
                  >
                    {pendingPaymentSubmitting ? (
                      <>
                        <LoadingSpinner />
                        Procesando...
                      </>
                    ) : (
                      "Realizar pago pendiente"
                    )}
                  </Button>
                </div>
              ) : null}
              {registeringAnotherPerson ? (
                <p className="text-sm text-muted-foreground">
                  Este pago se aplicará al registro de{" "}
                  <span className="font-medium text-foreground">
                    {registrationName.trim() || "la persona invitada"}
                  </span>
                  .
                </p>
              ) : null}

              <Tabs
                value={activePaymentMethod}
                onValueChange={(value) =>
                  setActivePaymentMethod(value as PaymentMethod)
                }
                className="gap-3"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transfer">Transferencia</TabsTrigger>
                  <TabsTrigger value="card">Tarjeta</TabsTrigger>
                </TabsList>

                <TabsContent value="transfer">
                  <div className="grid gap-3 rounded-lg border bg-background p-3">
                    <InfoRow label="Concepto" value={item.title} />
                    <InfoRow label="Banco" value="Por confirmar con administración" />
                    <InfoRow label="Titular" value="Por confirmar con administración" />
                    <InfoRow label="CLABE/Cuenta" value="Por confirmar con administración" />
                  </div>
                </TabsContent>

                <TabsContent value="card">
                  <div className="grid gap-3 rounded-lg border bg-background p-3">
                    <div className="grid gap-1.5">
                      <label className="text-muted-foreground" htmlFor="event-card-name">
                        Nombre en la tarjeta
                      </label>
                      <Input id="event-card-name" placeholder="Nombre completo" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-muted-foreground" htmlFor="event-card-number">
                        Número de tarjeta
                      </label>
                      <Input
                        id="event-card-number"
                        inputMode="numeric"
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="grid gap-1.5">
                        <label className="text-muted-foreground" htmlFor="event-card-expiry">
                          Fecha de vencimiento
                        </label>
                        <Input id="event-card-expiry" placeholder="MM/AA" />
                      </div>
                      <div className="grid gap-1.5">
                        <label className="text-muted-foreground" htmlFor="event-card-cvv">
                          CVV
                        </label>
                        <Input
                          id="event-card-cvv"
                          inputMode="numeric"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {paymentError ? (
                <p className="text-sm text-destructive">{paymentError}</p>
              ) : null}
              <Button
                type="button"
                onClick={() => submitEventRegistration(true)}
                disabled={
                  paymentSubmitting ||
                  registrationSubmitting ||
                  pendingPaymentSubmitting ||
                  paymentActionIsPaid
                }
              >
                {paymentSubmitting ? (
                  <>
                    <LoadingSpinner />
                    Procesando...
                  </>
                ) : paymentActionIsPaid ? (
                  "Pago completado"
                ) : (
                  "Pagar"
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
