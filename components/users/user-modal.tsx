"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/components/ui/field"
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
  phone?: string
  role: string
  ministryRoleId?: string | null
}

type MinistryRole = {
  _id: string
  name: string
}

type UserField = "name" | "email" | "phone" | "password" | "ministryRoleId"
type UserFieldErrors = Partial<Record<UserField, string>>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void> | void
  currentUserRole?: string
  user?: User | null
  submitting: boolean
  onSubmittingChange: (submitting: boolean) => void
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
  submitting,
  onSubmittingChange,
}: Props) {
  function handleOpenChange(nextOpen: boolean) {
    if (submitting && !nextOpen) return

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <UserModalForm
        key={`${user?._id ?? "create"}-${open ? "open" : "closed"}`}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        currentUserRole={currentUserRole}
        user={user}
        submitting={submitting}
        onSubmittingChange={onSubmittingChange}
      />
    </Dialog>
  )
}

function UserModalForm({
  onOpenChange,
  onSuccess,
  currentUserRole,
  user,
  submitting,
  onSubmittingChange,
}: Pick<
  Props,
  | "onOpenChange"
  | "onSuccess"
  | "currentUserRole"
  | "user"
  | "submitting"
  | "onSubmittingChange"
>) {
  const isEdit = !!user
  const isCurrentUserLeader = isLeaderRole(currentUserRole)
  const roleOptions: readonly UserRole[] =
    ["pastor", "lider", "miembro colaborador", "miembro"]

  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState(
    normalizeUserRole(user?.role ?? "miembro colaborador")
  )
  const [ministryRoles, setMinistryRoles] = useState<MinistryRole[]>([])
  const [ministryRoleId, setMinistryRoleId] = useState(user?.ministryRoleId ?? "")
  const [rolesLoading, setRolesLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<UserFieldErrors>({})

  async function fetchMinistryRoles() {
    if (!isCurrentUserLeader) {
      return
    }

    setRolesLoading(true)
    setError("")
    setFieldErrors({})

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
    setError("")
    setFieldErrors({})

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPhone = phone.trim()
    const trimmedPassword = password.trim()
    const nextFieldErrors: UserFieldErrors = {}

    if (!trimmedName) {
      nextFieldErrors.name = "El nombre es obligatorio."
    }

    if (!trimmedEmail) {
      nextFieldErrors.email = "El correo electrónico es obligatorio."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextFieldErrors.email = "Ingresa un correo electrónico válido."
    }

    const normalizedPhone = trimmedPhone.replace(/[^\d+]/g, "")

    if (!trimmedPhone) {
      nextFieldErrors.phone = "El celular es obligatorio."
    } else if (!/^\+?\d{10,15}$/.test(normalizedPhone)) {
      nextFieldErrors.phone = "Ingresa un celular válido con 10 a 15 dígitos."
    }

    if (!isEdit && !trimmedPassword) {
      nextFieldErrors.password = "La contraseña es obligatoria."
    } else if (
      trimmedPassword &&
      !/(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(trimmedPassword)
    ) {
      nextFieldErrors.password =
        "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, letras y un número."
    }

    if (isCurrentUserLeader && !ministryRoleId) {
      nextFieldErrors.ministryRoleId = "Primero selecciona un rol del ministerio."
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }

    const url = isEdit
      ? `/api/users/${user?._id}`
      : "/api/users"

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
          email: trimmedEmail,
          phone: trimmedPhone,
          password: trimmedPassword,
          role: isCurrentUserLeader ? "miembro colaborador" : role,
          ministryRoleId: isCurrentUserLeader ? ministryRoleId : undefined,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        await onSuccess()
        onOpenChange(false)
      } else {
        setError(data?.message || "No se pudo guardar el usuario. Intenta de nuevo.")
      }
    } catch {
      setError("No se pudo guardar el usuario. Intenta de nuevo.")
    } finally {
      onSubmittingChange(false)
    }
  }

  function clearFieldError(field: UserField) {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]

      return nextErrors
    })
    setError("")
  }

  return (
    <DialogContent
      onEscapeKeyDown={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
      onOpenAutoFocus={() => {
        fetchMinistryRoles()
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Editar usuario" : "Crear usuario"}
        </DialogTitle>
        <DialogDescription>
          Captura los datos de acceso y el rol que tendrá este usuario.
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
          <Label>Email</Label>
          <Input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearFieldError("email")
            }}
            aria-invalid={Boolean(fieldErrors.email)}
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </div>

        <div>
          <Label>Celular</Label>
          <Input
            type="tel"
            placeholder="+5215512345678"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              clearFieldError("phone")
            }}
            aria-invalid={Boolean(fieldErrors.phone)}
          />
          <FieldError>{fieldErrors.phone}</FieldError>
        </div>

        <div>
          <Label>Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={isEdit ? "Opcional" : ""}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearFieldError("password")
              }}
              className="pr-10"
              aria-invalid={Boolean(fieldErrors.password)}
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
          <FieldError>{fieldErrors.password}</FieldError>
        </div>

        {isCurrentUserLeader ? (
          <div className="space-y-2">
            <Label>Rol dentro del ministerio</Label>
            {rolesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : ministryRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Primero crea roles en el módulo de ministerios para poder dar de
                alta colaboradores.
              </p>
            ) : (
              <Select
                value={ministryRoleId}
                onValueChange={(value) => {
                  setMinistryRoleId(value)
                  clearFieldError("ministryRoleId")
                }}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={Boolean(fieldErrors.ministryRoleId)}
                >
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
            <FieldError>{fieldErrors.ministryRoleId}</FieldError>
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
          disabled={submitting || (isCurrentUserLeader && ministryRoles.length === 0)}
        >
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
  )
}
