"use client"

import { type KeyboardEvent, useEffect, useMemo, useState } from "react"
import { Download, FileText, Filter, Pencil, Trash2 } from "lucide-react"

import { downloadReport } from "@/lib/report-download"
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
  DialogDescription,
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
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SubmittingOverlay } from "@/components/ui/submitting-overlay"
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

type OfferingType = "voluntary" | "event" | "tithe" | "special" | "other"
type OfferingSource = "registered_user" | "anonymous" | "manual" | "self_service"
type PaymentMethod = "cash" | "transfer" | "card" | "other"
type PaymentStatus = "paid" | "pending" | "failed"

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
  paymentProvider?: "manual" | "mock"
  providerPaymentId?: string | null
  paymentStatus?: PaymentStatus
  entrySource?: "admin" | "self_service"
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
  self_service: "Usuario",
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "Pagada",
  pending: "Pendiente",
  failed: "Fallida",
}

const formTypeOptions: OfferingType[] = ["tithe", "voluntary"]
const formPaymentMethodOptions: PaymentMethod[] = ["cash", "transfer"]

function formatMoney(amount: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(amount)
}

function getAmountNumber(value: string) {
  const digits = value.replace(/[^\d]/g, "")

  return digits ? Number(digits) : 0
}

function formatAmountInput(value: string | number) {
  const digits = String(value).replace(/[^\d]/g, "")

  if (!digits) return ""

  return Number(digits).toLocaleString("en-US")
}

function handleAmountStep(
  event: KeyboardEvent<HTMLInputElement>,
  value: string,
  onChange: (value: string) => void
) {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return

  event.preventDefault()

  const direction = event.key === "ArrowUp" ? 100 : -100
  const nextValue = Math.max(0, getAmountNumber(value) + direction)

  onChange(formatAmountInput(nextValue))
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
  const [submitting, setSubmitting] = useState(false)
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [downloadingFormat, setDownloadingFormat] =
    useState<"csv" | "pdf" | null>(null)

  async function fetchOfferingsPage() {
    setPageError("")

    const [offeringsRes, usersRes, eventsRes] = await Promise.all([
      fetch("/api/offerings"),
      fetch("/api/users"),
      fetch("/api/events"),
    ])

    if (!offeringsRes.ok) {
      const data = await offeringsRes.json()
      setPageError(data?.message || "No se pudieron cargar las aportaciones")
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
    setSubmitting(true)

    try {
      const res = await fetch(`/api/offerings/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await fetchOfferingsPage()
      } else {
        const data = await res.json()
        alert(data?.message || "Error al eliminar")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filteredOfferings = useMemo(() => {
    const min = minAmount.trim() ? getAmountNumber(minAmount) : null
    const max = maxAmount.trim() ? getAmountNumber(maxAmount) : null

    return offerings.filter((offering) => {
      const matchesMin =
        min === null || Number.isNaN(min) || offering.amount >= min
      const matchesMax =
        max === null || Number.isNaN(max) || offering.amount <= max

      return matchesMin && matchesMax
    })
  }, [maxAmount, minAmount, offerings])
  const totalAmount = useMemo(() => {
    return filteredOfferings.reduce((total, offering) => total + offering.amount, 0)
  }, [filteredOfferings])
  const hasFiltersToClear = Boolean(minAmount) || Boolean(maxAmount)

  async function handleDownloadReport(format: "csv" | "pdf") {
    const params = new URLSearchParams({
      type: "offerings",
      format,
    })

    if (minAmount.trim()) params.set("minAmount", String(getAmountNumber(minAmount)))
    if (maxAmount.trim()) params.set("maxAmount", String(getAmountNumber(maxAmount)))

    setDownloadingFormat(format)
    setPageError("")

    try {
      await downloadReport(
        `/api/reports?${params.toString()}`,
        `reporte-aportaciones.${format}`
      )
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "No se pudo generar el reporte."
      )
    } finally {
      setDownloadingFormat(null)
    }
  }

  return (
    <div>
      <SubmittingOverlay
        show={submitting}
        label="Guardando cambios..."
        className="fixed z-[70]"
      />

      <div>
        <TypographyH1 className="text-left">Aportaciones</TypographyH1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro administrativo de entradas financieras.
        </p>
      </div>

      <Button
        onClick={() => {
          setSelectedOffering(null)
          setOpen(true)
        }}
        disabled={submitting}
        className="mt-4"
      >
        + Nueva aportación
      </Button>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          disabled={loading || filteredOfferings.length === 0 || downloadingFormat !== null}
          onClick={() => handleDownloadReport("csv")}
          className="w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          {downloadingFormat === "csv" ? "Descargando..." : "Descargar CSV"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || filteredOfferings.length === 0 || downloadingFormat !== null}
          onClick={() => handleDownloadReport("pdf")}
          className="w-full sm:w-auto"
        >
          <FileText className="h-4 w-4" />
          {downloadingFormat === "pdf" ? "Descargando..." : "Descargar PDF"}
        </Button>
      </div>

      <div className="theme-surface mt-4 mb-4 rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4" />
          Filtros
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="w-full md:max-w-56">
            <FieldLabel htmlFor="filter-min-amount">Monto mínimo</FieldLabel>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                $
              </span>
              <Input
                id="filter-min-amount"
                inputMode="numeric"
                placeholder="0"
                value={minAmount}
                onChange={(event) =>
                  setMinAmount(formatAmountInput(event.target.value))
                }
                onKeyDown={(event) =>
                  handleAmountStep(event, minAmount, setMinAmount)
                }
                className="pl-7"
              />
            </div>
          </div>
          <div className="w-full md:max-w-56">
            <FieldLabel htmlFor="filter-max-amount">Monto máximo</FieldLabel>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                $
              </span>
              <Input
                id="filter-max-amount"
                inputMode="numeric"
                placeholder="0"
                value={maxAmount}
                onChange={(event) =>
                  setMaxAmount(formatAmountInput(event.target.value))
                }
                onKeyDown={(event) =>
                  handleAmountStep(event, maxAmount, setMaxAmount)
                }
                className="pl-7"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setMinAmount("")
              setMaxAmount("")
            }}
            className="w-full md:w-auto"
            disabled={!hasFiltersToClear}
          >
            Limpiar filtros
          </Button>
          <div className="text-sm text-muted-foreground md:ml-auto">
            Total mostrado:{" "}
            <span className="font-semibold text-foreground">
              {formatMoney(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-card text-card-foreground">
        <Table className="min-w-[900px]" containerClassName="max-h-[60vh]">
          <TableHeader>
            <TableRow>
              <TableHead>Monto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Donante</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registró</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageError ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-destructive">
                  {pageError}
                </TableCell>
              </TableRow>
            ) : loading ? (
              <TableSkeletonRows columns={10} rows={6} />
            ) : filteredOfferings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  Todavía no hay aportaciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              filteredOfferings.map((offering) => (
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
                  <TableCell>
                    <Badge
                      variant={
                        offering.paymentStatus === "failed"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {offering.paymentStatus
                        ? paymentStatusLabels[offering.paymentStatus]
                        : "Pagada"}
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
                        disabled={submitting}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
                            <AlertDialogTitle>¿Eliminar aportación?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <p className="text-sm text-muted-foreground">
                            Esta acción no se puede deshacer.
                          </p>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(offering._id)}
                              disabled={submitting}
                            >
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
        onSuccess={fetchOfferingsPage}
        submitting={submitting}
        onSubmittingChange={setSubmitting}
      />
    </div>
  )
}

function OfferingDialog({
  open,
  onOpenChange,
  offering,
  onSuccess,
  submitting,
  onSubmittingChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  offering: Offering | null
  onSuccess: () => Promise<void> | void
  submitting: boolean
  onSubmittingChange: (submitting: boolean) => void
}) {
  function handleOpenChange(nextOpen: boolean) {
    if (submitting && !nextOpen) return

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <OfferingForm
        key={`${offering?._id || "new"}-${open ? "open" : "closed"}`}
        offering={offering}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        submitting={submitting}
        onSubmittingChange={onSubmittingChange}
      />
    </Dialog>
  )
}

function OfferingForm({
  offering,
  onOpenChange,
  onSuccess,
  submitting,
  onSubmittingChange,
}: {
  offering: Offering | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void> | void
  submitting: boolean
  onSubmittingChange: (submitting: boolean) => void
}) {
  const [amount, setAmount] = useState(
    offering?.amount ? formatAmountInput(offering.amount) : ""
  )
  const [type, setType] = useState<OfferingType>(
    offering?.type && formTypeOptions.includes(offering.type)
      ? offering.type
      : "voluntary"
  )
  const [donorName, setDonorName] = useState(offering?.donorName || "")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    offering?.paymentMethod &&
      formPaymentMethodOptions.includes(offering.paymentMethod)
      ? offering.paymentMethod
      : "cash"
  )
  const [notes, setNotes] = useState(offering?.notes || "")
  const [error, setError] = useState("")
  const isEdit = Boolean(offering)

  async function handleSubmit() {
    setError("")

    const parsedAmount = getAmountNumber(amount)
    const trimmedDonorName = donorName.trim()
    const trimmedNotes = notes.trim()

    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("El monto debe ser mayor a 0")
      return
    }

    onSubmittingChange(true)

    try {
      const res = await fetch(
        isEdit ? `/api/offerings/${offering?._id}` : "/api/offerings",
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parsedAmount,
            currency: "MXN",
            type,
            source: "manual",
            eventId: null,
            userId: null,
            donorName: trimmedDonorName,
            paymentMethod,
            paymentProvider: "manual",
            paymentStatus: "paid",
            entrySource: "admin",
            notes: trimmedNotes,
          }),
        }
      )
      const data = await res.json()

      if (res.ok) {
        await onSuccess()
        onOpenChange(false)
        return
      }

      setError(data?.message || "Error al guardar")
    } catch {
      setError("Error al guardar")
    } finally {
      onSubmittingChange(false)
    }
  }

  return (
    <DialogContent
      className="max-h-[90vh] overflow-hidden sm:max-w-2xl"
      onEscapeKeyDown={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle>{isEdit ? "Editar aportación" : "Nueva aportación"}</DialogTitle>
        <DialogDescription>
          Registra una entrada financiera de forma administrativa.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup className="max-h-[70vh] overflow-y-auto pr-1" aria-busy={submitting}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Monto</FieldLabel>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                $
              </span>
              <Input
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(event) =>
                  setAmount(formatAmountInput(event.target.value))
                }
                onKeyDown={(event) =>
                  handleAmountStep(event, amount, setAmount)
                }
                className="pl-7"
              />
            </div>
          </Field>
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <Select value={type} onValueChange={(value) => setType(value as OfferingType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formTypeOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {typeLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Fuente</FieldLabel>
            <Input value="Manual" disabled />
          </Field>
          <Field>
            <FieldLabel>Moneda</FieldLabel>
            <Input value="MXN" disabled />
          </Field>
        </div>

        <Field>
          <FieldLabel>Nombre</FieldLabel>
          <Input
            value={donorName}
            onChange={(event) => setDonorName(event.target.value)}
            placeholder="Nombre opcional"
          />
          <FieldDescription>
            Puedes dejarlo vacío si no deseas registrar un nombre.
          </FieldDescription>
        </Field>

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
              {formPaymentMethodOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {paymentMethodLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Peticiones</FieldLabel>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Peticiones opcionales..."
          />
          <FieldDescription>
            Este campo es opcional.
          </FieldDescription>
        </Field>

        <FieldError>{error}</FieldError>
      </FieldGroup>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <LoadingSpinner />
              Guardando...
            </>
          ) : isEdit ? (
            "Actualizar"
          ) : (
            "Crear"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
