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
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Textarea } from "@/components/ui/textarea"
import { FieldError } from "@/components/ui/field"

type Ministry = {
  _id?: string
  name: string
  description: string
  leader: string
}

type MinistryField = "name" | "leader"
type MinistryFieldErrors = Partial<Record<MinistryField, string>>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void> | void
  ministry?: Ministry | null
  leaders: Leader[]
  submitting: boolean
  onSubmittingChange: (submitting: boolean) => void
}

export default function MinistryModal({
  open,
  onOpenChange,
  onSuccess,
  ministry,
  leaders,
  submitting,
  onSubmittingChange,
}: Props) {
  function handleOpenChange(nextOpen: boolean) {
    if (submitting && !nextOpen) return

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <MinistryForm
          key={ministry?._id ?? "new-ministry"}
          ministry={ministry}
          leaders={leaders}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
          submitting={submitting}
          onSubmittingChange={onSubmittingChange}
        />
      </DialogContent>
    </Dialog>
  )
}

type MinistryFormProps = {
  ministry?: Ministry | null
  leaders: Leader[]
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void> | void
  submitting: boolean
  onSubmittingChange: (submitting: boolean) => void
}

function MinistryForm({
  ministry,
  leaders,
  onOpenChange,
  onSuccess,
  submitting,
  onSubmittingChange,
}: MinistryFormProps) {
  const isEdit = !!ministry

  const [name, setName] = useState(ministry?.name ?? "")
  const [description, setDescription] = useState(ministry?.description ?? "")
  const [leader, setLeader] = useState(ministry?.leader ?? "")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<MinistryFieldErrors>({})
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
    setFieldErrors({})

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()
    const nextFieldErrors: MinistryFieldErrors = {}

    if (!trimmedName) {
      nextFieldErrors.name = "El nombre del ministerio es obligatorio."
    }

    if (!leader) {
      nextFieldErrors.leader = "Selecciona un líder."
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }

    const url = isEdit
      ? `/api/ministeries/${ministry?._id}`
      : "/api/ministeries"

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
          leader,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        await onSuccess()
        onOpenChange(false)
      } else {
        setError(data?.message || "No se pudo guardar el ministerio. Intenta de nuevo.")
      }
    } catch {
      setError("No se pudo guardar el ministerio. Intenta de nuevo.")
    } finally {
      onSubmittingChange(false)
    }
  }

  function clearFieldError(field: MinistryField) {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]

      return nextErrors
    })
    setError("")
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

      <div className="space-y-4" aria-busy={submitting}>
        <div>
          <Label>Nombre</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              clearFieldError("name")
            }}
            aria-invalid={Boolean(fieldErrors.name)}
          />
          <FieldError>{fieldErrors.name}</FieldError>
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
            onValueChange={(value) => {
              setLeader(value)
              clearFieldError("leader")
            }}
            invalid={Boolean(fieldErrors.leader)}
          />
          <FieldError>{fieldErrors.leader}</FieldError>
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
    </>
  )
}
