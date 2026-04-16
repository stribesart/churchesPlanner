"use client"

import { useEffect, useState } from "react"
import UserModal from "@/components/users/user-modal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("miembro")

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(data)
    }

    fetchUsers()
  }, [])

  async function handleCreateUser() {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
    })

    if (res.ok) {
      alert("Usuario creado")

      // refrescar lista
      const updated = await fetch("/api/users")
      setUsers(await updated.json())

      // limpiar formulario
      setName("")
      setEmail("")
      setPassword("")
      setRole("miembro")
    } else {
      alert("Error al crear usuario")
    }
  }

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
      <h1 className="text-3xl font-bold mb-6">
        Usuarios
      </h1>

      <Dialog>
        <DialogTrigger asChild>
          <Button onClick={() => {
            setSelectedUser(null)
            setOpen(true)
          }}>
            + Nuevo usuario
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear usuario</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            <div>
              <Label>Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <Label>Rol</Label>
              <Select value={role} onValueChange={setRole} defaultValue="Miembro">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Pastor">Pastor</SelectItem>
                    <SelectItem value="Lider">Lider</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="Miembro">Miembro</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

            </div>

            <Button onClick={handleCreateUser} className="w-full">
              Crear usuario
            </Button>

          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg border">
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
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(user)
                      setOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        Eliminar
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