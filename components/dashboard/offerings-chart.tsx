"use client"

import * as React from "react"
import { Download, FileText } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
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
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Offering = {
  _id: string
  amount: number
  currency?: string
  createdAt?: string
}

type Props = {
  offerings: Offering[]
}

type ChartPoint = {
  date: string
  amount: number
}

const chartConfig = {
  amount: {
    label: "Ofrendas",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0]
}

function getRangeDays(timeRange: string) {
  if (timeRange === "7d") return 7
  if (timeRange === "30d") return 30

  return 90
}

function getRangeLabel(timeRange: string) {
  if (timeRange === "7d") return "Últimos 7 días"
  if (timeRange === "30d") return "Últimos 30 días"

  return "Últimos 3 meses"
}

function getRangeStartDate(timeRange: string) {
  const rangeDays = getRangeDays(timeRange)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (rangeDays - 1))

  return startDate
}

function formatMoney(amount: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(amount)
}

function formatDisplayDate(value?: string) {
  if (!value) return "-"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getOfferingsInRange(offerings: Offering[], timeRange: string) {
  const startDate = getRangeStartDate(timeRange)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return offerings
    .filter((offering) => {
      if (!offering.createdAt) return false

      const createdAt = new Date(offering.createdAt)

      if (Number.isNaN(createdAt.getTime())) return false

      createdAt.setHours(0, 0, 0, 0)

      return createdAt >= startDate && createdAt <= today
    })
    .sort((firstOffering, secondOffering) => {
      const firstDate = firstOffering.createdAt
        ? new Date(firstOffering.createdAt).getTime()
        : 0
      const secondDate = secondOffering.createdAt
        ? new Date(secondOffering.createdAt).getTime()
        : 0

      return secondDate - firstDate
    })
}

function filterOfferings(offerings: Offering[], minAmount: string, maxAmount: string) {
  const min = minAmount.trim() ? Number(minAmount) : null
  const max = maxAmount.trim() ? Number(maxAmount) : null

  return offerings.filter((offering) => {
    const matchesMin =
      min === null || Number.isNaN(min) || offering.amount >= min
    const matchesMax =
      max === null || Number.isNaN(max) || offering.amount <= max

    return matchesMin && matchesMax
  })
}

function buildOfferingsData(
  offerings: Offering[],
  timeRange: string
): ChartPoint[] {
  const rangeDays = getRangeDays(timeRange)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (rangeDays - 1))

  const amountsByDate = new Map<string, number>()

  for (let index = 0; index < rangeDays; index += 1) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    amountsByDate.set(formatDateKey(date), 0)
  }

  offerings.forEach((offering) => {
    if (!offering.createdAt) return

    const createdAt = new Date(offering.createdAt)

    if (Number.isNaN(createdAt.getTime())) return

    createdAt.setHours(0, 0, 0, 0)

    if (createdAt < startDate || createdAt > today) return

    const key = formatDateKey(createdAt)
    amountsByDate.set(key, (amountsByDate.get(key) || 0) + offering.amount)
  })

  return Array.from(amountsByDate.entries()).map(([date, amount]) => ({
    date,
    amount,
  }))
}

export function OfferingsChart({ offerings }: Props) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [minAmount, setMinAmount] = React.useState("")
  const [maxAmount, setMaxAmount] = React.useState("")
  const [downloadingFormat, setDownloadingFormat] =
    React.useState<"csv" | "pdf" | null>(null)
  const [downloadError, setDownloadError] = React.useState("")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const chartData = React.useMemo(
    () => buildOfferingsData(offerings, timeRange),
    [offerings, timeRange]
  )
  const offeringsInRange = React.useMemo(
    () => getOfferingsInRange(offerings, timeRange),
    [offerings, timeRange]
  )
  const filteredOfferings = React.useMemo(
    () => filterOfferings(offeringsInRange, minAmount, maxAmount),
    [maxAmount, minAmount, offeringsInRange]
  )
  const totalAmountInRange = chartData.reduce(
    (total, item) => total + item.amount,
    0
  )
  async function handleDownload(format: "csv" | "pdf") {
    const params = new URLSearchParams({
      type: "offerings",
      format,
      range: timeRange,
    })

    if (minAmount.trim()) params.set("minAmount", minAmount.trim())
    if (maxAmount.trim()) params.set("maxAmount", maxAmount.trim())

    setDownloadingFormat(format)
    setDownloadError("")

    try {
      await downloadReport(
        `/api/reports?${params.toString()}`,
        `reporte-ofrendas.${format}`
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
        <CardTitle>Ofrendas registradas</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Entradas financieras en el rango seleccionado
          </span>
          <span className="@[540px]/card:hidden">Ofrendas por fecha</span>
        </CardDescription>
        <CardAction className="static col-start-1 row-start-auto flex flex-col gap-2 justify-self-start @[767px]/card:col-start-2 @[767px]/card:row-start-1 @[767px]/card:items-end @[767px]/card:justify-self-end">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => {
              if (value) setTimeRange(value)
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 días</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 días</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Seleccionar rango"
            >
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 días
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 días
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filteredOfferings.length === 0 || downloadingFormat !== null}
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
            disabled={filteredOfferings.length === 0 || downloadingFormat !== null}
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
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] min-w-0 w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillOfferings" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-amount)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-amount)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("es-MX", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("es-MX", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="amount"
              type="natural"
              fill="url(#fillOfferings)"
              stroke="var(--color-amount)"
            />
          </AreaChart>
        </ChartContainer>
        <p className="text-sm text-muted-foreground">
          {formatMoney(totalAmountInRange)} registrados en {getRangeLabel(timeRange).toLowerCase()}.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={minAmount}
            onChange={(event) => setMinAmount(event.target.value)}
            placeholder="Monto mínimo"
            aria-label="Filtrar ofrendas por monto mínimo"
            inputMode="decimal"
          />
          <Input
            value={maxAmount}
            onChange={(event) => setMaxAmount(event.target.value)}
            placeholder="Monto máximo"
            aria-label="Filtrar ofrendas por monto máximo"
            inputMode="decimal"
          />
        </div>
        <Table
          className="min-w-[480px]"
          containerClassName="max-h-72 rounded-lg border bg-background"
        >
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Moneda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOfferings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No hay ofrendas en este rango
                </TableCell>
              </TableRow>
            ) : (
              filteredOfferings.map((offering) => (
                <TableRow key={offering._id}>
                  <TableCell>{formatDisplayDate(offering.createdAt)}</TableCell>
                  <TableCell>
                    {formatMoney(offering.amount, offering.currency || "MXN")}
                  </TableCell>
                  <TableCell>{offering.currency || "MXN"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
