// components/dashboard/AnnouncementsList.tsx
import { Megaphone } from "lucide-react"
import type { DashboardAnnouncement } from "./types"

type Props = {
  announcements: DashboardAnnouncement[]
}

export default function AnnouncementsList({ announcements }: Props) {
  return (
    <div className="theme-surface rounded-2xl border p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <div className="theme-surface-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-primary">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="mb-1 text-xl font-bold text-[var(--theme-card-foreground)]">Anuncios</h2>
          <p className="text-sm text-[var(--theme-card-muted)]">Noticias e información importante</p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="theme-surface-muted rounded-2xl border py-8 text-center">
          <p>No hay anuncios disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div 
              key={announcement._id} 
              className="theme-surface-muted rounded-xl border p-4 transition-colors hover:brightness-95"
            >
              <h3 className="break-words font-semibold">{announcement.title}</h3>
              <p className="mt-2 break-words text-sm">{announcement.content}</p>
              <p className="mt-3 break-words text-xs font-medium text-primary">
                Por: {announcement.authorName || "Sistema"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
