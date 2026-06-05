"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import MinistryRoleModal from "@/components/ministeries/ministry-role-modal"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
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
  description?: string
}

type Props = {
  ministryId?: string | null
  disabled?: boolean
  onRolesChange?: (roles: MinistryRole[]) => void
  onSubmittingChange?: (submitting: boolean) => void
}

export default function MinistryRolesManager({
  ministryId,
  disabled = false,
  onRolesChange,
  onSubmittingChange,
}: Props) {
  const [roles, setRoles] = useState<MinistryRole[]>([])
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState("")
  const [editingName, setEditingName] = useState("")
  const [roleToDelete, setRoleToDelete] = useState<MinistryRole | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [deletingRole, setDeletingRole] = useState(false)
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

    if (disabled) {
      setLoading(false)
      setRoles([])
      setError("")
      onRolesChange?.([])
      return
    }

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
  }, [disabled, rolesUrl, onRolesChange])

  async function handleUpdateRole(roleId: string) {
    const trimmedEditingName = editingName.trim()

    if (!trimmedEditingName) {
      return
    }

    setError("")
    setSuccess("")

    onSubmittingChange?.(true)

    try {
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
        await fetchRoles()
      } else {
        const data = await res.json()
        setError(data?.message || "Error al actualizar rol")
      }
    } finally {
      onSubmittingChange?.(false)
    }
  }

  async function handleDeleteRole(roleId: string) {
    setError("")
    setSuccess("")
    setDeleteError("")
    setDeletingRole(true)

    onSubmittingChange?.(true)

    try {
      const res = await fetch(`/api/ministry-roles/${roleId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setRoleToDelete(null)
        setSuccess("Rol eliminado correctamente.")
        await fetchRoles()
      } else {
        const data = await res.json()
        setDeleteError(data?.message || "No se pudo eliminar el rol.")
      }
    } catch {
      setDeleteError("No se pudo eliminar el rol. Intenta de nuevo.")
    } finally {
      setDeletingRole(false)
      onSubmittingChange?.(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={() => setRoleModalOpen(true)}
        disabled={disabled || loading}
      >
        <Plus className="h-4 w-4" />
        Agregar rol
      </Button>

      <FieldError>{error}</FieldError>

      {success ? (
        <p className="text-sm font-medium text-green-700">{success}</p>
      ) : null}

      <div className="rounded-lg border bg-white">
        <Table containerClassName="max-h-72">
          <TableHeader>
            <TableRow>
              <TableHead>Rol</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-28">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows columns={3} rows={3} />
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
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
                  <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                    {role.description || "-"}
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
                            onClick={() => {
                              setRoleToDelete(role)
                              setDeleteError("")
                            }}
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

      <MinistryRoleModal
        key={roleModalOpen ? "open" : "closed"}
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        ministryId={ministryId}
        onSuccess={async () => {
          setSuccess("Rol creado correctamente.")
          await fetchRoles()
        }}
      />

      <AlertDialog
        open={Boolean(roleToDelete)}
        onOpenChange={(nextOpen) => {
          if (deletingRole && !nextOpen) return

          if (!nextOpen) {
            setRoleToDelete(null)
            setDeleteError("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              {roleToDelete
                ? `Se eliminará el rol ${roleToDelete.name}. Esta acción no se puede deshacer.`
                : "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <FieldError>{deleteError}</FieldError>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingRole}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (roleToDelete) {
                  handleDeleteRole(roleToDelete._id)
                }
              }}
              disabled={!roleToDelete || deletingRole}
            >
              {deletingRole ? (
                <>
                  <LoadingSpinner />
                  Eliminando...
                </>
              ) : (
                "Sí, eliminar"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export type { MinistryRole }
