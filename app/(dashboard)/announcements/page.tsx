"use client"

import { useEffect, useState } from "react"
import AnnouncementModal from "@/components/announcements/announcement-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TypographyH1 } from "@/components/ui/typography"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Pencil, Trash2 } from "lucide-react"

type Announcement = {
  _id: string
  title: string
  content: string
  author: string
  createdAt?: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [open, setOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [filterTitle, setFilterTitle] = useState("")
  const [filterDate, setFilterDate] = useState("")

  async function fetchAnnouncements() {
    const res = await fetch("/api/announcements")
    const data = await res.json()
    setAnnouncements(data)
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesTitle = announcement.title
      .toLowerCase()
      .includes(filterTitle.toLowerCase())

    if (!filterDate) {
      return matchesTitle
    }

    if (!announcement.createdAt) {
      return false
    }

    const announcementDate = new Date(announcement.createdAt)
    const filterDateObj = new Date(filterDate)

    if (Number.isNaN(announcementDate.getTime())) {
      return false
    }

    const announcementDateStr = announcementDate.toISOString().split("T")[0]
    const filterDateStr = filterDateObj.toISOString().split("T")[0]

    return matchesTitle && announcementDateStr === filterDateStr
  })

  async function handleDelete(id: string) {
    const res = await fetch(`/api/announcements/${id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      fetchAnnouncements()
    } else {
      alert("Error al eliminar")
    }
  }

  return (
    <div>
      <TypographyH1 className="mb-6 text-left">
        Anuncios
      </TypographyH1>

      <Button onClick={() => {
        setSelectedAnnouncement(null)
        setOpen(true)
      }}>
        + Nuevo anuncio
      </Button>

      <div className="bg-white rounded-lg border p-4 mt-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="filter-title">Filtrar por título</Label>
            <Input
              id="filter-title"
              placeholder="Buscar por nombre..."
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="filter-date">Filtrar por fecha</Label>
            <Input
              id="filter-date"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>
        {(filterTitle || filterDate) && (
          <Button
            variant="outline"
            onClick={() => {
              setFilterTitle("")
              setFilterDate("")
            }}
            className="mt-3"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Contenido</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredAnnouncements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  No hay anuncios que coincidan con los filtros
                </TableCell>
              </TableRow>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <TableRow key={announcement._id}>
                  <TableCell>{announcement.title}</TableCell>
                  <TableCell>{announcement.content}</TableCell>
                  <TableCell>{announcement.author}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setSelectedAnnouncement(announcement)
                                setOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Editar anuncio
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Eliminar anuncio?
                                  </AlertDialogTitle>
                                </AlertDialogHeader>

                                <p className="text-sm text-gray-500">
                                  Esta acción no se puede deshacer.
                                </p>

                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>

                                  <AlertDialogAction
                                    onClick={() => handleDelete(announcement._id)}
                                  >
                                    Sí, eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>

                          <TooltipContent>
                            Eliminar anuncio
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AnnouncementModal
        open={open}
        onOpenChange={setOpen}
        announcement={selectedAnnouncement}
        onSuccess={fetchAnnouncements}
      />
    </div>
  )
}
