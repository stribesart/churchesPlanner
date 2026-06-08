// components/dashboard/EventList.tsx
import { CalendarDays } from "lucide-react"
import type { DashboardEvent } from "./types"

type Props = {
  events: DashboardEvent[]
}

export default function EventList({ events }: Props) {
  return (
    <div className="theme-surface rounded-2xl border p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <div className="theme-surface-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-primary">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h2 className="mb-1 text-xl font-bold text-[var(--theme-card-foreground)]">Próximos Eventos</h2>
          <p className="text-sm text-[var(--theme-card-muted)]">Actividades programadas</p>
        </div>
      </div>

      {events?.length === 0 ? (
        <div className="theme-surface-muted rounded-2xl border py-8 text-center">
          <p>No hay eventos próximos</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="theme-surface-muted rounded-xl border p-4 transition-colors hover:brightness-95"
            >
              <p className="font-semibold">{event.title}</p>
              <p className="mt-1 text-sm font-medium text-primary">{event.date}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
