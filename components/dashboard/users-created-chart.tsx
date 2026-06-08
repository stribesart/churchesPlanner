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

type User = {
  _id: string
  name?: string
  displayName?: string
  email?: string
  age?: number | string
  createdAt?: string
}

type Props = {
  users: User[]
}

type ChartPoint = {
  date: string
  users: number
}

const chartConfig = {
  users: {
    label: "Usuarios",
    color: "var(--chart-2)",
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

function getUserName(user: User) {
  return user.displayName || user.name || user.email || "Usuario"
}

function getUserAge(user: User) {
  if (typeof user.age === "number" && Number.isFinite(user.age)) {
    return user.age
  }

  if (typeof user.age === "string" && user.age.trim()) {
    return user.age.trim()
  }

  return "-"
}

function getUsersInRange(users: User[], timeRange: string) {
  const startDate = getRangeStartDate(timeRange)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return users
    .filter((user) => {
      if (!user.createdAt) return false

      const createdAt = new Date(user.createdAt)

      if (Number.isNaN(createdAt.getTime())) return false

      createdAt.setHours(0, 0, 0, 0)

      return createdAt >= startDate && createdAt <= today
    })
    .sort((firstUser, secondUser) => {
      const firstDate = firstUser.createdAt
        ? new Date(firstUser.createdAt).getTime()
        : 0
      const secondDate = secondUser.createdAt
        ? new Date(secondUser.createdAt).getTime()
        : 0

      return secondDate - firstDate
    })
}

function filterUsers(users: User[], search: string, age: string) {
  const normalizedSearch = search.trim().toLowerCase()
  const normalizedAge = age.trim()

  return users.filter((user) => {
    const matchesSearch =
      !normalizedSearch ||
      getUserName(user).toLowerCase().includes(normalizedSearch)
    const userAge = getUserAge(user)
    const matchesAge = !normalizedAge || String(userAge) === normalizedAge

    return matchesSearch && matchesAge
  })
}

function buildUsersCreatedData(users: User[], timeRange: string): ChartPoint[] {
  const rangeDays = getRangeDays(timeRange)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (rangeDays - 1))

  const countsByDate = new Map<string, number>()

  for (let index = 0; index < rangeDays; index += 1) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    countsByDate.set(formatDateKey(date), 0)
  }

  users.forEach((user) => {
    if (!user.createdAt) return

    const createdAt = new Date(user.createdAt)

    if (Number.isNaN(createdAt.getTime())) return

    createdAt.setHours(0, 0, 0, 0)

    if (createdAt < startDate || createdAt > today) return

    const key = formatDateKey(createdAt)
    countsByDate.set(key, (countsByDate.get(key) || 0) + 1)
  })

  return Array.from(countsByDate.entries()).map(([date, count]) => ({
    date,
    users: count,
  }))
}

export function UsersCreatedChart({ users }: Props) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [search, setSearch] = React.useState("")
  const [ageFilter, setAgeFilter] = React.useState("")
  const [downloadingFormat, setDownloadingFormat] =
    React.useState<"csv" | "pdf" | null>(null)
  const [downloadError, setDownloadError] = React.useState("")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const chartData = React.useMemo(
    () => buildUsersCreatedData(users, timeRange),
    [users, timeRange]
  )
  const usersInRange = React.useMemo(
    () => getUsersInRange(users, timeRange),
    [users, timeRange]
  )
  const filteredUsers = React.useMemo(
    () => filterUsers(usersInRange, search, ageFilter),
    [ageFilter, search, usersInRange]
  )
  const totalUsersInRange = chartData.reduce(
    (total, item) => total + item.users,
    0
  )
  async function handleDownload(format: "csv" | "pdf") {
    const params = new URLSearchParams({
      type: "users",
      format,
      range: timeRange,
    })

    if (search.trim()) params.set("search", search.trim())
    if (ageFilter.trim()) params.set("age", ageFilter.trim())

    setDownloadingFormat(format)
    setDownloadError("")

    try {
      await downloadReport(
        `/api/reports?${params.toString()}`,
        `reporte-usuarios.${format}`
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
        <CardTitle>Usuarios creados</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Altas de usuarios en el rango seleccionado
          </span>
          <span className="@[540px]/card:hidden">Altas por fecha</span>
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
            disabled={filteredUsers.length === 0 || downloadingFormat !== null}
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
            disabled={filteredUsers.length === 0 || downloadingFormat !== null}
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
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-users)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-users)"
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
              dataKey="users"
              type="natural"
              fill="url(#fillUsers)"
              stroke="var(--color-users)"
            />
          </AreaChart>
        </ChartContainer>
        <p className="text-sm text-muted-foreground">
          {totalUsersInRange} usuarios creados en {getRangeLabel(timeRange).toLowerCase()}.
        </p>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre"
            aria-label="Buscar usuarios por nombre"
          />
          <Input
            value={ageFilter}
            onChange={(event) => setAgeFilter(event.target.value)}
            placeholder="Edad"
            aria-label="Filtrar usuarios por edad"
            inputMode="numeric"
          />
        </div>
        <Table
          className="min-w-[520px]"
          containerClassName="max-h-72 rounded-lg border bg-background"
        >
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Fecha de unión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No hay usuarios en este rango
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{getUserName(user)}</TableCell>
                  <TableCell>{getUserAge(user)}</TableCell>
                  <TableCell>{formatDisplayDate(user.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
