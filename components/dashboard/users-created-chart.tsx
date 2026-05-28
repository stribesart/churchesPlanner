"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
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

type User = {
  _id: string
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

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const chartData = React.useMemo(
    () => buildUsersCreatedData(users, timeRange),
    [users, timeRange]
  )
  const totalUsersInRange = chartData.reduce(
    (total, item) => total + item.users,
    0
  )

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
        <CardAction className="static col-start-1 row-start-auto justify-self-start @[767px]/card:col-start-2 @[767px]/card:row-start-1 @[767px]/card:justify-self-end">
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
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
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
        <p className="mt-4 text-sm text-muted-foreground">
          {totalUsersInRange} usuarios creados en el rango seleccionado.
        </p>
      </CardContent>
    </Card>
  )
}
