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
  onSuccess: () => void
  announcement?: Announcement | null
}

export default function AnnouncementModal({
  open,
  onOpenChange,
  onSuccess,
  announcement,
}: Props) {

  const isEdit = !!announcement

  const [title, setTitle] = useState(announcement?.title ?? "")
  const [content, setContent] = useState(announcement?.content ?? "")
  const [author, setAuthor] = useState(announcement?.author ?? "")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

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

    setSaving(true)

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

    setSaving(false)

    if (res.ok) {
      onSuccess()
      onOpenChange(false)
    } else {
      setError(data?.message || "No se pudo guardar el anuncio. Intenta de nuevo.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>

        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar anuncio" : "Crear anuncio"}
          </DialogTitle>
          <DialogDescription>
            Completa la información que verá la comunidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

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

          <Button onClick={handleSubmit} className="w-full" disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
          </Button>

        </div>

      </DialogContent>
    </Dialog>
  )
}
