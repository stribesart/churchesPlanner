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

type User = {
  _id?: string
  name: string
  email: string
  role: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user?: User | null
}

export default function UserModal({
  open,
  onOpenChange,
  onSuccess,
  user,
}: Props) {

  const isEdit = !!user

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("miembro")

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRole(user.role)
    } else {
      setName("")
      setEmail("")
      setPassword("")
      setRole("miembro")
    }
  }, [user])

  async function handleSubmit() {
    const url = isEdit
      ? `/api/users/${user?._id}`
      : "/api/users"

    const method = isEdit ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
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
            {isEdit ? "Editar usuario" : "Crear usuario"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder={isEdit ? "Opcional" : ""}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <Label>Rol</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            {isEdit ? "Actualizar" : "Crear"}
          </Button>

        </div>

      </DialogContent>
    </Dialog>
  )
}