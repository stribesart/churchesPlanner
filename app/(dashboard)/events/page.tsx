"use client"

import { useEffect, useState } from "react"
import EventModal from "@/components/events/event-modal"
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

type Event = {
  _id: string
  name: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  organizer: string
  organizerName?: string
}

type User = {
  _id: string
  name: string
  email: string
  role: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [organizers, setOrganizers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [filterName, setFilterName] = useState("")
  const [filterDate, setFilterDate] = useState("")

  async function fetchEvents() {
    const [eventsRes, ministeriesRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/ministeries")
    ])
    const eventsData = await eventsRes.json()
    const ministeriesData = await ministeriesRes.json()
    setEvents(eventsData)
    setOrganizers(ministeriesData.leaders || [])
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const filteredEvents = events.filter((event) => {
    const matchesName = event.name
      .toLowerCase()
      .includes(filterName.toLowerCase())

    if (!filterDate) {
      return matchesName
    }

    return matchesName && event.date === filterDate
  })

  async function handleDelete(id: string) {
    const res = await fetch(`/api/events/${id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      fetchEvents()
    } else {
      alert("Error al eliminar")
    }
  }

  return (
    <div>
      <TypographyH1 className="mb-6 text-left">
        Eventos
      </TypographyH1>

      <Button onClick={() => {
        setSelectedEvent(null)
        setOpen(true)
      }}>
        + Nuevo evento
      </Button>

      <div className="bg-white rounded-lg border p-4 mt-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="filter-name">Filtrar por nombre</Label>
            <Input
              id="filter-name"
              placeholder="Buscar por nombre..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
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
        {(filterName || filterDate) && (
          <Button
            variant="outline"
            onClick={() => {
              setFilterName("")
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
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Organizador</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  No hay eventos que coincidan con los filtros
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{`${event.startTime} - ${event.endTime}`}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{event.organizerName || "Sin organizador"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setSelectedEvent(event)
                                setOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Editar evento
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
                                    ¿Eliminar evento?
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
                                    onClick={() => handleDelete(event._id)}
                                  >
                                    Sí, eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>

                          <TooltipContent>
                            Eliminar evento
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

      <EventModal
        open={open}
        onOpenChange={setOpen}
        event={selectedEvent}
        onSuccess={fetchEvents}
        organizers={organizers}
      />
    </div>
  )
}
