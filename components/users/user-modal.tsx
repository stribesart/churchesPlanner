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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  RoleAccordion,
  normalizeUserRole,
  type UserRole,
} from "@/components/users/role-accordion"

type User = {
  _id?: string
  name: string
  email: string
  role: string
  ministryRoleId?: string | null
}

type MinistryRole = {
  _id: string
  name: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  currentUserRole?: string
  user?: User | null
}

function isLeaderRole(role?: string) {
  const normalizedRole = role?.toLowerCase() ?? ""

  return normalizedRole === "lider" || normalizedRole === "líder"
}

export default function UserModal({
  open,
  onOpenChange,
  onSuccess,
  currentUserRole,
  user,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <UserModalForm
        key={`${user?._id ?? "create"}-${open ? "open" : "closed"}`}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        currentUserRole={currentUserRole}
        user={user}
      />
    </Dialog>
  )
}

function UserModalForm({
  onOpenChange,
  onSuccess,
  currentUserRole,
  user,
}: Pick<Props, "onOpenChange" | "onSuccess" | "currentUserRole" | "user">) {
  const isEdit = !!user
  const isCurrentUserLeader = isLeaderRole(currentUserRole)
  const roleOptions: readonly UserRole[] =
    ["pastor", "lider", "miembro colaborador", "miembro"]

  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState(
    normalizeUserRole(user?.role ?? "miembro colaborador")
  )
  const [ministryRoles, setMinistryRoles] = useState<MinistryRole[]>([])
  const [ministryRoleId, setMinistryRoleId] = useState(user?.ministryRoleId ?? "")
  const [rolesLoading, setRolesLoading] = useState(false)
  const [error, setError] = useState("")

  async function fetchMinistryRoles() {
    if (!isCurrentUserLeader) {
      return
    }

    setRolesLoading(true)
    setError("")

    const res = await fetch("/api/ministry-roles")

    setRolesLoading(false)

    if (res.ok) {
      const data = await res.json()
      setMinistryRoles(data.roles || [])
    } else {
      const data = await res.json()
      setError(data?.message || "Error al cargar roles del ministerio")
    }
  }

  async function handleSubmit() {
    if (isCurrentUserLeader && !ministryRoleId) {
      setError("Primero selecciona un rol del ministerio.")
      return
    }

    const url = isEdit
      ? `/api/users/${user?._id}`
      : "/api/users"

    const method = isEdit ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role: isCurrentUserLeader ? "miembro colaborador" : role,
        ministryRoleId: isCurrentUserLeader ? ministryRoleId : undefined,
      }),
    })

    if (res.ok) {
      onSuccess()
      onOpenChange(false)
    } else {
      const data = await res.json()
      setError(data?.message || "Error")
    }
  }

  return (
    <DialogContent
      onOpenAutoFocus={() => {
        fetchMinistryRoles()
      }}
    >
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

        {isCurrentUserLeader ? (
          <div className="space-y-2">
            <Label>Rol dentro del ministerio</Label>
            {rolesLoading ? (
              <p className="text-sm text-muted-foreground">
                Cargando roles...
              </p>
            ) : ministryRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Primero crea roles en el módulo de ministerios para poder dar de
                alta colaboradores.
              </p>
            ) : (
              <Select value={ministryRoleId} onValueChange={setMinistryRoleId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {ministryRoles.map((ministryRole) => (
                    <SelectItem key={ministryRole._id} value={ministryRole._id}>
                      {ministryRole.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <div>
            <Label>Rol</Label>
            <RoleAccordion
              value={role}
              onValueChange={setRole}
              roles={roleOptions}
            />
          </div>
        )}

        {error ? (
          <p className="text-sm font-medium text-destructive">{error}</p>
        ) : null}

        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={isCurrentUserLeader && ministryRoles.length === 0}
        >
          {isEdit ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </DialogContent>
  )
}
