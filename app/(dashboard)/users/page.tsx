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
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
  const [currentUserRole, setCurrentUserRole] = useState("")
  const [ministryRoles, setMinistryRoles] = useState<MinistryRole[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState("")
  const [inviteError, setInviteError] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const isLeader = isLeaderRole(currentUserRole)

  const refreshUsersPage = useCallback(async () => {
    const [meRes, usersRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/users"),
    ])

    let nextCurrentUserRole = currentUserRole

    if (meRes.ok) {
      const meData = await meRes.json()
      nextCurrentUserRole = meData.user?.role || ""
      setCurrentUserRole(nextCurrentUserRole)
    }

    if (usersRes.ok) {
      const data = await usersRes.json()
      setUsers(data)
    }

    if (isLeaderRole(nextCurrentUserRole)) {
      const rolesRes = await fetch("/api/ministry-roles")

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setMinistryRoles(rolesData.roles || [])
      }
    } else {
      setMinistryRoles([])
    }
  }, [currentUserRole])

  useEffect(() => {
    let ignore = false

    Promise.all([fetch("/api/auth/me"), fetch("/api/users")])
      .then(async ([meRes, usersRes]) => {
        const meData = meRes.ok ? await meRes.json() : null
        const usersData = usersRes.ok ? await usersRes.json() : []
        const nextCurrentUserRole = meData?.user?.role || ""
        const rolesRes =
          isLeaderRole(nextCurrentUserRole)
            ? await fetch("/api/ministry-roles")
            : null
        const rolesData = rolesRes?.ok ? await rolesRes.json() : null

        return { nextCurrentUserRole, usersData, rolesData }
      })
      .then(({ nextCurrentUserRole, usersData, rolesData }) => {
        if (ignore) {
          return
        }

        setCurrentUserRole(nextCurrentUserRole)
        setUsers(usersData)
        setMinistryRoles(rolesData?.roles || [])
      })

    return () => {
      ignore = true
    }
  }, [])

  async function handleDelete(id: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })

    if (res.ok) {
      refreshUsersPage()
    } else {
      alert("Error al eliminar")
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
          <MinistryRolesManager onRolesChange={setMinistryRoles} />
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => {
          setSelectedUser(null)
          setOpen(true)
        }}>
          + Nuevo usuario
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setInviteOpen(true)
            setInviteError("")
            setInviteUrl("")
          }}
        >
          <LinkIcon className="h-4 w-4" />
          Crear link
        </Button>
      </div>

      <div className="bg-white rounded-lg border mt-4">
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
            {users.map((user) => (
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Eliminar usuario?
                                </AlertDialogTitle>
                              </AlertDialogHeader>

                              <p className="text-sm text-gray-500">
                                Esta acción no se puede deshacer.
                              </p>

                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Cancelar
                                </AlertDialogCancel>

                                <AlertDialogAction
                                  onClick={() => handleDelete(user._id)}
                                >
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
        />
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de registro</DialogTitle>
            <DialogDescription>
              Genera un enlace temporal para registrar un miembro en esta iglesia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Genera un enlace de un solo uso para registrar un miembro en esta iglesia. El enlace vence en 12 horas.
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
              {inviteLoading ? "Generando..." : "Generar link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
