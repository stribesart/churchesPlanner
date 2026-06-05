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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SubmittingOverlay } from "@/components/ui/submitting-overlay"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ministryId?: string | null
  onSuccess: () => Promise<void> | void
}

export default function MinistryRoleModal({
  open,
  onOpenChange,
  ministryId,
  onSuccess,
}: Props) {
  function handleOpenChange(nextOpen: boolean) {
    if (submitting && !nextOpen) return

    onOpenChange(nextOpen)
  }

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [nameError, setNameError] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    setNameError("")
    setError("")

    if (!trimmedName) {
      setNameError("El nombre del rol es obligatorio.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/ministry-roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription,
          ministryId,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        await onSuccess()
        onOpenChange(false)
      } else {
        setError(data?.message || "No se pudo agregar el rol. Intenta de nuevo.")
      }
    } catch {
      setError("No se pudo agregar el rol. Intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <SubmittingOverlay show={submitting} label="Agregando rol..." />

        <DialogHeader>
          <DialogTitle>Agregar rol</DialogTitle>
          <DialogDescription>
            Define el rol que podrá desempeñar un miembro de tu ministerio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4" aria-busy={submitting}>
          <Field>
            <FieldLabel htmlFor="ministry-role-name">Nombre del rol</FieldLabel>
            <Input
              id="ministry-role-name"
              placeholder="Maestra titular"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setNameError("")
                setError("")
              }}
              aria-invalid={Boolean(nameError)}
              disabled={submitting}
            />
            <FieldError>{nameError}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="ministry-role-description">
              Breve descripción
            </FieldLabel>
            <Textarea
              id="ministry-role-description"
              placeholder="Describe las responsabilidades principales del rol."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={submitting}
            />
          </Field>

          <FieldError>{error}</FieldError>

          <Button
            type="button"
            className="w-full"
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
          >
            {submitting ? (
              <>
                <LoadingSpinner />
                Agregando...
              </>
            ) : (
              "Agregar rol"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
