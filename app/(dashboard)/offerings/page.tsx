"use client"

import { useEffect, useMemo, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { TypographyH1 } from "@/components/ui/typography"

type OfferingType = "voluntary" | "event" | "tithe" | "special" | "other"
type OfferingSource = "registered_user" | "anonymous" | "manual"
type PaymentMethod = "cash" | "transfer" | "card" | "other"

type Offering = {
  _id: string
  amount: number
  currency: string
  type: OfferingType
  source: OfferingSource
  eventId?: string | null
  eventName?: string
  userId?: string | null
  userName?: string
  donorName?: string
  paymentMethod: PaymentMethod
  notes?: string
  recordedByName?: string
  createdAt?: string
}

type User = {
  _id: string
  name: string
  email: string
}

type Event = {
  _id: string
  name: string
  date?: string
}

const noneValue = "__none"

const typeLabels: Record<OfferingType, string> = {
  voluntary: "Voluntaria",
  event: "Por evento",
  tithe: "Diezmo",
  special: "Especial",
  other: "Otra",
}

const sourceLabels: Record<OfferingSource, string> = {
  registered_user: "Usuario registrado",
  anonymous: "Anónima",
  manual: "Manual",
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
}

function formatMoney(amount: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(amount)
}

function formatDate(value?: string) {
  if (!value) return "-"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getUserName(userId: string | null | undefined, users: User[]) {
  if (!userId) return ""

  const user = users.find((item) => item._id === userId)

  return user?.name || user?.email || ""
}

function getEventName(eventId: string | null | undefined, events: Event[]) {
  if (!eventId) return ""

  return events.find((event) => event._id === eventId)?.name || ""
}

export default function OfferingsPage() {
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [open, setOpen] = useState(false)
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  async function fetchOfferingsPage() {
    setPageError("")

    const [offeringsRes, usersRes, eventsRes] = await Promise.all([
      fetch("/api/offerings"),
      fetch("/api/users"),
      fetch("/api/events"),
    ])

    if (!offeringsRes.ok) {
      const data = await offeringsRes.json()
      setPageError(data?.message || "No se pudieron cargar las ofrendas")
      setOfferings([])
      return
    }

    const offeringsData = await offeringsRes.json()
    setOfferings(
      Array.isArray(offeringsData.offerings) ? offeringsData.offerings : []
    )

    if (usersRes.ok) {
      const usersData = await usersRes.json()
      setUsers(Array.isArray(usersData) ? usersData : [])
    } else {
      setUsers([])
    }

    if (eventsRes.ok) {
      const eventsData = await eventsRes.json()
      setEvents(Array.isArray(eventsData) ? eventsData : [])
    } else {
      setEvents([])
    }
  }

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        await fetchOfferingsPage()
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [])

  async function handleDelete(id: string) {
    const res = await fetch(`/api/offerings/${id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      fetchOfferingsPage()
    } else {
      const data = await res.json()
      alert(data?.message || "Error al eliminar")
    }
  }

  const totalAmount = useMemo(() => {
    return offerings.reduce((total, offering) => total + offering.amount, 0)
  }, [offerings])

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <TypographyH1 className="text-left">Ofrendas</TypographyH1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro administrativo de entradas financieras.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedOffering(null)
            setOpen(true)
          }}
        >
          + Nueva ofrenda
        </Button>
      </div>

      <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
        Total registrado:{" "}
        <span className="font-semibold">{formatMoney(totalAmount)}</span>
      </div>

      <div className="mt-6 rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Monto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Donante</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Registró</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageError ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-destructive">
                  {pageError}
                </TableCell>
              </TableRow>
            ) : loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Cargando ofrendas...
                </TableCell>
              </TableRow>
            ) : offerings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Todavía no hay ofrendas registradas.
                </TableCell>
              </TableRow>
            ) : (
              offerings.map((offering) => (
                <TableRow key={offering._id}>
                  <TableCell className="font-medium">
                    {formatMoney(offering.amount, offering.currency)}
                  </TableCell>
                  <TableCell>{typeLabels[offering.type] || offering.type}</TableCell>
                  <TableCell>{sourceLabels[offering.source] || offering.source}</TableCell>
                  <TableCell>
                    {offering.eventName || getEventName(offering.eventId, events) || "-"}
                  </TableCell>
                  <TableCell>
                    {offering.userName ||
                      getUserName(offering.userId, users) ||
                      offering.donorName ||
                      "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {paymentMethodLabels[offering.paymentMethod] ||
                        offering.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell>{offering.recordedByName || "-"}</TableCell>
                  <TableCell>{formatDate(offering.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setSelectedOffering(offering)
                          setOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar ofrenda?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <p className="text-sm text-muted-foreground">
                            Esta acción no se puede deshacer.
                          </p>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(offering._id)}>
                              Sí, eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OfferingDialog
        open={open}
        onOpenChange={setOpen}
        offering={selectedOffering}
        users={users}
        events={events}
        onSuccess={fetchOfferingsPage}
      />
    </div>
  )
}

function OfferingDialog({
  open,
  onOpenChange,
  offering,
  users,
  events,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  offering: Offering | null
  users: User[]
  events: Event[]
  onSuccess: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <OfferingForm
        key={`${offering?._id || "new"}-${open ? "open" : "closed"}`}
        offering={offering}
        users={users}
        events={events}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    </Dialog>
  )
}

function OfferingForm({
  offering,
  users,
  events,
  onOpenChange,
  onSuccess,
}: {
  offering: Offering | null
  users: User[]
  events: Event[]
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState(String(offering?.amount ?? ""))
  const [currency, setCurrency] = useState(offering?.currency || "MXN")
  const [type, setType] = useState<OfferingType>(offering?.type || "voluntary")
  const [source, setSource] = useState<OfferingSource>(offering?.source || "manual")
  const [eventId, setEventId] = useState(offering?.eventId || noneValue)
  const [userId, setUserId] = useState(offering?.userId || noneValue)
  const [donorName, setDonorName] = useState(offering?.donorName || "")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    offering?.paymentMethod || "cash"
  )
  const [notes, setNotes] = useState(offering?.notes || "")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(offering)

  async function handleSubmit() {
    setSaving(true)
    setError("")

    const res = await fetch(
      isEdit ? `/api/offerings/${offering?._id}` : "/api/offerings",
      {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          currency,
          type,
          source,
          eventId: eventId === noneValue ? null : eventId,
          userId: userId === noneValue ? null : userId,
          donorName,
          paymentMethod,
          notes,
        }),
      }
    )
    const data = await res.json()

    setSaving(false)

    if (res.ok) {
      onSuccess()
      onOpenChange(false)
      return
    }

    setError(data?.message || "Error al guardar")
  }

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Editar ofrenda" : "Nueva ofrenda"}</DialogTitle>
      </DialogHeader>

      <FieldGroup className="max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Monto</FieldLabel>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Moneda</FieldLabel>
            <Input value={currency} onChange={(event) => setCurrency(event.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <Select value={type} onValueChange={(value) => setType(value as OfferingType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Fuente</FieldLabel>
            <Select value={source} onValueChange={(value) => setSource(value as OfferingSource)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sourceLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {type === "event" ? (
          <Field>
            <FieldLabel>Evento</FieldLabel>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={noneValue}>Selecciona un evento</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event._id} value={event._id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        {source === "registered_user" ? (
          <Field>
            <FieldLabel>Usuario</FieldLabel>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={noneValue}>Selecciona un usuario</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : (
          <Field>
            <FieldLabel>Nombre del donante</FieldLabel>
            <Input
              value={donorName}
              onChange={(event) => setDonorName(event.target.value)}
              placeholder={source === "anonymous" ? "Anónimo" : "Nombre opcional"}
            />
            <FieldDescription>
              Puedes dejarlo vacío si no deseas registrar un nombre.
            </FieldDescription>
          </Field>
        )}

        <Field>
          <FieldLabel>Método de pago</FieldLabel>
          <Select
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Notas</FieldLabel>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Referencia, contexto del registro, detalles internos..."
          />
        </Field>

        <FieldError>{error}</FieldError>
      </FieldGroup>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
