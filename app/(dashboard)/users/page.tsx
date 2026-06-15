"use client"

import { useCallback, useEffect, useState } from "react"
import MinistryRolesManager, {
  type MinistryRole,
} from "@/components/ministeries/ministry-roles-manager"
import UserModal from "@/components/users/user-modal"
import { Button } from "@/components/ui/button"
import { TypographyH1 } from "@/components/ui/typography"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeletonRows,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SubmittingOverlay } from "@/components/ui/submitting-overlay"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Copy, LinkIcon, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"

type User = {
  _id: string
  name: string
  email: string
  role: string
  ministryId?: string | null
  ministryRoleId?: string | null
}

function isLeaderRole(role: string) {
  const normalizedRole = role.toLowerCase()

  return normalizedRole === "lider" || normalizedRole === "líder"
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [deletingUser, setDeletingUser] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState("")
  const [currentUserMinistryId, setCurrentUserMinistryId] = useState("")
  const [ministryRoles, setMinistryRoles] = useState<MinistryRole[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState("")
  const [inviteError, setInviteError] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const isLeader = isLeaderRole(currentUserRole)
  const leaderNeedsMinistry = isLeader && !currentUserMinistryId
  const leaderNeedsMinistryRole = isLeader && ministryRoles.length === 0

  const refreshUsersPage = useCallback(async () => {
    const [meRes, usersRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/users"),
    ])

    let nextCurrentUserRole = currentUserRole
    let nextCurrentUserMinistryId = currentUserMinistryId

    if (meRes.ok) {
      const meData = await meRes.json()
      nextCurrentUserRole = meData.user?.role || ""
      nextCurrentUserMinistryId =
        typeof meData.user?.ministryId === "string"
          ? meData.user.ministryId
          : ""
      setCurrentUserRole(nextCurrentUserRole)
      setCurrentUserMinistryId(nextCurrentUserMinistryId)
    }

    if (usersRes.ok) {
      const data = await usersRes.json()
      setUsers(data)
    }

    if (isLeaderRole(nextCurrentUserRole) && nextCurrentUserMinistryId) {
      const rolesRes = await fetch("/api/ministry-roles")

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setMinistryRoles(rolesData.roles || [])
      }
    } else {
      setMinistryRoles([])
    }
  }, [currentUserMinistryId, currentUserRole])

  useEffect(() => {
    let ignore = false

    Promise.all([fetch("/api/auth/me"), fetch("/api/users")])
      .then(async ([meRes, usersRes]) => {
        const meData = meRes.ok ? await meRes.json() : null
        const usersData = usersRes.ok ? await usersRes.json() : []
        const nextCurrentUserRole = meData?.user?.role || ""
        const nextCurrentUserMinistryId =
          typeof meData?.user?.ministryId === "string"
            ? meData.user.ministryId
            : ""
        const rolesRes =
          isLeaderRole(nextCurrentUserRole) && nextCurrentUserMinistryId
            ? await fetch("/api/ministry-roles")
            : null
        const rolesData = rolesRes?.ok ? await rolesRes.json() : null

        return {
          nextCurrentUserRole,
          nextCurrentUserMinistryId,
          usersData,
          rolesData,
        }
      })
      .then(({
        nextCurrentUserRole,
        nextCurrentUserMinistryId,
        usersData,
        rolesData,
      }) => {
        if (ignore) {
          return
        }

        setCurrentUserRole(nextCurrentUserRole)
        setCurrentUserMinistryId(nextCurrentUserMinistryId)
        setUsers(usersData)
        setMinistryRoles(rolesData?.roles || [])
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  async function handleDelete(id: string) {
    setDeleteError("")
    setDeletingUser(true)
    setSubmitting(true)

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()

      if (res.ok) {
        await refreshUsersPage()
        setUserToDelete(null)
      } else {
        setDeleteError(data?.message || "No se pudo eliminar el usuario.")
      }
    } catch {
      setDeleteError("No se pudo eliminar el usuario. Intenta de nuevo.")
    } finally {
      setDeletingUser(false)
      setSubmitting(false)
    }
  }

  async function handleCreateInvite() {
    setInviteLoading(true)
    setInviteError("")
    setInviteUrl("")

    const res = await fetch("/api/invites", {
      method: "POST",
    })
    const data = await res.json()

    setInviteLoading(false)

    if (res.ok) {
      setInviteUrl(data.inviteUrl)
      return
    }

    setInviteError(data?.message || "Error al generar la invitación")
  }

  async function handleCopyInvite() {
    if (!inviteUrl) return

    await navigator.clipboard.writeText(inviteUrl)
  }

  return (
    <div>
      <SubmittingOverlay
        show={submitting || inviteLoading}
        label={
          inviteLoading
            ? "Generando..."
            : deletingUser
              ? "Eliminando..."
              : "Guardando cambios..."
        }
        className="fixed z-[70]"
      />

      <TypographyH1 className="mb-6 text-left">
        Usuarios
      </TypographyH1>

      {isLeader ? (
        <section className="mb-6 space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Roles del ministerio</h2>
            <p className="text-sm text-muted-foreground">
              Crea primero los roles que tus colaboradores podrán desempeñar.
            </p>
          </div>
          {leaderNeedsMinistry ? (
            <p className="text-sm font-medium text-muted-foreground">
              Tienes que decirle al administrador que te asigne a tu ministerio.
            </p>
          ) : null}
          <MinistryRolesManager
            disabled={leaderNeedsMinistry}
            onRolesChange={setMinistryRoles}
            onSubmittingChange={setSubmitting}
          />
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => {
          setSelectedUser(null)
          setOpen(true)
        }} disabled={
          loading ||
          submitting ||
          inviteLoading ||
          leaderNeedsMinistry ||
          leaderNeedsMinistryRole
        }>
          + Nuevo usuario
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setInviteOpen(true)
            setInviteError("")
            setInviteUrl("")
          }}
          disabled={submitting || inviteLoading}
        >
          <LinkIcon className="h-4 w-4" />
          Crear link
        </Button>
      </div>

      <div className="mt-4 rounded-lg border bg-card text-card-foreground">
        <Table containerClassName="max-h-[60vh]">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              {isLeader ? <TableHead>Rol ministerial</TableHead> : null}
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeletonRows columns={isLeader ? 5 : 4} rows={6} />
            ) : users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.role === "pastor"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                {isLeader ? (
                  <TableCell>
                    {ministryRoles.find((role) => role._id === user.ministryRoleId)?.name || "-"}
                  </TableCell>
                ) : null}
                <TableCell>
                  <div className="flex items-center gap-2">

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user)
                              setOpen(true)
                            }}
                            disabled={submitting || inviteLoading}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Editar usuario
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => {
                              setUserToDelete(user)
                              setDeleteError("")
                            }}
                            disabled={submitting || inviteLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>

                        <TooltipContent>
                          Eliminar usuario
                        </TooltipContent>
                      </Tooltip>

                    </TooltipProvider>

                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <UserModal
          open={open}
          onOpenChange={setOpen}
          user={selectedUser}
          currentUserRole={currentUserRole}
          onSuccess={refreshUsersPage}
          submitting={submitting}
          onSubmittingChange={setSubmitting}
        />
      </div>

      <AlertDialog
        open={Boolean(userToDelete)}
        onOpenChange={(nextOpen) => {
          if (deletingUser && !nextOpen) return

          if (!nextOpen) {
            setUserToDelete(null)
            setDeleteError("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete
                ? `Se eliminará a ${userToDelete.name}. Esta acción no se puede deshacer.`
                : "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError ? (
            <p className="text-sm font-medium text-destructive">
              {deleteError}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (userToDelete) {
                  handleDelete(userToDelete._id)
                }
              }}
              disabled={!userToDelete || deletingUser}
            >
              {deletingUser ? (
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

      <Dialog
        open={inviteOpen}
        onOpenChange={(nextOpen) => {
          if (inviteLoading && !nextOpen) return

          setInviteOpen(nextOpen)
        }}
      >
        <DialogContent
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Link de registro</DialogTitle>
            <DialogDescription>
              Genera un enlace temporal para registrar miembros en esta iglesia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4" aria-busy={inviteLoading}>
            <p className="text-sm text-muted-foreground">
              Genera un enlace reutilizable para registrar varios miembros en esta iglesia. El enlace vence en 12 horas.
            </p>

            {inviteUrl ? (
              <div className="space-y-2">
                <Input value={inviteUrl} readOnly />
                <Button className="w-full" onClick={handleCopyInvite}>
                  <Copy className="h-4 w-4" />
                  Copiar link
                </Button>
              </div>
            ) : null}

            {inviteError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {inviteError}
              </div>
            ) : null}

            <Button
              className="w-full"
              onClick={handleCreateInvite}
              disabled={inviteLoading}
            >
              {inviteLoading ? (
                <>
                  <LoadingSpinner />
                  Generando...
                </>
              ) : (
                "Generar link"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
