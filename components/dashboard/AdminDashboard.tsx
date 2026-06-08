// components/dashboard/AdminDashboard.tsx
import { Sparkles, Target, Users } from "lucide-react"
import StatsCard from "./StatsCard"
import EventList from "./EventList"
import ActivityFeed from "./ActivityFeed"
import type { DashboardData } from "./types"
import {
  TypographyH1,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography"

type Props = {
  data: DashboardData
}


export default function AdminDashboard({ data }: Props) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="theme-surface rounded-2xl border p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">

            </p>
            <TypographyH1 className="text-left text-2xl text-[var(--theme-card-foreground)] sm:text-4xl">
              Dashboard General
            </TypographyH1>
            <TypographyP className="max-w-2xl text-base text-[var(--theme-card-muted)] sm:text-xl">
              Bienvenido a tu panel de administración.
            </TypographyP>
          </div>
          <div className="rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-sm">
            <TypographySmall className="block text-primary-foreground/80">
              Asistencia promedio
            </TypographySmall>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{data.attendance}%</p>
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
