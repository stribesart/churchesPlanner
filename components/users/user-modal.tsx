"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RoleAccordion, normalizeUserRole } from "@/components/users/role-accordion"

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <UserModalForm
          key={`${user?._id ?? "create"}-${open ? "open" : "closed"}`}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
          user={user}
        />
      </DialogContent>
    </Dialog>
  )
}

function UserModalForm({
  onOpenChange,
  onSuccess,
  user,
}: Pick<Props, "onOpenChange" | "onSuccess" | "user">) {
  const isEdit = !!user

  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState(normalizeUserRole(user?.role ?? "miembro"))

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
    <>
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
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={isEdit ? "Opcional" : ""}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-1 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Label>Rol</Label>
          <RoleAccordion value={role} onValueChange={setRole} />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          {isEdit ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </>
  )
}
