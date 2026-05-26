"use client"

import { useEffect, useMemo, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { TypographyH1 } from "@/components/ui/typography"

type InventoryItem = {
  _id: string
  name: string
  quantity: number
  condition: InventoryCondition
  status: InventoryStatus
  location?: string
  ministryId?: string | null
  assignedTo?: string | null
  assignedToName?: string
  ministryName?: string
  createdByName?: string
  updatedByName?: string
  notes?: string
}

type Ministry = {
  _id: string
  ministryId?: string
  name: string
}

type User = {
  _id: string
  name: string
  email: string
  role?: string
  ministryId?: string | null
}

type CurrentUser = User

type InventoryCondition = "new" | "good" | "regular" | "damaged"
type InventoryStatus =
  | "available"
  | "in_use"
  | "maintenance"
  | "lost"
  | "retired"

const conditionLabels: Record<InventoryCondition, string> = {
  new: "Nuevo",
  good: "Bueno",
  regular: "Regular",
  damaged: "Dañado",
}

const statusLabels: Record<InventoryStatus, string> = {
  available: "Disponible",
  in_use: "En uso",
  maintenance: "Mantenimiento",
  lost: "Perdido",
  retired: "Dado de baja",
}

const generalValue = "__general"
const noneValue = "__none"

function isLeaderRole(role?: string) {
  const normalizedRole = (role || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  return normalizedRole === "lider"
}

function getMinistryKey(ministry: Ministry) {
  return ministry.ministryId || ministry._id
}

function getMinistryName(ministryId: string | null | undefined, ministeries: Ministry[]) {
  if (!ministryId) return "General"

  return (
    ministeries.find((ministry) => getMinistryKey(ministry) === ministryId)
      ?.name || "Ministerio no encontrado"
  )
}

function getUserName(userId: string | null | undefined, users: User[]) {
  if (!userId) return "-"

  const user = users.find((item) => item._id === userId)

  return user?.name || user?.email || "Usuario no encontrado"
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [ministeries, setMinisteries] = useState<Ministry[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  const leader = isLeaderRole(currentUser?.role)
  const currentMinistryId =
    typeof currentUser?.ministryId === "string" && currentUser.ministryId
      ? currentUser.ministryId
      : null

  async function fetchInventoryPage() {
    setPageError("")

    const [meRes, inventoryRes, ministeriesRes, usersRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/inventory"),
      fetch("/api/ministeries"),
      fetch("/api/users"),
    ])

    if (!inventoryRes.ok) {
      const inventoryError = await inventoryRes.json()
      setPageError(inventoryError?.message || "No se pudo cargar el inventario")
      setItems([])
      return
    }

    if (meRes.ok) {
      const meData = await meRes.json()
      setCurrentUser(meData.user || null)
    }

    const inventoryData = await inventoryRes.json()
    setItems(Array.isArray(inventoryData.items) ? inventoryData.items : [])

    if (ministeriesRes.ok) {
      const ministeriesData = await ministeriesRes.json()
      const nextMinisteries = ministeriesData.ministeries || ministeriesData || []
      setMinisteries(Array.isArray(nextMinisteries) ? nextMinisteries : [])
    } else {
      setMinisteries([])
    }

    if (usersRes.ok) {
      const usersData = await usersRes.json()
      setUsers(Array.isArray(usersData) ? usersData : [])
    } else {
      setUsers([])
    }
  }

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        await fetchInventoryPage()
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [])

  async function handleDelete(id: string) {
    const res = await fetch(`/api/inventory/${id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      fetchInventoryPage()
    } else {
      const data = await res.json()
      alert(data?.message || "Error al eliminar")
    }
  }

  const ministeriesByKey = useMemo(() => {
    return new Map(ministeries.map((ministry) => [getMinistryKey(ministry), ministry]))
  }, [ministeries])

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <TypographyH1 className="text-left">Inventario</TypographyH1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recursos asignados a la iglesia y sus ministerios.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedItem(null)
            setOpen(true)
          }}
        >
          + Nuevo recurso
        </Button>
      </div>

      <div className="mt-6 rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Condición</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Ministerio</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Creado por</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageError ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-destructive">
                  {pageError}
                </TableCell>
              </TableRow>
            ) : loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Cargando inventario...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Todavía no hay recursos registrados.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const canEdit =
                  !leader || (item.ministryId && item.ministryId === currentMinistryId)

                return (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{conditionLabels[item.condition] || item.condition}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {statusLabels[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.location || "-"}</TableCell>
                    <TableCell>
                      {item.ministryName || getMinistryName(item.ministryId, ministeries)}
                    </TableCell>
                    <TableCell>
                      {item.assignedToName || getUserName(item.assignedTo, users)}
                    </TableCell>
                    <TableCell>{item.createdByName || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={!canEdit}
                          onClick={() => {
                            setSelectedItem(item)
                            setOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive" disabled={!canEdit}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar recurso?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <p className="text-sm text-muted-foreground">
                              Esta acción no se puede deshacer.
                            </p>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item._id)}>
                                Sí, eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <InventoryDialog
        open={open}
        onOpenChange={setOpen}
        item={selectedItem}
        ministeries={ministeries}
        users={users}
        leader={leader}
        currentMinistryId={currentMinistryId}
        currentMinistryName={
          currentMinistryId
            ? ministeriesByKey.get(currentMinistryId)?.name || "tu ministerio"
            : "tu ministerio"
        }
        onSuccess={fetchInventoryPage}
      />
    </div>
  )
}

function InventoryDialog({
  open,
  onOpenChange,
  item,
  ministeries,
  users,
  leader,
  currentMinistryId,
  currentMinistryName,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem | null
  ministeries: Ministry[]
  users: User[]
  leader: boolean
  currentMinistryId: string | null
  currentMinistryName: string
  onSuccess: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <InventoryForm
        key={`${item?._id || "new"}-${open ? "open" : "closed"}`}
        onOpenChange={onOpenChange}
        item={item}
        ministeries={ministeries}
        users={users}
        leader={leader}
        currentMinistryId={currentMinistryId}
        currentMinistryName={currentMinistryName}
        onSuccess={onSuccess}
      />
    </Dialog>
  )
}

function InventoryForm({
  onOpenChange,
  item,
  ministeries,
  users,
  leader,
  currentMinistryId,
  currentMinistryName,
  onSuccess,
}: {
  onOpenChange: (open: boolean) => void
  item: InventoryItem | null
  ministeries: Ministry[]
  users: User[]
  leader: boolean
  currentMinistryId: string | null
  currentMinistryName: string
  onSuccess: () => void
}) {
  const [name, setName] = useState(item?.name || "")
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1))
  const [condition, setCondition] = useState<InventoryCondition>(item?.condition || "good")
  const [status, setStatus] = useState<InventoryStatus>(item?.status || "available")
  const [location, setLocation] = useState(item?.location || "")
  const [ministryId, setMinistryId] = useState(
    item?.ministryId || (leader && currentMinistryId ? currentMinistryId : generalValue)
  )
  const [assignedTo, setAssignedTo] = useState(item?.assignedTo || noneValue)
  const [notes, setNotes] = useState(item?.notes || "")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(item)

  async function handleSubmit() {
    setSaving(true)
    setError("")

    const resolvedMinistryId = leader
      ? currentMinistryId
      : ministryId === generalValue
        ? null
        : ministryId

    const res = await fetch(isEdit ? `/api/inventory/${item?._id}` : "/api/inventory", {
      method: isEdit ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        quantity: Number(quantity),
        condition,
        status,
        location,
        ministryId: resolvedMinistryId,
        assignedTo: assignedTo === noneValue ? null : assignedTo,
        notes,
      }),
    })
    const data = await res.json()

    setSaving(false)

    if (res.ok) {
      onSuccess()
      onOpenChange(false)
      return
    }

    setError(data?.message || "Error al guardar")
  }

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Editar recurso" : "Nuevo recurso"}</DialogTitle>
      </DialogHeader>

      <FieldGroup className="max-h-[70vh] overflow-y-auto pr-1">
        <Field>
          <FieldLabel>Nombre</FieldLabel>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Micrófono, silla, consola..."
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Cantidad</FieldLabel>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Ubicación</FieldLabel>
            <Input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Bodega, auditorio, salón..."
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Condición</FieldLabel>
            <Select value={condition} onValueChange={(value) => setCondition(value as InventoryCondition)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(conditionLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Estado</FieldLabel>
            <Select value={status} onValueChange={(value) => setStatus(value as InventoryStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel>Ministerio</FieldLabel>
          {leader ? (
            <>
              <Input value={currentMinistryName} disabled />
              <FieldDescription>
                Los líderes solo pueden crear recursos para su ministerio.
              </FieldDescription>
            </>
          ) : (
            <Select value={ministryId} onValueChange={setMinistryId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={generalValue}>Inventario general</SelectItem>
                {ministeries.map((ministry) => (
                  <SelectItem key={ministry._id} value={getMinistryKey(ministry)}>
                    {ministry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>

        <Field>
          <FieldLabel>Responsable</FieldLabel>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={noneValue}>Sin responsable</SelectItem>
              {users.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Notas</FieldLabel>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Detalles, accesorios incluidos, restricciones de uso..."
          />
        </Field>

        <FieldError>{error}</FieldError>
      </FieldGroup>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
