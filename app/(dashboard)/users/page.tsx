"use client"

import { useEffect, useState } from "react"
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
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"

type User = {
  _id: string
  name: string
  email: string
  role: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(data)
    }

    fetchUsers()
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
      fetchUsers() // refresca tabla
    } else {
      alert("Error al eliminar")
    }
  }

  async function fetchUsers() {
    const res = await fetch("/api/users")
    setUsers(await res.json())
  }

  return (
    <div>
      <TypographyH1 className="mb-6 text-left">
        Usuarios
      </TypographyH1>

      <Button onClick={() => {
        setSelectedUser(null)
        setOpen(true)
      }}>
        + Nuevo usuario
      </Button>

      <div className="bg-white rounded-lg border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
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
          onSuccess={fetchUsers}
        />
      </div>
    </div>
  )
}
