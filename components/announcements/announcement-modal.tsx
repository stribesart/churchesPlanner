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

  async function handleSubmit() {
    const url = isEdit
      ? `/api/announcements/${announcement?._id}`
      : "/api/announcements"

    const method = isEdit ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content, author }),
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
      <DialogContent>

        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar anuncio" : "Crear anuncio"}
          </DialogTitle>
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

          <Button onClick={handleSubmit} className="w-full">
            {isEdit ? "Actualizar" : "Crear"}
          </Button>

        </div>

      </DialogContent>
    </Dialog>
  )
}
