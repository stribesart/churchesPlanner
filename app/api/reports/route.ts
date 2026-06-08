import { NextResponse } from "next/server"
import React from "react"
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer"
import { ObjectId, type Db } from "mongodb"

import { getCurrentTenantUser, getTenantDbByName } from "@/lib/tenant"
import { enrichInventoryItems } from "@/app/api/inventory/helpers"

type ReportType = "users" | "offerings" | "event-registrations" | "inventory"
type ReportFormat = "csv" | "pdf"
type ReportCell = string | number
type ReportData = {
  title: string
  description: string
  generatedBy: string
  generatedAt: string
  fileName: string
  summary: [string, ReportCell][]
  columns: string[]
  rows: ReportCell[][]
}

const reportTypes = [
  "users",
  "offerings",
  "event-registrations",
  "inventory",
] as const
const reportFormats = ["csv", "pdf"] as const
const allEventsValue = "all"
const allPaymentStatusesValue = "all"

const conditionLabels: Record<string, string> = {
  new: "Nuevo",
  good: "Bueno",
  regular: "Regular",
  damaged: "Dañado",
}

const inventoryStatusLabels: Record<string, string> = {
  available: "Disponible",
  in_use: "En uso",
  maintenance: "Mantenimiento",
  lost: "Perdido",
  retired: "Dado de baja",
}

function canGenerateReports(role: unknown) {
  if (typeof role !== "string") return false

  const normalizedRole = role
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  return ["administrador", "admin", "pastor"].includes(normalizedRole)
}

function getUserDisplayName(user: Record<string, unknown>) {
  const fields = ["name", "realName", "displayName", "email"]

  for (const field of fields) {
    const value = user[field]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return "Usuario"
}

function parseReportType(value: string | null): ReportType | null {
  return reportTypes.includes(value as ReportType) ? (value as ReportType) : null
}

function parseReportFormat(value: string | null): ReportFormat | null {
  return reportFormats.includes(value as ReportFormat)
    ? (value as ReportFormat)
    : null
}

function getRangeDays(value: string | null) {
  if (value === "7d") return 7
  if (value === "30d") return 30

  return 90
}

function getRangeLabel(value: string | null) {
  if (value === "7d") return "Últimos 7 días"
  if (value === "30d") return "Últimos 30 días"

  return "Últimos 3 meses"
}

function getRangeStartDate(value: string | null) {
  const rangeDays = getRangeDays(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (rangeDays - 1))

  return startDate
}

function getDateValue(value: unknown) {
  if (value instanceof Date) return value
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value)

    return Number.isNaN(date.getTime()) ? null : date
  }

  return null
}

function formatDate(value: unknown) {
  const date = getDateValue(value)

  return date ? date.toISOString().slice(0, 10) : ""
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function matchesRange(value: unknown, range: string | null) {
  const date = getDateValue(value)

  if (!date) return false

  date.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return date >= getRangeStartDate(range) && date <= today
}

function formatCsvValue(value: ReportCell | null | undefined) {
  const rawValue = value === null || value === undefined ? "" : String(value)
  const escapedValue = rawValue.replace(/"/g, '""')

  return /[",\n\r]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue
}

function buildCsv(report: ReportData) {
  const rows: (ReportCell | null | undefined)[][] = [
    [report.title],
    [report.description],
    ["Generado por", report.generatedBy],
    ["Fecha de generación", report.generatedAt],
    [],
    ...report.summary,
    [],
    report.columns,
    ...report.rows,
  ]

  return rows.map((row) => row.map(formatCsvValue).join(",")).join("\n")
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingRight: 28,
    paddingBottom: 36,
    paddingLeft: 28,
    backgroundColor: "#f8fafc",
    color: "#111827",
    fontFamily: "Helvetica",
    fontSize: 8,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  titleGroup: {
    flexGrow: 1,
    flexBasis: 0,
  },
  eyebrow: {
    color: "#2563eb",
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 19,
    fontWeight: 700,
    marginBottom: 5,
  },
  description: {
    color: "#4b5563",
    fontSize: 9,
    lineHeight: 1.35,
  },
  generatedBox: {
    width: 190,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    padding: 9,
  },
  generatedLabel: {
    color: "#1d4ed8",
    fontSize: 7,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  generatedValue: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 6,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  summaryItem: {
    minWidth: 125,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    borderRadius: 6,
    padding: 8,
  },
  summaryLabel: {
    color: "#6b7280",
    fontSize: 7,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 700,
  },
  table: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 24,
  },
  tableHeaderRow: {
    backgroundColor: "#111827",
  },
  tableCell: {
    flexGrow: 1,
    flexBasis: 0,
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    color: "#111827",
    lineHeight: 1.25,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 7,
    textTransform: "uppercase",
  },
  stripedRow: {
    backgroundColor: "#f9fafb",
  },
  emptyState: {
    padding: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 18,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#6b7280",
    fontSize: 7,
  },
})

function ReportPdfDocument({ report }: { report: ReportData }) {
  const tableRows = report.rows.length > 0 ? report.rows : [["Sin datos para mostrar"]]

  return React.createElement(
    Document,
    {
      title: report.title,
      author: report.generatedBy,
      subject: report.description,
      creator: "Churches Planner",
    },
    React.createElement(
      Page,
      { size: "A4", orientation: "landscape", style: pdfStyles.page, wrap: true },
      React.createElement(
        View,
        { style: pdfStyles.header, fixed: true },
        React.createElement(
          View,
          { style: pdfStyles.titleGroup },
          React.createElement(Text, { style: pdfStyles.eyebrow }, "Reporte del sistema"),
          React.createElement(Text, { style: pdfStyles.title }, report.title),
          React.createElement(Text, { style: pdfStyles.description }, report.description)
        ),
        React.createElement(
          View,
          { style: pdfStyles.generatedBox },
          React.createElement(Text, { style: pdfStyles.generatedLabel }, "Generado por"),
          React.createElement(Text, { style: pdfStyles.generatedValue }, report.generatedBy),
          React.createElement(Text, { style: pdfStyles.generatedLabel }, "Fecha"),
          React.createElement(Text, { style: pdfStyles.generatedValue }, report.generatedAt)
        )
      ),
      React.createElement(
        View,
        { style: pdfStyles.summaryGrid },
        report.summary.map(([label, value]) =>
          React.createElement(
            View,
            { key: label, style: pdfStyles.summaryItem },
            React.createElement(Text, { style: pdfStyles.summaryLabel }, label),
            React.createElement(Text, { style: pdfStyles.summaryValue }, String(value))
          )
        )
      ),
      React.createElement(
        View,
        { style: pdfStyles.table },
        React.createElement(
          View,
          { style: [pdfStyles.tableRow, pdfStyles.tableHeaderRow], fixed: true },
          report.columns.map((column) =>
            React.createElement(
              Text,
              { key: column, style: [pdfStyles.tableCell, pdfStyles.tableHeaderCell] },
              column
            )
          )
        ),
        tableRows.map((row, rowIndex) =>
          React.createElement(
            View,
            {
              key: `${rowIndex}-${row.join("-")}`,
              style:
                rowIndex % 2 === 1
                  ? [pdfStyles.tableRow, pdfStyles.stripedRow]
                  : pdfStyles.tableRow,
              wrap: false,
            },
            report.rows.length > 0
              ? report.columns.map((column, columnIndex) =>
                  React.createElement(
                    Text,
                    {
                      key: `${column}-${columnIndex}`,
                      style: pdfStyles.tableCell,
                    },
                    String(row[columnIndex] ?? "")
                  )
                )
              : React.createElement(Text, { style: pdfStyles.emptyState }, row[0])
          )
        )
      ),
      React.createElement(
        View,
        { style: pdfStyles.footer, fixed: true },
        React.createElement(Text, null, `Generado por ${report.generatedBy}`),
        React.createElement(Text, {
          render: ({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`,
        })
      )
    )
  )
}

async function buildPdf(report: ReportData) {
  const document = ReportPdfDocument({ report }) as Parameters<
    typeof renderToBuffer
  >[0]

  return renderToBuffer(document)
}

async function buildUsersReport(
  db: Db,
  searchParams: URLSearchParams,
  generatedBy: string,
  generatedAt: string
): Promise<ReportData> {
  const range = searchParams.get("range")
  const search = getString(searchParams.get("search")).toLowerCase()
  const age = getString(searchParams.get("age"))
  const users = await db.collection("users").find().sort({ createdAt: -1 }).toArray()
  const rows = users
    .filter((user) => matchesRange(user.createdAt, range))
    .filter((user) => {
      const name = getUserDisplayName(user).toLowerCase()
      const userAge = user.age === undefined || user.age === null ? "" : String(user.age)

      return (!search || name.includes(search)) && (!age || userAge === age)
    })
    .map((user) => [
      getUserDisplayName(user),
      user.age === undefined || user.age === null ? "" : String(user.age),
      formatDate(user.createdAt),
    ])

  return {
    title: "Reporte de Usuarios creados",
    description:
      "El actual reporte muestra como parte de los datos la cantidad de usuarios creados dentro del rango seleccionado.",
    generatedBy,
    generatedAt,
    fileName: `reporte-usuarios-${generatedAt}`,
    summary: [
      ["Rango", getRangeLabel(range)],
      ["Total de usuarios", rows.length],
    ],
    columns: ["Nombre", "Edad", "Fecha de unión"],
    rows,
  }
}

async function buildOfferingsReport(
  db: Db,
  searchParams: URLSearchParams,
  generatedBy: string,
  generatedAt: string
): Promise<ReportData> {
  const range = searchParams.get("range")
  const minAmount = getString(searchParams.get("minAmount"))
  const maxAmount = getString(searchParams.get("maxAmount"))
  const min = minAmount ? Number(minAmount) : null
  const max = maxAmount ? Number(maxAmount) : null
  const offerings = await db
    .collection("offerings")
    .find()
    .sort({ createdAt: -1 })
    .toArray()
  const filteredOfferings = offerings
    .filter((offering) => matchesRange(offering.createdAt, range))
    .filter((offering) => {
      const amount = getNumber(offering.amount)

      return (
        (min === null || Number.isNaN(min) || amount >= min) &&
        (max === null || Number.isNaN(max) || amount <= max)
      )
    })
  const rows = filteredOfferings.map((offering) => [
    formatDate(offering.createdAt),
    getNumber(offering.amount),
    getString(offering.currency) || "MXN",
  ])
  const totalAmount = filteredOfferings.reduce(
    (total, offering) => total + getNumber(offering.amount),
    0
  )

  return {
    title: "Reporte de Ofrendas registradas",
    description:
      "El actual reporte muestra como parte de los datos los montos registrados como ofrendas dentro del rango seleccionado.",
    generatedBy,
    generatedAt,
    fileName: `reporte-ofrendas-${generatedAt}`,
    summary: [
      ["Rango", getRangeLabel(range)],
      ["Total de registros", rows.length],
      ["Total acumulado", totalAmount],
    ],
    columns: ["Fecha", "Monto", "Moneda"],
    rows,
  }
}

async function buildEventRegistrationsReport(
  db: Db,
  searchParams: URLSearchParams,
  generatedBy: string,
  generatedAt: string
): Promise<ReportData> {
  const eventId = getString(searchParams.get("eventId"))
  const search = getString(searchParams.get("search")).toLowerCase()
  const paymentStatus = getString(searchParams.get("paymentStatus")) || allPaymentStatusesValue
  const registrations = await db
    .collection("eventRegistrations")
    .find({
      ...(eventId && eventId !== allEventsValue ? { eventId } : {}),
    })
    .sort({ createdAt: -1 })
    .toArray()
  const eventIds = Array.from(
    new Set(
      registrations
        .map((registration) => registration.eventId)
        .filter((value): value is string => typeof value === "string" && ObjectId.isValid(value))
    )
  )
  const events =
    eventIds.length > 0
      ? await db
          .collection("events")
          .find({ _id: { $in: eventIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : []
  const eventsById = new Map(events.map((event) => [event._id.toString(), event]))
  const filteredRegistrations = registrations.filter((registration) => {
    const values = [registration.name, registration.email, registration.contact]
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.toLowerCase())
    const matchesSearch = !search || values.some((value) => value.includes(search))
    const isPending =
      registration.paymentStatus === "pending" || registration.paymentPending === true
    const matchesPaymentStatus =
      paymentStatus === allPaymentStatusesValue ||
      (paymentStatus === "pending"
        ? isPending
        : registration.paymentStatus === paymentStatus)

    return matchesSearch && matchesPaymentStatus
  })
  const rows = filteredRegistrations.map((registration) => {
    const event = eventsById.get(getString(registration.eventId))

    return [
      getString(event?.name) || "Evento",
      getString(registration.name),
      getString(registration.email),
      getString(registration.contact),
      formatPaymentStatus(getString(registration.paymentStatus)),
      formatEventPaymentMethod(getString(registration.paymentMethod)),
      registration.paymentAmount === null || registration.paymentAmount === undefined
        ? ""
        : getNumber(registration.paymentAmount),
      formatDate(registration.createdAt),
      formatDate(registration.paidAt),
    ]
  })
  const paid = filteredRegistrations.filter(
    (registration) => registration.paymentStatus === "paid"
  )
  const pending = filteredRegistrations.filter(
    (registration) =>
      registration.paymentStatus === "pending" || registration.paymentPending === true
  )
  const notRequired = filteredRegistrations.filter(
    (registration) => registration.paymentStatus === "not_required"
  )

  return {
    title: "Reporte de Registros de eventos",
    description:
      "El actual reporte muestra como parte de los datos los asistentes registrados a eventos y su información de contacto y pago.",
    generatedBy,
    generatedAt,
    fileName: `reporte-registros-eventos-${generatedAt}`,
    summary: [
      ["Evento", eventId && eventId !== allEventsValue ? eventId : "Todos los eventos"],
      ["Total de registros", rows.length],
      ["Pagados", paid.length],
      ["Pendientes", pending.length],
      ["No requieren pago", notRequired.length],
      ["Total recaudado", paid.reduce((total, item) => total + getNumber(item.paymentAmount), 0)],
      ["Total pendiente", pending.reduce((total, item) => total + getNumber(item.paymentAmount), 0)],
    ],
    columns: [
      "Evento",
      "Nombre",
      "Correo",
      "Contacto",
      "Estado de pago",
      "Método de pago",
      "Monto MXN",
      "Fecha de registro",
      "Fecha de pago",
    ],
    rows,
  }
}

function formatPaymentStatus(value: string) {
  if (value === "paid") return "Pagado"
  if (value === "pending") return "Pendiente"
  if (value === "not_required") return "No requiere"

  return value || ""
}

function formatEventPaymentMethod(value: string) {
  if (value === "card") return "Tarjeta"
  if (value === "transfer") return "Transferencia"

  return value || ""
}

async function buildInventoryReport(
  db: Db,
  searchParams: URLSearchParams,
  generatedBy: string,
  generatedAt: string
): Promise<ReportData> {
  const search = getString(searchParams.get("search")).toLowerCase()
  const serialNumber = getString(searchParams.get("serialNumber")).toLowerCase()
  const ministryId = getString(searchParams.get("ministryId"))
  const condition = getString(searchParams.get("condition"))
  const status = getString(searchParams.get("status"))
  const items = await db
    .collection("inventory")
    .find()
    .sort({ createdAt: -1 })
    .toArray()
  const enrichedItems = await enrichInventoryItems(db, items)
  const filteredItems = enrichedItems.filter((item) => {
    const matchesSearch =
      !search ||
      [item.name, item.location, item.ministryName, item.assignedToName]
        .filter((value): value is string => typeof value === "string")
        .some((value) => value.toLowerCase().includes(search))
    const matchesSerialNumber =
      !serialNumber ||
      getString(item.serialNumber).toLowerCase().includes(serialNumber)
    const matchesMinistry =
      !ministryId ||
      (ministryId === "general"
        ? !item.ministryId
        : getString(item.ministryId) === ministryId)
    const matchesCondition = !condition || item.condition === condition
    const matchesStatus = !status || item.status === status

    return matchesSearch && matchesSerialNumber && matchesMinistry && matchesCondition && matchesStatus
  })
  const rows = filteredItems.map((item) => [
    getString(item.name),
    getString(item.serialNumber),
    getNumber(item.quantity),
    conditionLabels[getString(item.condition)] || getString(item.condition),
    inventoryStatusLabels[getString(item.status)] || getString(item.status),
    getString(item.location),
    getString(item.ministryName) || "General",
    getString(item.assignedToName),
    formatDate(item.createdAt),
  ])
  const totalQuantity = filteredItems.reduce(
    (total, item) => total + getNumber(item.quantity),
    0
  )

  return {
    title: "Reporte de Inventario",
    description:
      "El actual reporte muestra como parte de los datos la lista de artículos registrados en el inventario del sistema.",
    generatedBy,
    generatedAt,
    fileName: `reporte-inventario-${generatedAt}`,
    summary: [
      ["Total de artículos", rows.length],
      ["Cantidad total", totalQuantity],
    ],
    columns: [
      "Artículo",
      "Serie",
      "Cantidad",
      "Condición",
      "Estado",
      "Ubicación",
      "Ministerio",
      "Responsable",
      "Fecha de registro",
    ],
    rows,
  }
}

async function buildReport(
  type: ReportType,
  db: Db,
  searchParams: URLSearchParams,
  generatedBy: string,
  generatedAt: string
) {
  if (type === "users") {
    return buildUsersReport(db, searchParams, generatedBy, generatedAt)
  }

  if (type === "offerings") {
    return buildOfferingsReport(db, searchParams, generatedBy, generatedAt)
  }

  if (type === "event-registrations") {
    return buildEventRegistrationsReport(db, searchParams, generatedBy, generatedAt)
  }

  return buildInventoryReport(db, searchParams, generatedBy, generatedAt)
}

export async function GET(req: Request) {
  const currentUser = await getCurrentTenantUser(req)

  if (!currentUser) {
    return NextResponse.json({ message: "Acceso denegado" }, { status: 401 })
  }

  if (!canGenerateReports(currentUser.user.role)) {
    return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = parseReportType(searchParams.get("type"))
  const format = parseReportFormat(searchParams.get("format")) || "csv"

  if (!type) {
    return NextResponse.json(
      { message: "Selecciona un tipo de reporte válido" },
      { status: 400 }
    )
  }

  const db = await getTenantDbByName(currentUser.tenantDbName)
  const generatedAt = new Date().toISOString().slice(0, 10)
  const generatedBy = getUserDisplayName(currentUser.user)
  const report = await buildReport(type, db, searchParams, generatedBy, generatedAt)
  const safeFileName = sanitizeFileName(report.fileName)

  if (format === "pdf") {
    const pdf = await buildPdf(report)

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}.pdf"`,
      },
    })
  }

  const csv = buildCsv(report)

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFileName}.csv"`,
    },
  })
}
