"use client"

import { useEffect, useState } from "react"
import MinistryModal from "@/components/ministeries/ministry-modal"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Pencil, Trash2 } from "lucide-react"

type Ministry = {
  _id: string
  name: string
  description: string
  leader: string
}

export default function MinisteriesPage() {
  const [ministeries, setMinisteries] = useState<Ministry[]>([])
  const [open, setOpen] = useState(false)
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null)

  async function fetchMinisteries() {
    const res = await fetch("/api/ministeries")
    const data = await res.json()
    setMinisteries(data.ministeries || data)
  }

  useEffect(() => {
    fetchMinisteries()
  }, [])

  async function handleDelete(id: string) {
    const res = await fetch(`/api/ministeries/${id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      fetchMinisteries()
    } else {
      alert("Error al eliminar")
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Ministerios
      </h1>

      <Button onClick={() => {
        setSelectedMinistry(null)
        setOpen(true)
      }}>
        + Nuevo ministerio
      </Button>

      <div className="bg-white rounded-lg border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Líder</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {ministeries.map((ministry) => (
              <TableRow key={ministry._id}>
                <TableCell>{ministry.name}</TableCell>
                <TableCell>{ministry.description}</TableCell>
                <TableCell>{ministry.leader}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setSelectedMinistry(ministry)
                              setOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Editar ministerio
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
                                  ¿Eliminar ministerio?
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
                                  onClick={() => handleDelete(ministry._id)}
                                >
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TooltipTrigger>

                        <TooltipContent>
                          Eliminar ministerio
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MinistryModal
        open={open}
        onOpenChange={setOpen}
        ministry={selectedMinistry}
        onSuccess={fetchMinisteries}
      />
    </div>
  )
}