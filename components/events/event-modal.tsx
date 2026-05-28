"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Textarea } from "@/components/ui/textarea"
import { FieldError } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type User = {
  _id: string
  name: string
  email: string
  role: string
}

type Event = {
  _id?: string
  name: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  organizer: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void> | void
  event?: Event | null
  organizers: User[]
  submitting: boolean
  onSubmittingChange: (submitting: boolean) => void
}

export default function EventModal({
  open,
  onOpenChange,
  onSuccess,
  event,
  organizers,
  submitting,
  onSubmittingChange,
}: Props) {
  function handleOpenChange(nextOpen: boolean) {
    if (submitting && !nextOpen) return

    onOpenChange(nextOpen)
  }

  const isEdit = !!event

  const [name, setName] = useState(event?.name ?? "")
  const [description, setDescription] = useState(event?.description ?? "")
  const [date, setDate] = useState(event?.date ?? "")
  const [startTime, setStartTime] = useState(event?.startTime ?? "")
  const [endTime, setEndTime] = useState(event?.endTime ?? "")
  const [location, setLocation] = useState(event?.location ?? "")
  const [organizer, setOrganizer] = useState<string>(event?.organizer ?? "")
  const [error, setError] = useState("")

  async function handleSubmit() {
    setError("")

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()
    const trimmedLocation = location.trim()

    if (!trimmedName) {
      setError("El nombre del evento es obligatorio.")
      return
    }

    if (!date) {
      setError("Selecciona la fecha del evento.")
      return
    }

    if (!startTime) {
      setError("Selecciona la hora de inicio.")
      return
    }

    if (!endTime) {
      setError("Selecciona la hora de fin.")
      return
    }

    if (startTime >= endTime) {
      setError("La hora de fin debe ser posterior a la hora de inicio.")
      return
    }

    if (!trimmedLocation) {
      setError("La ubicación es obligatoria.")
      return
    }

    if (!organizer) {
      setError("Selecciona un organizador.")
      return
    }

    const url = isEdit
      ? `/api/events/${event?._id}`
      : "/api/events"

    const method = isEdit ? "PUT" : "POST"

    onSubmittingChange(true)

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription,
          date,
          startTime,
          endTime,
          location: trimmedLocation,
          organizer,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        await onSuccess()
        onOpenChange(false)
      } else {
        setError(data?.message || "No se pudo guardar el evento. Intenta de nuevo.")
      }
    } catch {
      setError("No se pudo guardar el evento. Intenta de nuevo.")
    } finally {
      onSubmittingChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-2xl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >

        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar evento" : "Crear evento"}
          </DialogTitle>
          <DialogDescription>
            Define la fecha, horario, ubicación y organizador del evento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto" aria-busy={submitting}>

          <div>
            <Label>Nombre del evento</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div>
              <Label>Ubicación</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hora inicio</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>

            <div>
              <Label>Hora fin</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Organizador</Label>
            <Select value={organizer} onValueChange={setOrganizer}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un organizador" />
              </SelectTrigger>
              <SelectContent>
                {organizers.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FieldError>{error}</FieldError>

          <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <LoadingSpinner />
                Guardando...
              </>
            ) : isEdit ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </Button>

        </div>

      </DialogContent>
    </Dialog>
  )
}
