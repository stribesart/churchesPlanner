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

type Announcement = {
  _id?: string
  title: string
  content: string
  author: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void> | void
  announcement?: Announcement | null
  submitting: boolean
  onSubmittingChange: (submitting: boolean) => void
}

export default function AnnouncementModal({
  open,
  onOpenChange,
  onSuccess,
  announcement,
  submitting,
  onSubmittingChange,
}: Props) {
  function handleOpenChange(nextOpen: boolean) {
    if (submitting && !nextOpen) return

    onOpenChange(nextOpen)
  }

  const isEdit = !!announcement

  const [title, setTitle] = useState(announcement?.title ?? "")
  const [content, setContent] = useState(announcement?.content ?? "")
  const [author, setAuthor] = useState(announcement?.author ?? "")
  const [error, setError] = useState("")

  async function handleSubmit() {
    setError("")

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const trimmedAuthor = author.trim()

    if (!trimmedTitle) {
      setError("El título es obligatorio.")
      return
    }

    if (!trimmedContent) {
      setError("El contenido es obligatorio.")
      return
    }

    if (!trimmedAuthor) {
      setError("El autor es obligatorio.")
      return
    }

    const url = isEdit
      ? `/api/announcements/${announcement?._id}`
      : "/api/announcements"

    const method = isEdit ? "PUT" : "POST"

    onSubmittingChange(true)

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          author: trimmedAuthor,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        await onSuccess()
        onOpenChange(false)
      } else {
        setError(data?.message || "No se pudo guardar el anuncio. Intenta de nuevo.")
      }
    } catch {
      setError("No se pudo guardar el anuncio. Intenta de nuevo.")
    } finally {
      onSubmittingChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >

        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar anuncio" : "Crear anuncio"}
          </DialogTitle>
          <DialogDescription>
            Completa la información que verá la comunidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4" aria-busy={submitting}>

          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label>Contenido</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
          </div>

          <div>
            <Label>Autor</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
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
