// components/dashboard/ActivityFeed.tsx
import { ArrowRight, Bell } from "lucide-react"
import type { DashboardActivity } from "./types"

type Props = {
  activities: DashboardActivity[]
}

export default function ActivityFeed({ activities }: Props) {
  return (
    <div className="theme-surface rounded-2xl border p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <div className="theme-surface-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="mb-1 text-xl font-bold text-[var(--theme-card-foreground)]">Actividad Reciente</h2>
          <p className="text-sm text-[var(--theme-card-muted)]">Últimas acciones en el sistema</p>
        </div>
      </div>

      {activities?.length === 0 ? (
        <div className="theme-surface-muted rounded-2xl border py-8 text-center">
          <p>Sin actividad reciente</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {activities.map((act, idx) => (
            <li key={act.id || idx} className="theme-surface-muted flex items-start gap-3 rounded-xl border p-4 transition-colors hover:brightness-95">
              <ArrowRight className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>{act.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
