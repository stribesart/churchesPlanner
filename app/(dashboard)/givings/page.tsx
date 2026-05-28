"use client"

import { useEffect, useMemo, useState } from "react"
import { CreditCard, HandCoins } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  TableSkeletonRows,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { TypographyH1 } from "@/components/ui/typography"

type GivingType = "voluntary" | "event" | "tithe" | "special" | "other"
type PaymentMethod = "card" | "transfer" | "cash" | "other"
type PaymentStatus = "paid" | "pending" | "failed"

type Event = {
  _id: string
  name: string
  date?: string
}

type Giving = {
  _id: string
  amount: number
  currency: string
  type: GivingType
  eventName?: string
  paymentMethod: PaymentMethod
  paymentStatus?: PaymentStatus
  providerPaymentId?: string | null
  createdAt?: string
}

const noneValue = "__none"

const typeLabels: Record<GivingType, string> = {
  voluntary: "Ofrenda voluntaria",
  event: "Por evento",
  tithe: "Diezmo",
  special: "Especial",
  other: "Otra",
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  card: "Tarjeta",
  transfer: "Transferencia",
  cash: "Efectivo",
  other: "Otro",
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "Registrada",
  pending: "Pendiente",
  failed: "Fallida",
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

export default function GivingsPage() {
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<GivingType>("voluntary")
  const [eventId, setEventId] = useState(noneValue)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [notes, setNotes] = useState("")
  const [events, setEvents] = useState<Event[]>([])
  const [givings, setGivings] = useState<Giving[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    let isMounted = true

    Promise.all([fetch("/api/givings"), fetch("/api/events")])
      .then(async ([givingsRes, eventsRes]) => {
        const givingsData = givingsRes.ok ? await givingsRes.json() : {}
        const eventsData = eventsRes.ok ? await eventsRes.json() : []

        if (isMounted) {
          setGivings(
            Array.isArray(givingsData.offerings) ? givingsData.offerings : []
          )
          setEvents(Array.isArray(eventsData) ? eventsData : [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("No se pudo cargar la información")
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const totalGiven = useMemo(() => {
    return givings.reduce((total, giving) => total + giving.amount, 0)
  }, [givings])

  async function refreshGivings() {
    const res = await fetch("/api/givings")

    if (!res.ok) return

    const data = await res.json()
    setGivings(Array.isArray(data.offerings) ? data.offerings : [])
  }

  async function handleSubmit() {
    setError("")
    setSuccess("")

    const parsedAmount = Number(amount)
    const trimmedNotes = notes.trim()

    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("El monto debe ser mayor a 0")
      return
    }

    if (type === "event" && eventId === noneValue) {
      setError("Selecciona un evento para esta ofrenda")
      return
    }

    setSaving(true)

    const res = await fetch("/api/givings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: parsedAmount,
        currency: "MXN",
        type,
        eventId: type === "event" && eventId !== noneValue ? eventId : null,
        paymentMethod,
        notes: trimmedNotes,
      }),
    })
    const data = await res.json()

    setSaving(false)

    if (!res.ok) {
      setError(data?.message || "No se pudo registrar la ofrenda")
      return
    }

    setAmount("")
    setType("voluntary")
    setEventId(noneValue)
    setPaymentMethod("card")
    setNotes("")
    setSuccess(
      data?.providerPaymentId
        ? `Ofrenda registrada con referencia ${data.providerPaymentId}`
        : "Ofrenda registrada"
    )
    refreshGivings()
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <TypographyH1 className="text-left text-2xl sm:text-3xl">
          Dar ofrenda
        </TypographyH1>
        <p className="text-sm text-muted-foreground">
          Registra tu ofrenda para que quede ligada a tu iglesia y a tu cuenta.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5" />
              Ofrenda
            </CardTitle>
            <CardDescription>
              El pago con tarjeta se simula por ahora para pruebas internas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Monto</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Field>
                  <FieldLabel>Tipo</FieldLabel>
                  <Select
                    value={type}
                    onValueChange={(value) => setType(value as GivingType)}
                  >
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
              </div>

              {type === "event" ? (
                <Field>
                  <FieldLabel>Evento</FieldLabel>
                  <Select value={eventId} onValueChange={setEventId}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={noneValue}>
                        Selecciona un evento
                      </SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event._id} value={event._id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}

              <Field>
                <FieldLabel>Método</FieldLabel>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(value as PaymentMethod)
                  }
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

              {paymentMethod === "card" ? (
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <CreditCard className="h-4 w-4" />
                    Tarjeta mock
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Cuando integremos el proveedor, aquí vivirá el elemento
                    seguro de pago.
                  </p>
                </div>
              ) : null}

              <Field>
                <FieldLabel>Notas</FieldLabel>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Mensaje opcional"
                />
                <FieldDescription>
                  Este campo es opcional.
                </FieldDescription>
              </Field>

              <FieldError>{error}</FieldError>

              {success ? (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {success}
                </div>
              ) : null}

              <Button onClick={handleSubmit} disabled={saving} className="w-full">
                {saving ? "Registrando..." : "Registrar ofrenda"}
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Mis ofrendas</CardTitle>
            <CardDescription>
              Total personal registrado en esta iglesia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatMoney(totalGiven)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {givings.length} registros recientes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Historial reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[620px]" containerClassName="max-h-[360px]">
            <TableHeader>
              <TableRow>
                <TableHead>Monto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeletonRows columns={5} rows={5} />
              ) : givings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Todavía no has registrado ofrendas.
                  </TableCell>
                </TableRow>
              ) : (
                givings.map((giving) => (
                  <TableRow key={giving._id}>
                    <TableCell className="font-medium">
                      {formatMoney(giving.amount, giving.currency)}
                    </TableCell>
                    <TableCell>
                      {giving.type === "event" && giving.eventName
                        ? giving.eventName
                        : typeLabels[giving.type]}
                    </TableCell>
                    <TableCell>
                      {paymentMethodLabels[giving.paymentMethod] ||
                        giving.paymentMethod}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {giving.paymentStatus
                          ? paymentStatusLabels[giving.paymentStatus]
                          : "Registrada"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(giving.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
