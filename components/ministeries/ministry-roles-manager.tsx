"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeletonRows,
} from "@/components/ui/table"

type MinistryRole = {
  _id: string
  ministryId: string
  name: string
}

type Props = {
  ministryId?: string | null
  onRolesChange?: (roles: MinistryRole[]) => void
}

export default function MinistryRolesManager({
  ministryId,
  onRolesChange,
}: Props) {
  const [roles, setRoles] = useState<MinistryRole[]>([])
  const [name, setName] = useState("")
  const [editingRoleId, setEditingRoleId] = useState("")
  const [editingName, setEditingName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const rolesUrl = ministryId
    ? `/api/ministry-roles?ministryId=${ministryId}`
    : "/api/ministry-roles"

  async function fetchRoles() {
    setLoading(true)
    setError("")

    const res = await fetch(rolesUrl)

    setLoading(false)

    if (res.ok) {
      const data = await res.json()
      const nextRoles = data.roles || []
      setRoles(nextRoles)
      onRolesChange?.(nextRoles)
    } else {
      const data = await res.json()
      setError(data?.message || "Error al cargar roles")
    }
  }

  useEffect(() => {
    let ignore = false

    fetch(rolesUrl)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ignore) {
          return
        }

        setLoading(false)

        if (ok) {
          const nextRoles = data.roles || []
          setRoles(nextRoles)
          onRolesChange?.(nextRoles)
        } else {
          setError(data?.message || "Error al cargar roles")
        }
      })

    return () => {
      ignore = true
    }
  }, [rolesUrl, onRolesChange])

  async function handleCreateRole() {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    setError("")
    setSuccess("")

    const res = await fetch("/api/ministry-roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: trimmedName,
        ministryId,
      }),
    })

    if (res.ok) {
      setName("")
      setSuccess("Rol creado correctamente.")
      fetchRoles()
    } else {
      const data = await res.json()
      setError(data?.message || "Error al crear rol")
    }
  }

  async function handleUpdateRole(roleId: string) {
    const trimmedEditingName = editingName.trim()

    if (!trimmedEditingName) {
      return
    }

    setError("")
    setSuccess("")

    const res = await fetch(`/api/ministry-roles/${roleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: trimmedEditingName,
      }),
    })

    if (res.ok) {
      setEditingRoleId("")
      setEditingName("")
      setSuccess("Rol actualizado correctamente.")
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
    setSuccess("")

    const res = await fetch(`/api/ministry-roles/${roleId}`, {
      method: "DELETE",
    })

    if (res.ok) {
      setSuccess("Rol eliminado correctamente.")
      fetchRoles()
    } else {
      const data = await res.json()
      setError(data?.message || "Error al eliminar rol")
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="ministry-role-name">Nuevo rol de ministerio</Label>
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

      <FieldError>{error}</FieldError>

      {success ? (
        <p className="text-sm font-medium text-green-700">{success}</p>
      ) : null}

      <div className="rounded-lg border bg-white">
        <Table containerClassName="max-h-72">
          <TableHeader>
            <TableRow>
              <TableHead>Rol</TableHead>
              <TableHead className="w-28">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows columns={2} rows={3} />
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  Todavía no hay roles para este ministerio.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role._id}>
                  <TableCell>
                    {editingRoleId === role._id ? (
                      <Input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                    ) : (
                      role.name
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export type { MinistryRole }
