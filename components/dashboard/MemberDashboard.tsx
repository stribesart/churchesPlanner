// components/dashboard/MemberDashboard.tsx
import { Megaphone, UsersRound } from "lucide-react"
import EventList from "./EventList"
import AnnouncementsList from "./AnnouncementsList"
import type { DashboardData } from "./types"

type Props = {
  data: DashboardData
}

export default function MemberDashboard({ data }: Props) {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border bg-white p-6 shadow-xl sm:p-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          <Megaphone className="h-4 w-4" />
          Comunidad
        </p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
          Bienvenido
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Tu información y anuncios importantes.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-blue-700">Tu Grupo</p>
            <p className="text-2xl font-bold text-slate-900">{data.groupName}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <UsersRound className="h-6 w-6" />
          </div>
        </div>
      </div>

      <AnnouncementsList announcements={data.announcements || []} />
      <EventList events={data.events} />
    </div>
  )
}
