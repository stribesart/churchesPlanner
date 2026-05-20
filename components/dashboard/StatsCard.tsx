// components/dashboard/StatsCard.tsx
import { BarChart3 } from "lucide-react"
import type { StatsCardProps } from "./types"

export default function StatsCard({ title, value, icon: Icon = BarChart3 }: StatsCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-700">{title}</p>
          <h2 className="text-3xl font-bold text-slate-900">{value}</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-5 h-1 w-12 rounded-full bg-blue-700"></div>
    </div>
  )
}
