// components/dashboard/AdminDashboard.tsx
import { CalendarDays, Sparkles, Target, Users } from "lucide-react"
import StatsCard from "./StatsCard"
import EventList from "./EventList"
import ActivityFeed from "./ActivityFeed"
import type { DashboardData } from "./types"

type Props = {
  data: DashboardData
}

export default function AdminDashboard({ data }: Props) {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border bg-white p-6 shadow-xl sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <CalendarDays className="h-4 w-4" />
              Panel administrativo
            </p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
              Dashboard General
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Bienvenido a tu panel de administración.
            </p>
          </div>
          <div className="rounded-2xl bg-blue-700 px-5 py-4 text-white shadow-sm">
            <p className="text-sm font-medium text-blue-100">Asistencia promedio</p>
            <p className="mt-1 text-3xl font-bold">{data.attendance}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Miembros Totales" value={data.totalMembers} icon={Users} />
        <StatsCard title="Nuevos este mes" value={data.newMembers} icon={Sparkles} />
        <StatsCard title="Líderes Activos" value={data.totalLeaders} icon={Target} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EventList events={data.events} />
        <ActivityFeed activities={data.activities} />
      </div>
    </div>
  )
}
