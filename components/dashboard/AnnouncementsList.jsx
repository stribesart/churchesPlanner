// components/dashboard/AnnouncementsList.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnnouncementsList({ announcements }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anuncios</CardTitle>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <p className="text-gray-500">No hay anuncios disponibles.</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement._id} className="border-b pb-4 last:border-b-0">
                <h3 className="font-semibold">{announcement.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                <p className="text-xs text-gray-400 mt-2">Por: {announcement.author}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}