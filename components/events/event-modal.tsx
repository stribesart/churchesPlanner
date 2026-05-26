"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  event?: Event | null
  organizers: User[]
}

export default function EventModal({
  open,
  onOpenChange,
  onSuccess,
  event,
  organizers,
}: Props) {

  const isEdit = !!event

  const [name, setName] = useState(event?.name ?? "")
  const [description, setDescription] = useState(event?.description ?? "")
  const [date, setDate] = useState(event?.date ?? "")
  const [startTime, setStartTime] = useState(event?.startTime ?? "")
  const [endTime, setEndTime] = useState(event?.endTime ?? "")
  const [location, setLocation] = useState(event?.location ?? "")
  const [organizer, setOrganizer] = useState<string>(event?.organizer ?? "")

  async function handleSubmit() {
    const url = isEdit
      ? `/api/events/${event?._id}`
      : "/api/events"

    const method = isEdit ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, description, date, startTime, endTime, location, organizer }),
    })

    if (res.ok) {
      onSuccess()
      onOpenChange(false)
    } else {
      alert("Error")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">

        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar evento" : "Crear evento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">

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

          <Button onClick={handleSubmit} className="w-full">
            {isEdit ? "Actualizar" : "Crear"}
          </Button>

        </div>

      </DialogContent>
    </Dialog>
  )
}
