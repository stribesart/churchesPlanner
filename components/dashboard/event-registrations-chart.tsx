"use client"

import * as React from "react"
import { Download, FileText } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { downloadReport } from "@/lib/report-download"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
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

type PaymentMethod = "transfer" | "card"

type Event = {
  _id: string
  name?: string
  requiresRegistration?: boolean
  isPaidEvent?: boolean
  expectedAttendees?: number | null
  paymentAmount?: number | null
}

type EventRegistration = {
  _id: string
  eventId: string
  name?: string
  email?: string
  contact?: string
  paymentAmount?: number | null
  paymentMethod?: PaymentMethod | null
  paymentStatus?: "paid" | "pending" | "not_required"
  paymentPending?: boolean
  createdAt?: string
  paidAt?: string
}

type Props = {
  events: Event[]
  registrations: EventRegistration[]
  usersCount?: number
}

const allEventsValue = "all"
const allPaymentStatusesValue = "all"

const chartConfig = {
  registrados: {
    label: "Registrados",
    color: "var(--chart-2)",
  },
  esperados: {
    label: "Esperados",
    color: "var(--chart-4)",
  },
  pagados: {
    label: "Pagados",
    color: "var(--chart-1)",
  },
  pendientes: {
    label: "Pendientes",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

function getEventName(event: Event) {
  return event.name || "Evento"
}

function getExpectedAttendees(event: Event, usersCount: number) {
  if (
    typeof event.expectedAttendees === "number" &&
    Number.isFinite(event.expectedAttendees) &&
    event.expectedAttendees > 0
  ) {
    return {
      value: event.expectedAttendees,
      source: "manual" as const,
    }
  }

  if (event.requiresRegistration && usersCount > 0) {
    return {
      value: usersCount,
      source: "users" as const,
    }
  }

  return {
    value: 0,
    source: "none" as const,
  }
}

function formatExpectedSource(source: ReturnType<typeof getExpectedAttendees>["source"]) {
  if (source === "manual") return "Manual"
  if (source === "users") return "Usuarios del sistema"

  return "-"
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatPaymentMethod(method?: PaymentMethod | null) {
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

function getRegistrationAmount(registration: EventRegistration) {
  return typeof registration.paymentAmount === "number" &&
    Number.isFinite(registration.paymentAmount)
    ? registration.paymentAmount
    : ""
}

function isPendingRegistration(registration: EventRegistration) {
  return registration.paymentStatus === "pending" ||
    registration.paymentPending === true
}

function filterRegistrations(
  registrations: EventRegistration[],
  search: string,
  paymentStatus: string
) {
  const normalizedSearch = search.trim().toLowerCase()

  return registrations.filter((registration) => {
    const matchesSearch =
      !normalizedSearch ||
      [registration.name, registration.email, registration.contact]
        .filter((value): value is string => typeof value === "string")
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    const matchesPaymentStatus =
      paymentStatus === allPaymentStatusesValue ||
      (paymentStatus === "pending"
        ? isPendingRegistration(registration)
        : registration.paymentStatus === paymentStatus)

    return matchesSearch && matchesPaymentStatus
  })
}

function buildChartData(
  events: Event[],
  registrations: EventRegistration[],
  usersCount: number
) {
  return events
    .map((event) => {
      const eventRegistrations = registrations.filter(
        (registration) => registration.eventId === event._id
      )
      const paidCount = eventRegistrations.filter(
        (registration) => registration.paymentStatus === "paid"
      ).length
      const pendingCount = eventRegistrations.filter(
        (registration) =>
          registration.paymentStatus === "pending" ||
          registration.paymentPending === true
      ).length
      const expectedAttendees = getExpectedAttendees(event, usersCount).value

      return {
        eventId: event._id,
        eventName: getEventName(event),
        registrados: eventRegistrations.length,
        esperados: expectedAttendees,
        pagados: paidCount,
        pendientes: pendingCount,
      }
    })
    .filter((item) => item.registrados > 0 || item.esperados > 0)
}

export function EventRegistrationsChart({
  events,
  registrations,
  usersCount = 0,
}: Props) {
  const [selectedEventId, setSelectedEventId] =
    React.useState(allEventsValue)
  const [registrationSearch, setRegistrationSearch] = React.useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] =
    React.useState(allPaymentStatusesValue)
  const [downloadingFormat, setDownloadingFormat] =
    React.useState<"csv" | "pdf" | null>(null)
  const [downloadError, setDownloadError] = React.useState("")

  const chartData = React.useMemo(() => {
    const data = buildChartData(events, registrations, usersCount)

    if (selectedEventId === allEventsValue) return data

    return data.filter((item) => item.eventId === selectedEventId)
  }, [events, registrations, selectedEventId, usersCount])

  const selectedRegistrations = React.useMemo(() => {
    if (selectedEventId === allEventsValue) return registrations

    return registrations.filter(
      (registration) => registration.eventId === selectedEventId
    )
  }, [registrations, selectedEventId])
  const eventsById = React.useMemo(
    () => new Map(events.map((event) => [event._id, event])),
    [events]
  )
  const filteredRegistrations = React.useMemo(
    () => filterRegistrations(
      selectedRegistrations,
      registrationSearch,
      paymentStatusFilter
    ),
    [paymentStatusFilter, registrationSearch, selectedRegistrations]
  )

  const selectedEvent = events.find((event) => event._id === selectedEventId)
  const totalRegistered = selectedRegistrations.length
  const selectedExpected = selectedEvent
    ? getExpectedAttendees(selectedEvent, usersCount)
    : null
  const expectedAttendees =
    selectedEventId === allEventsValue
      ? events.reduce((total, event) => {
          return total + getExpectedAttendees(event, usersCount).value
        }, 0)
      : selectedExpected?.value || 0
  const missingAttendees =
    expectedAttendees > 0
      ? Math.max(expectedAttendees - totalRegistered, 0)
      : null
  const attendancePercent =
    expectedAttendees > 0
      ? Math.min((totalRegistered / expectedAttendees) * 100, 100)
      : null
  const paidCount = selectedRegistrations.filter(
    (registration) => registration.paymentStatus === "paid"
  ).length
  const pendingCount = selectedRegistrations.filter(
    (registration) => isPendingRegistration(registration)
  ).length
  const notRequiredCount = selectedRegistrations.filter(
    (registration) => registration.paymentStatus === "not_required"
  ).length
  const paymentAmount =
    typeof selectedEvent?.paymentAmount === "number"
      ? selectedEvent.paymentAmount
      : 0
  const paidAmount =
    selectedEventId === allEventsValue
      ? selectedRegistrations.reduce((total, registration) => {
          const amount =
            typeof registration.paymentAmount === "number"
              ? registration.paymentAmount
              : 0

          return registration.paymentStatus === "paid" ? total + amount : total
        }, 0)
      : paidCount * paymentAmount
  const pendingAmount =
    selectedEventId === allEventsValue
      ? selectedRegistrations.reduce((total, registration) => {
          const amount =
            typeof registration.paymentAmount === "number"
              ? registration.paymentAmount
              : 0

          return registration.paymentStatus === "pending" ? total + amount : total
        }, 0)
      : pendingCount * paymentAmount
  async function handleDownload(format: "csv" | "pdf") {
    const params = new URLSearchParams({
      type: "event-registrations",
      format,
      eventId: selectedEventId,
      paymentStatus: paymentStatusFilter,
    })

    if (registrationSearch.trim()) {
      params.set("search", registrationSearch.trim())
    }

    setDownloadingFormat(format)
    setDownloadError("")

    try {
      await downloadReport(
        `/api/reports?${params.toString()}`,
        `reporte-registros-eventos.${format}`
      )
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "No se pudo generar el reporte."
      )
    } finally {
      setDownloadingFormat(null)
    }
  }

  return (
    <Card className="@container/card min-w-0">
      <CardHeader className="gap-3">
        <CardTitle>Registros de eventos</CardTitle>
        <CardDescription>
          Esperados, registrados, avance y pagos por evento.
        </CardDescription>
        <CardAction className="static col-start-1 row-start-auto flex flex-col gap-2 justify-self-start @[767px]/card:col-start-2 @[767px]/card:row-start-1 @[767px]/card:items-end @[767px]/card:justify-self-end">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger
              className="w-64 max-w-full **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              aria-label="Seleccionar evento"
            >
              <SelectValue placeholder="Todos los eventos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allEventsValue}>Todos los eventos</SelectItem>
              {events.map((event) => (
                <SelectItem key={event._id} value={event._id}>
                  {getEventName(event)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filteredRegistrations.length === 0 || downloadingFormat !== null}
            onClick={() => handleDownload("csv")}
            className="w-full @[767px]/card:w-auto"
          >
            <Download className="h-4 w-4" />
            {downloadingFormat === "csv" ? "Descargando..." : "Descargar CSV"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filteredRegistrations.length === 0 || downloadingFormat !== null}
            onClick={() => handleDownload("pdf")}
            className="w-full @[767px]/card:w-auto"
          >
            <FileText className="h-4 w-4" />
            {downloadingFormat === "pdf" ? "Descargando..." : "Descargar PDF"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4 px-2 pt-4 sm:px-6 sm:pt-6">
        {downloadError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {downloadError}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
          <Metric
            label="Esperados"
            value={expectedAttendees > 0 ? expectedAttendees.toString() : "-"}
          />
          <Metric label="Registrados" value={totalRegistered.toString()} />
          <Metric
            label="Avance"
            value={attendancePercent === null ? "-" : formatPercent(attendancePercent)}
          />
          <Metric
            label="Faltantes"
            value={missingAttendees === null ? "-" : missingAttendees.toString()}
          />
          <Metric label="Pagados" value={paidCount.toString()} />
          <Metric label="Pendientes" value={pendingCount.toString()} />
          <Metric label="Sin pago" value={notRequiredCount.toString()} />
        </div>

        {selectedEventId !== allEventsValue && selectedEvent?.isPaidEvent ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Metric label="Monto pagado" value={formatMoney(paidAmount)} />
            <Metric label="Monto pendiente" value={formatMoney(pendingAmount)} />
          </div>
        ) : null}

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] min-w-0 w-full"
        >
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="eventName"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value) =>
                typeof value === "string" && value.length > 14
                  ? `${value.slice(0, 14)}...`
                  : value
              }
            />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <Bar
              dataKey="registrados"
              fill="var(--color-registrados)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="esperados"
              fill="var(--color-esperados)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="pagados"
              fill="var(--color-pagados)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="pendientes"
              fill="var(--color-pendientes)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>

        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay registros de eventos para mostrar.
          </p>
        ) : null}

        {selectedEventId !== allEventsValue && selectedEvent ? (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Detalle del evento</p>
                <p className="text-sm text-muted-foreground">
                  {getEventName(selectedEvent)}
                </p>
              </div>
              <div className="space-y-1 text-sm font-medium sm:text-right">
                <p>
                  Avance: {totalRegistered}
                  {expectedAttendees > 0 ? `/${expectedAttendees}` : ""}
                </p>
                <p>
                  Meta:{" "}
                  {selectedExpected
                    ? formatExpectedSource(selectedExpected.source)
                    : "-"}
                </p>
                {selectedEvent.isPaidEvent ? (
                  <p>Monto por persona: {formatMoney(paymentAmount)}</p>
                ) : null}
              </div>
            </div>

          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <Input
            value={registrationSearch}
            onChange={(event) => setRegistrationSearch(event.target.value)}
            placeholder="Buscar por nombre, correo o contacto"
            aria-label="Buscar registros por nombre, correo o contacto"
          />
          <Select
            value={paymentStatusFilter}
            onValueChange={setPaymentStatusFilter}
          >
            <SelectTrigger aria-label="Filtrar registros por estado de pago">
              <SelectValue placeholder="Todos los pagos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allPaymentStatusesValue}>Todos los pagos</SelectItem>
              <SelectItem value="paid">Pagados</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="not_required">No requieren</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table
          className="min-w-[960px]"
          containerClassName="max-h-72 rounded-lg border bg-background"
        >
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Pagado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No hay registros para mostrar
                </TableCell>
              </TableRow>
            ) : (
              filteredRegistrations.map((registration) => (
                <TableRow key={registration._id}>
                  <TableCell>
                    {getEventName(eventsById.get(registration.eventId) || {
                      _id: registration.eventId,
                    })}
                  </TableCell>
                  <TableCell>{registration.name || "-"}</TableCell>
                  <TableCell>{registration.email || "-"}</TableCell>
                  <TableCell>{registration.contact || "-"}</TableCell>
                  <TableCell>
                    {formatPaymentStatus(registration.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    {formatPaymentMethod(registration.paymentMethod)}
                  </TableCell>
                  <TableCell>
                    {typeof getRegistrationAmount(registration) === "number"
                      ? formatMoney(getRegistrationAmount(registration) as number)
                      : "-"}
                  </TableCell>
                  <TableCell>{formatDate(registration.createdAt)}</TableCell>
                  <TableCell>{formatDate(registration.paidAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
