"use client"

import { useEffect, useState } from "react"
import AnnouncementModal from "@/components/announcements/announcement-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmittingOverlay } from "@/components/ui/submitting-overlay"
import { TypographyH1 } from "@/components/ui/typography"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeletonRows,
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
import { Filter, Pencil, Trash2 } from "lucide-react"

type Announcement = {
  _id: string
  title: string
  content: string
  author: string
  date?: string
  registry?: {
    name: string
    email: string
  } | null
  authorName?: string
  createdAt?: string
}

type AnnouncementAuthor = {
  _id: string
  name?: string
  realName?: string
  displayName?: string
  email?: string
  role?: string
}

type CurrentUser = AnnouncementAuthor

function normalizeAuthorRole(role?: string) {
  const normalizedRole = (role || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  return normalizedRole === "administrador" ? "pastor" : normalizedRole
}

function isAnnouncementAuthor(user: AnnouncementAuthor) {
  return ["pastor", "admin", "lider"].includes(normalizeAuthorRole(user.role))
}

function mergeAuthors(users: AnnouncementAuthor[], currentUser?: AnnouncementAuthor | null) {
  const authorsById = new Map<string, AnnouncementAuthor>()

  users.forEach((user) => {
    if (isAnnouncementAuthor(user)) {
      authorsById.set(user._id, user)
    }
  })

  if (currentUser && isAnnouncementAuthor(currentUser)) {
    authorsById.set(currentUser._id, currentUser)
  }

  return Array.from(authorsById.values())
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [authors, setAuthors] = useState<AnnouncementAuthor[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [filterTitle, setFilterTitle] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function fetchAnnouncements() {
    const [announcementsRes, usersRes, meRes] = await Promise.all([
      fetch("/api/announcements"),
      fetch("/api/users"),
      fetch("/api/auth/me"),
    ])
    const announcementsData = await announcementsRes.json()
    const usersData = usersRes.ok ? await usersRes.json() : []
    const meData = meRes.ok ? await meRes.json() : null

    setAnnouncements(Array.isArray(announcementsData) ? announcementsData : [])
    setAuthors(
      mergeAuthors(
        Array.isArray(usersData) ? usersData : [],
        meData?.user || null
      )
    )
    setCurrentUser(meData?.user || null)
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetch("/api/announcements"),
      fetch("/api/users"),
      fetch("/api/auth/me"),
    ])
      .then(async ([announcementsRes, usersRes, meRes]) => {
        const announcementsData = await announcementsRes.json()
        const usersData = usersRes.ok ? await usersRes.json() : []
        const meData = meRes.ok ? await meRes.json() : null

        return { announcementsData, usersData, meData }
      })
      .then(({ announcementsData, usersData, meData }) => {
        if (isMounted) {
          setAnnouncements(Array.isArray(announcementsData) ? announcementsData : [])
          setAuthors(
            mergeAuthors(
              Array.isArray(usersData) ? usersData : [],
              meData?.user || null
            )
          )
          setCurrentUser(meData?.user || null)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesTitle = announcement.title
      .toLowerCase()
      .includes(filterTitle.toLowerCase())

    if (!filterDate) {
      return matchesTitle
    }

    const announcementDateValue = announcement.date || announcement.createdAt

    if (!announcementDateValue) {
      return false
    }

    const announcementDate = new Date(announcementDateValue)
    const filterDateObj = new Date(filterDate)

    if (Number.isNaN(announcementDate.getTime())) {
      return false
    }

    const announcementDateStr = announcementDate.toISOString().split("T")[0]
    const filterDateStr = filterDateObj.toISOString().split("T")[0]

    return matchesTitle && announcementDateStr === filterDateStr
  })
  const hasFiltersToClear = Boolean(filterTitle) || Boolean(filterDate)

  async function handleDelete(id: string) {
    setSubmitting(true)

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await fetchAnnouncements()
      } else {
        alert("Error al eliminar")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <SubmittingOverlay
        show={submitting}
        label="Guardando cambios..."
        className="fixed z-[70]"
      />

      <TypographyH1 className="mb-6 text-left">
        Anuncios
      </TypographyH1>

      <Button onClick={() => {
        setSelectedAnnouncement(null)
        setOpen(true)
      }} disabled={submitting}>
        + Nuevo anuncio
      </Button>

      <div className="theme-surface mt-4 mb-4 rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4" />
          Filtros
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="w-full md:max-w-sm">
            <Label htmlFor="filter-title">Filtrar por título</Label>
            <Input
              id="filter-title"
              placeholder="Buscar por título..."
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
            />
          </div>
          <div className="w-full md:max-w-56">
            <Label htmlFor="filter-date">Filtrar por fecha</Label>
            <Input
              id="filter-date"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFilterTitle("")
              setFilterDate("")
            }}
            className="w-full md:w-auto"
            disabled={!hasFiltersToClear}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border bg-card text-card-foreground">
        <Table containerClassName="max-h-[60vh]">
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead className="w-[360px]">Contenido</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeletonRows columns={5} rows={6} />
            ) : filteredAnnouncements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay anuncios que coincidan con los filtros
                </TableCell>
              </TableRow>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <TableRow key={announcement._id}>
                  <TableCell>{announcement.title}</TableCell>
                  <TableCell className="w-[360px] max-w-[360px] whitespace-normal">
                    <p className="line-clamp-2">{announcement.content}</p>
                  </TableCell>
                  <TableCell>{announcement.date || "-"}</TableCell>
                  <TableCell>{announcement.authorName || "Sistema"}</TableCell>
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
                              disabled={submitting}
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
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  disabled={submitting}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Eliminar anuncio?
                                  </AlertDialogTitle>
                                </AlertDialogHeader>

                                <p className="text-sm text-muted-foreground">
                                  Esta acción no se puede deshacer.
                                </p>

                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>

                                  <AlertDialogAction
                                    onClick={() => handleDelete(announcement._id)}
                                    disabled={submitting}
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
        key={`${selectedAnnouncement?._id ?? "new"}-${open ? "open" : "closed"}`}
        open={open}
        onOpenChange={setOpen}
        announcement={selectedAnnouncement}
        authors={authors}
        currentUser={currentUser}
        onSuccess={fetchAnnouncements}
        submitting={submitting}
        onSubmittingChange={setSubmitting}
      />
    </div>
  )
}
