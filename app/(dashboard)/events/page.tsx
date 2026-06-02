"use client"

import { useEffect, useState } from "react"
import EventModal from "@/components/events/event-modal"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmittingOverlay } from "@/components/ui/submitting-overlay"
import { TypographyH1 } from "@/components/ui/typography"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeletonRows,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ClipboardList, Filter, Pencil, Trash2 } from "lucide-react"

type Event = {
  _id: string
  name: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  organizer: string
  organizerName?: string
  requiresRegistration?: boolean
  isPaidEvent?: boolean
  paymentAmount?: number | null
  paymentMethod?: "transfer" | "card" | null
  registrationsCount?: number
}

type EventRegistration = {
  _id: string
  eventId: string
  name?: string
  email?: string
  contact?: string
  paymentAmount?: number | null
  paymentMethod?: "transfer" | "card" | null
  paymentStatus?: "paid" | "pending" | "not_required"
  createdAt?: string
}

type User = {
  _id: string
  name: string
  email: string
  role: string
}

function canViewEventRegistrations(role?: string) {
  if (!role) return false

  const normalizedRole = role
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  return ["administrador", "admin", "pastor"].includes(normalizedRole)
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [organizers, setOrganizers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [filterName, setFilterName] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [registrationsOpen, setRegistrationsOpen] = useState(false)
  const [registrationsEvent, setRegistrationsEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [registrationsError, setRegistrationsError] = useState("")
  const [pageError, setPageError] = useState("")
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>()

  async function fetchEvents() {
    const [eventsRes, ministeriesRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/ministeries")
    ])
    const eventsData = await eventsRes.json()
    const ministeriesData = await ministeriesRes.json()
    setEvents(eventsData)
    setOrganizers(ministeriesData.leaders || [])
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetch("/api/events"),
      fetch("/api/ministeries"),
      fetch("/api/auth/me"),
    ])
      .then(async ([eventsRes, ministeriesRes, meRes]) => {
        const eventsData = await eventsRes.json()
        const ministeriesData = await ministeriesRes.json()
        const meData = meRes.ok ? await meRes.json() : null

        if (isMounted) {
          setEvents(eventsData)
          setOrganizers(ministeriesData.leaders || [])
          setCurrentUserRole(meData?.user?.role)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredEvents = events.filter((event) => {
    const matchesName =
      !filterName.trim() ||
      event.name.toLowerCase().includes(filterName.trim().toLowerCase())

    const matchesDate = !filterDate || event.date === filterDate

    return matchesName && matchesDate
  })
  const hasFiltersToClear = Boolean(filterName) || Boolean(filterDate)
  const userCanViewEventRegistrations =
    canViewEventRegistrations(currentUserRole)

  async function handleDelete(id: string) {
    setSubmitting(true)
    setPageError("")

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await fetchEvents()
      } else {
        const data = await res.json()
        setPageError(data?.message || "No se pudo eliminar el evento.")
      }
    } catch {
      setPageError("No se pudo eliminar el evento.")
    } finally {
      setSubmitting(false)
    }
  }

  async function openRegistrationsModal(event: Event) {
    setRegistrationsEvent(event)
    setRegistrationsOpen(true)
    setRegistrations([])
    setRegistrationsError("")
    setRegistrationsLoading(true)

    try {
      const res = await fetch(`/api/event-registrations?eventId=${event._id}`)
      const data = await res.json()

      if (!res.ok) {
        setRegistrationsError(
          data?.message || "No se pudieron cargar los registros."
        )
        return
      }

      setRegistrations(Array.isArray(data.registrations) ? data.registrations : [])
    } catch {
      setRegistrationsError("No se pudieron cargar los registros.")
    } finally {
      setRegistrationsLoading(false)
    }
  }

  return (
    <div>
      <SubmittingOverlay
        show={submitting}
        label="Guardando cambios..."
        className="fixed z-[70]"
      />

      <TypographyH1 className="mb-6 text-left">
        Eventos
      </TypographyH1>

      <Button onClick={() => {
        setSelectedEvent(null)
        setOpen(true)
      }} disabled={submitting}>
        + Nuevo evento
      </Button>

      {pageError ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {pageError}
        </div>
      ) : null}

      <div className="mt-4 mb-4 rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4" />
          Filtros
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="w-full md:max-w-sm">
            <Label htmlFor="filter-name">Filtrar por nombre</Label>
            <Input
              id="filter-name"
              placeholder="Buscar por nombre..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>
          <div className="w-full md:max-w-56">
            <Label htmlFor="filter-date">Filtrar por fecha</Label>
            <Input
              id="filter-date"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFilterName("")
              setFilterDate("")
            }}
            className="w-full md:w-auto"
            disabled={!hasFiltersToClear}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border mt-4">
        <Table containerClassName="max-h-[60vh]">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Organizador</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeletonRows columns={8} rows={6} />
            ) : filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500">
                  No hay eventos que coincidan con los filtros
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{`${event.startTime} - ${event.endTime}`}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{event.organizerName || "Sin organizador"}</TableCell>
                  <TableCell>{event.requiresRegistration ? "Sí" : "No"}</TableCell>
                  <TableCell>{event.isPaidEvent ? "Sí" : "No"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        {userCanViewEventRegistrations &&
                        event.requiresRegistration &&
                        (event.registrationsCount || 0) > 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => openRegistrationsModal(event)}
                                disabled={submitting}
                              >
                                <ClipboardList className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Ver registros
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setSelectedEvent(event)
                                setOpen(true)
                              }}
                              disabled={submitting}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Editar evento
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  disabled={submitting}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Eliminar evento?
                                  </AlertDialogTitle>
                                </AlertDialogHeader>

                                <p className="text-sm text-gray-500">
                                  Esta acción no se puede deshacer.
                                </p>

                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>

                                  <AlertDialogAction
                                    onClick={() => handleDelete(event._id)}
                                    disabled={submitting}
                                  >
                                    Sí, eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>

                          <TooltipContent>
                            Eliminar evento
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EventModal
        key={`${selectedEvent?._id ?? "new"}-${open ? "open" : "closed"}`}
        open={open}
        onOpenChange={setOpen}
        event={selectedEvent}
        onSuccess={fetchEvents}
        organizers={organizers}
        submitting={submitting}
        onSubmittingChange={setSubmitting}
      />

      <EventRegistrationsDialog
        open={registrationsOpen}
        onOpenChange={setRegistrationsOpen}
        event={registrationsEvent}
        registrations={registrations}
        loading={registrationsLoading}
        error={registrationsError}
      />
    </div>
  )
}

function formatMoney(amount?: number | null) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "-"
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

function formatPaymentMethod(method?: EventRegistration["paymentMethod"]) {
  if (method === "card") return "Tarjeta"
  if (method === "transfer") return "Transferencia"

  return "-"
}

function formatPaymentStatus(status?: EventRegistration["paymentStatus"]) {
  if (status === "paid") return "Pagado"
  if (status === "pending") return "Pendiente"
  if (status === "not_required") return "No requiere"

  return "-"
}

function formatDateTime(value?: string) {
  if (!value) return "-"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function EventRegistrationsDialog({
  open,
  onOpenChange,
  event,
  registrations,
  loading,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
  registrations: EventRegistration[]
  loading: boolean
  error: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Registros del evento</DialogTitle>
          <DialogDescription>
            {event?.name || "Evento"}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        ) : null}

        <Table className="min-w-[900px]" containerClassName="max-h-[60vh]">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows columns={7} rows={5} />
            ) : registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  No hay registros para este evento
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((registration) => (
                <TableRow key={registration._id}>
                  <TableCell>{registration.name || "-"}</TableCell>
                  <TableCell>{registration.email || "-"}</TableCell>
                  <TableCell>{registration.contact || "-"}</TableCell>
                  <TableCell>
                    {formatPaymentStatus(registration.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    {formatPaymentMethod(registration.paymentMethod)}
                  </TableCell>
                  <TableCell>{formatMoney(registration.paymentAmount)}</TableCell>
                  <TableCell>{formatDateTime(registration.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
