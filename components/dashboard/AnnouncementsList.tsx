// components/dashboard/AnnouncementsList.tsx
import { Megaphone } from "lucide-react"
import type { DashboardAnnouncement } from "./types"

type Props = {
  announcements: DashboardAnnouncement[]
}

export default function AnnouncementsList({ announcements }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="mb-1 text-xl font-bold text-slate-900">Anuncios</h2>
          <p className="text-sm text-slate-600">Noticias e información importante</p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 py-8 text-center">
          <p className="text-slate-600">No hay anuncios disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div 
              key={announcement._id} 
              className="rounded-xl border border-slate-100 p-4 transition-colors hover:border-blue-100 hover:bg-blue-50"
            >
              <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
              <p className="text-sm text-slate-700 mt-2">{announcement.content}</p>
              <p className="mt-3 text-xs font-medium text-blue-700">
                Por: {announcement.authorName || "Sistema"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
