// components/dashboard/LeaderDashboard.tsx
import { TrendingUp, UserRoundCheck, UsersRound } from "lucide-react"
import StatsCard from "./StatsCard"
import EventList from "./EventList"
import type { DashboardData } from "./types"
import { TypographyH1, TypographyP } from "@/components/ui/typography"

type Props = {
  data: DashboardData
}

export default function LeaderDashboard({ data }: Props) {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border bg-white p-6 shadow-xl sm:p-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          <UserRoundCheck className="h-4 w-4" />
          Liderazgo
        </p>
        <TypographyH1 className="text-left text-slate-900">
          Mi Grupo
        </TypographyH1>
        <TypographyP className="max-w-2xl text-slate-600">
          Administra tu grupo y sus miembros.
        </TypographyP>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StatsCard title="Miembros en mi grupo" value={data.groupMembers} icon={UsersRound} />
        <StatsCard title="Asistencia promedio" value={`${data.attendance}%`} icon={TrendingUp} />
      </div>

      <EventList events={data.events} />
    </div>
  )
}
