// components/dashboard/ActivityFeed.tsx
import { ArrowRight, Bell } from "lucide-react"
import type { DashboardActivity } from "./types"

type Props = {
  activities: DashboardActivity[]
}

export default function ActivityFeed({ activities }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="mb-1 text-xl font-bold text-slate-900">Actividad Reciente</h2>
          <p className="text-sm text-slate-600">Últimas acciones en el sistema</p>
        </div>
      </div>

      {activities?.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 py-8 text-center">
          <p className="text-slate-600">Sin actividad reciente</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {activities.map((act, idx) => (
            <li key={act.id || idx} className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 transition-colors hover:border-blue-100 hover:bg-blue-50">
              <ArrowRight className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
              <span className="text-slate-700">{act.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
