// components/dashboard/StatsCard.tsx
import { BarChart3 } from "lucide-react"
import { TypographySmall } from "@/components/ui/typography"
import type { StatsCardProps } from "./types"

export default function StatsCard({ title, value, icon: Icon = BarChart3 }: StatsCardProps) {
  return (
    <div className="theme-surface rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <TypographySmall className="mb-1 block text-primary">
            {title}
          </TypographySmall>
          <h2 className="text-3xl font-bold text-[var(--theme-card-foreground)]">{value}</h2>
        </div>
        <div className="theme-surface-muted flex h-12 w-12 items-center justify-center rounded-2xl border text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-5 h-1 w-12 rounded-full bg-primary"></div>
    </div>
  )
}
