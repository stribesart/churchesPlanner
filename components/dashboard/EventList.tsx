// components/dashboard/EventList.tsx
import { CalendarDays } from "lucide-react"
import type { DashboardEvent } from "./types"

type Props = {
  events: DashboardEvent[]
}

export default function EventList({ events }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h2 className="mb-1 text-xl font-bold text-slate-900">Próximos Eventos</h2>
          <p className="text-sm text-slate-600">Actividades programadas</p>
        </div>
      </div>

      {events?.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 py-8 text-center">
          <p className="text-slate-600">No hay eventos próximos</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-slate-100 p-4 transition-colors hover:border-blue-100 hover:bg-blue-50"
            >
              <p className="font-semibold text-slate-900">{event.title}</p>
              <p className="mt-1 text-sm font-medium text-blue-700">{event.date}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
