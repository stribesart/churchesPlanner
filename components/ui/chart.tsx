"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    color?: string
  }
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
[data-chart=${id}] {
${colorConfig
  .map(([key, item]) => `  --color-${key}: ${item.color};`)
  .join("\n")}
}
`,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  label,
  labelFormatter,
}: React.ComponentProps<"div"> & {
    active?: boolean
    payload?: Array<{
      color?: string
      dataKey?: string | number
      name?: string | number
      value?: string | number
    }>
    label?: string | number
    labelFormatter?: (
      label: string | number,
      payload: NonNullable<
        React.ComponentProps<typeof ChartTooltipContent>["payload"]
      >
    ) => React.ReactNode
    indicator?: "line" | "dot" | "dashed"
  }) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "grid min-w-32 gap-1.5 rounded-lg border bg-background px-2.5 py-2 text-xs shadow-xl",
        className
      )}
    >
      {label ? (
        <div className="font-medium">
          {labelFormatter ? labelFormatter(label, payload) : label}
        </div>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = `${item.dataKey || item.name || "value"}`
          const itemConfig = config[key]

          return (
            <div
              key={key}
              className="flex w-full items-center gap-2 text-muted-foreground"
            >
              <span
                className={cn(
                  "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                  indicator === "dot" && "size-2.5",
                  indicator === "line" && "h-2.5 w-1",
                  indicator === "dashed" && "h-0 w-0 border-[1.5px] border-dashed bg-transparent"
                )}
                style={
                  {
                    "--color-bg": item.color,
                    "--color-border": item.color,
                  } as React.CSSProperties
                }
              />
              <div className="flex flex-1 justify-between gap-3">
                <span>{itemConfig?.label || item.name}</span>
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {typeof item.value === "number"
                    ? item.value.toLocaleString()
                    : item.value}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }
