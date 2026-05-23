"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"

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

type Ministry = {
  _id: string
  ministryId?: string
  name: string
}

type MinistryRole = {
  _id: string
  ministryId: string
  name: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ministry: Ministry | null
}

export default function MinistryRolesDialog({
  open,
  onOpenChange,
  ministry,
}: Props) {
  const [roles, setRoles] = useState<MinistryRole[]>([])
  const [name, setName] = useState("")
  const [editingRoleId, setEditingRoleId] = useState("")
  const [editingName, setEditingName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const ministryId = ministry?.ministryId || ministry?._id || ""

  async function fetchRoles() {
    if (!ministryId) {
      setRoles([])
      return
    }

    setLoading(true)
    setError("")

    const res = await fetch(`/api/ministry-roles?ministryId=${ministryId}`)

    setLoading(false)

    if (res.ok) {
      const data = await res.json()
      setRoles(data.roles || [])
    } else {
      const data = await res.json()
      setError(data?.message || "Error al cargar roles")
    }
  }

  async function handleCreateRole() {
    if (!name.trim() || !ministryId) {
      return
    }

    setError("")

    const res = await fetch("/api/ministry-roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        ministryId,
      }),
    })

    if (res.ok) {
      setName("")
      fetchRoles()
    } else {
      const data = await res.json()
      setError(data?.message || "Error al crear rol")
    }
  }

  async function handleUpdateRole(roleId: string) {
    if (!editingName.trim()) {
      return
    }

    setError("")

    const res = await fetch(`/api/ministry-roles/${roleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: editingName,
      }),
    })

    if (res.ok) {
      setEditingRoleId("")
      setEditingName("")
      fetchRoles()
    } else {
      const data = await res.json()
      setError(data?.message || "Error al actualizar rol")
    }
  }

  async function handleDeleteRole(roleId: string) {
    const confirmed = window.confirm("¿Eliminar este rol de ministerio?")

    if (!confirmed) {
      return
    }

    setError("")

    const res = await fetch(`/api/ministry-roles/${roleId}`, {
      method: "DELETE",
    })

    if (res.ok) {
      fetchRoles()
    } else {
      const data = await res.json()
      setError(data?.message || "Error al eliminar rol")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onOpenAutoFocus={() => {
          fetchRoles()
        }}
      >
        <DialogHeader>
          <DialogTitle>Roles de ministerio</DialogTitle>
          <DialogDescription>
            {ministry
              ? `Administra los roles internos de ${ministry.name}.`
              : "Selecciona un ministerio para administrar sus roles."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="ministry-role-name">Nuevo rol</Label>
            <div className="flex gap-2">
              <Input
                id="ministry-role-name"
                placeholder="Maestra titular"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Button
                type="button"
                size="icon"
                onClick={handleCreateRole}
                disabled={!name.trim() || loading}
                aria-label="Crear rol"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : null}

          <div className="rounded-lg border">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">
                Cargando roles...
              </p>
            ) : roles.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Este ministerio todavía no tiene roles.
              </p>
            ) : (
              <div className="divide-y">
                {roles.map((role) => (
                  <div
                    key={role._id}
                    className="flex items-center gap-2 p-3"
                  >
                    {editingRoleId === role._id ? (
                      <Input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                    ) : (
                      <span className="flex-1 text-sm font-medium">
                        {role.name}
                      </span>
                    )}

                    {editingRoleId === role._id ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleUpdateRole(role._id)}
                          disabled={!editingName.trim()}
                        >
                          Guardar
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingRoleId("")
                            setEditingName("")
                          }}
                          aria-label="Cancelar edición"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setEditingRoleId(role._id)
                            setEditingName(role.name)
                          }}
                          aria-label="Editar rol"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDeleteRole(role._id)}
                          aria-label="Eliminar rol"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
