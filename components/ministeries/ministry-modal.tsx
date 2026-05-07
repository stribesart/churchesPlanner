"use client"

import { useState, useEffect } from "react"
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
}

export default function MinistryModal({
  open,
  onOpenChange,
  onSuccess,
  ministry,
}: Props) {

  const isEdit = !!ministry

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [leader, setLeader] = useState("")

  useEffect(() => {
    if (ministry) {
      setName(ministry.name)
      setDescription(ministry.description)
      setLeader(ministry.leader)
    } else {
      setName("")
      setDescription("")
      setLeader("")
    }
  }, [ministry])

  async function handleSubmit() {
    const url = isEdit
      ? `/api/ministeries/${ministry?._id}`
      : "/api/ministeries"

    const method = isEdit ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, description, leader }),
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
            {isEdit ? "Editar ministerio" : "Crear ministerio"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>Líder</Label>
            <Input value={leader} onChange={(e) => setLeader(e.target.value)} />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            {isEdit ? "Actualizar" : "Crear"}
          </Button>

        </div>

      </DialogContent>
    </Dialog>
  )
}