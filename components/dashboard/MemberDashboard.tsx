// components/dashboard/MemberDashboard.tsx
import { Megaphone, UsersRound } from "lucide-react"
import EventList from "./EventList"
import AnnouncementsList from "./AnnouncementsList"
import type { DashboardData } from "./types"
import {
  TypographyH1,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography"

type Props = {
  data: DashboardData
}

export default function MemberDashboard({ data }: Props) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="theme-surface rounded-2xl border p-5 shadow-sm sm:p-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Megaphone className="h-4 w-4" />
          Comunidad
        </p>
        <TypographyH1 className="text-left text-2xl text-[var(--theme-card-foreground)] sm:text-4xl">
          Bienvenido
        </TypographyH1>
        <TypographyP className="max-w-2xl text-base text-[var(--theme-card-muted)] sm:text-xl">
          Tu información y anuncios importantes.
        </TypographyP>
      </div>

      <div className="theme-surface rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <TypographySmall className="mb-1 block text-primary">
              Tu Grupo
            </TypographySmall>
            <p className="break-words text-xl font-bold text-[var(--theme-card-foreground)] sm:text-2xl">{data.groupName}</p>
          </div>
          <div className="theme-surface-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-primary">
            <UsersRound className="h-6 w-6" />
          </div>
        </div>
      </div>

      <AnnouncementsList announcements={data.announcements || []} />
      <EventList events={data.events} />
    </div>
  )
}
