"use client"

import { useMemo, useState } from "react"
import {
  LeaderAccordion,
  type Leader,
} from "@/components/ministeries/leader-accordion"
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
import { Textarea } from "@/components/ui/textarea"
import { FieldError } from "@/components/ui/field"

type Ministry = {
  _id?: string
  name: string
  description: string
  leader: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  ministry?: Ministry | null
  leaders: Leader[]
}

export default function MinistryModal({
  open,
  onOpenChange,
  onSuccess,
  ministry,
  leaders,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <MinistryForm
          key={ministry?._id ?? "new-ministry"}
          ministry={ministry}
          leaders={leaders}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}

type MinistryFormProps = {
  ministry?: Ministry | null
  leaders: Leader[]
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function MinistryForm({
  ministry,
  leaders,
  onOpenChange,
  onSuccess,
}: MinistryFormProps) {
  const isEdit = !!ministry

  const [name, setName] = useState(ministry?.name ?? "")
  const [description, setDescription] = useState(ministry?.description ?? "")
  const [leader, setLeader] = useState(ministry?.leader ?? "")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const availableLeaders = useMemo(
    () =>
      leaders.filter(
        (availableLeader) =>
          !availableLeader.ministryId || availableLeader._id === leader
      ),
    [leader, leaders]
  )

  async function handleSubmit() {
    setError("")

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName) {
      setError("El nombre del ministerio es obligatorio.")
      return
    }

    if (!leader) {
      setError("Selecciona un líder.")
      return
    }

    const url = isEdit
      ? `/api/ministeries/${ministry?._id}`
      : "/api/ministeries"

    const method = isEdit ? "PUT" : "POST"

    setSaving(true)

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: trimmedName,
        description: trimmedDescription,
        leader,
      }),
    })
    const data = await res.json()

    setSaving(false)

    if (res.ok) {
      onSuccess()
      onOpenChange(false)
    } else {
      setError(data?.message || "No se pudo guardar el ministerio. Intenta de nuevo.")
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Editar ministerio" : "Crear ministerio"}
        </DialogTitle>
        <DialogDescription>
          Asigna un nombre, una descripción y el líder responsable.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <Label>Descripción</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label>Líder</Label>
          <LeaderAccordion
            leaders={availableLeaders}
            value={leader}
            onValueChange={setLeader}
          />
        </div>

        <FieldError>{error}</FieldError>

        <Button onClick={handleSubmit} className="w-full" disabled={saving}>
          {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </>
  )
}
