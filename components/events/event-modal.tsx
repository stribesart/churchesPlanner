"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Textarea } from "@/components/ui/textarea"
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

type EventField =
  | "name"
  | "date"
  | "startTime"
  | "endTime"
  | "location"
  | "organizer"
type EventFieldErrors = Partial<Record<EventField, string>>

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
  const [fieldErrors, setFieldErrors] = useState<EventFieldErrors>({})

  async function handleSubmit() {
    setError("")
    setFieldErrors({})

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()
    const trimmedDate = date.trim()
    const trimmedStartTime = startTime.trim()
    const trimmedEndTime = endTime.trim()
    const trimmedLocation = location.trim()
    const trimmedOrganizer = organizer.trim()
    const nextFieldErrors: EventFieldErrors = {}

    if (!trimmedName) {
      nextFieldErrors.name = "El nombre del evento es obligatorio."
    }

    if (!trimmedDate) {
      nextFieldErrors.date = "Selecciona la fecha del evento."
    }

    if (!trimmedStartTime) {
      nextFieldErrors.startTime = "Selecciona la hora de inicio."
    }

    if (!trimmedEndTime) {
      nextFieldErrors.endTime = "Selecciona la hora de fin."
    }

    if (
      trimmedStartTime &&
      trimmedEndTime &&
      trimmedStartTime >= trimmedEndTime
    ) {
      nextFieldErrors.endTime =
        "La hora de fin debe ser posterior a la hora de inicio."
    }

    if (!trimmedLocation) {
      nextFieldErrors.location = "La ubicación es obligatoria."
    }

    if (!trimmedOrganizer) {
      nextFieldErrors.organizer = "Selecciona un organizador."
    } else if (!organizers.some((user) => user._id === trimmedOrganizer)) {
      nextFieldErrors.organizer = "Selecciona un organizador válido."
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
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
          date: trimmedDate,
          startTime: trimmedStartTime,
          endTime: trimmedEndTime,
          location: trimmedLocation,
          organizer: trimmedOrganizer,
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

  function clearFieldError(field: EventField) {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]

      return nextErrors
    })
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-hidden sm:max-w-2xl"
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

        <FieldGroup
          className="max-h-[calc(100dvh-14rem)] overflow-y-auto pr-1"
          aria-busy={submitting}
        >
          <Field>
            <FieldLabel>Nombre del evento</FieldLabel>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                clearFieldError("name")
              }}
              aria-invalid={Boolean(fieldErrors.name)}
              disabled={submitting}
            />
            <FieldError>{fieldErrors.name}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Descripción</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Fecha</FieldLabel>
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  clearFieldError("date")
                }}
                aria-invalid={Boolean(fieldErrors.date)}
                disabled={submitting}
              />
              <FieldError>{fieldErrors.date}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Ubicación</FieldLabel>
              <Input
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  clearFieldError("location")
                }}
                aria-invalid={Boolean(fieldErrors.location)}
                disabled={submitting}
              />
              <FieldError>{fieldErrors.location}</FieldError>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Hora inicio</FieldLabel>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value)
                  clearFieldError("startTime")
                  clearFieldError("endTime")
                }}
                aria-invalid={Boolean(fieldErrors.startTime)}
                disabled={submitting}
              />
              <FieldError>{fieldErrors.startTime}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Hora fin</FieldLabel>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value)
                  clearFieldError("endTime")
                }}
                aria-invalid={Boolean(fieldErrors.endTime)}
                disabled={submitting}
              />
              <FieldError>{fieldErrors.endTime}</FieldError>
            </Field>
          </div>

          <Field>
            <FieldLabel>Organizador</FieldLabel>
            <Select
              value={organizer}
              onValueChange={(value) => {
                setOrganizer(value)
                clearFieldError("organizer")
              }}
              disabled={submitting}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={Boolean(fieldErrors.organizer)}
              >
                <SelectValue placeholder="Selecciona un organizador" />
              </SelectTrigger>
              <SelectContent>
                {organizers.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.organizer}</FieldError>
          </Field>

          <FieldError>{error}</FieldError>
        </FieldGroup>

        <DialogFooter>
          <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <LoadingSpinner />
                {isEdit ? "Actualizando..." : "Creando..."}
              </>
            ) : isEdit ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
