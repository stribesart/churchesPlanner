"use client"

import { useEffect, useState } from "react"
import type { Leader } from "@/components/ministeries/leader-accordion"
import MinistryModal from "@/components/ministeries/ministry-modal"
import { SubmittingOverlay } from "@/components/ui/submitting-overlay"
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
  ministryId?: string
  name: string
  description: string
  leader: string
}

type User = Leader & {
  role?: string
}

function isLeaderUser(user: User) {
  const role = typeof user.role === "string" ? user.role.toLowerCase() : ""

  return role === "lider"
}

export default function MinisteriesPage() {
  const [ministeries, setMinisteries] = useState<Ministry[]>([])
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [open, setOpen] = useState(false)
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function fetchMinisteries() {
    const [ministeriesRes, usersRes] = await Promise.all([
      fetch("/api/ministeries"),
      fetch("/api/users"),
    ])
    const ministeriesData = await ministeriesRes.json()
    const usersData = await usersRes.json()

    setMinisteries(ministeriesData.ministeries || ministeriesData)
    setLeaders((Array.isArray(usersData) ? usersData : []).filter(isLeaderUser))
  }

  useEffect(() => {
    let ignore = false

    Promise.all([fetch("/api/ministeries"), fetch("/api/users")])
      .then(async ([ministeriesRes, usersRes]) => {
        const ministeriesData = await ministeriesRes.json()
        const usersData = await usersRes.json()

        return { ministeriesData, usersData }
      })
      .then(({ ministeriesData, usersData }) => {
        if (!ignore) {
          setMinisteries(ministeriesData.ministeries || ministeriesData)
          setLeaders(
            (Array.isArray(usersData) ? usersData : []).filter(isLeaderUser)
          )
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  async function handleDelete(id: string) {
    setSubmitting(true)

    try {
      const res = await fetch(`/api/ministeries/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await fetchMinisteries()
      } else {
        alert("Error al eliminar")
      }
    } finally {
      setSubmitting(false)
    }
  }

  function getLeaderName(leaderId: string) {
    const leader = leaders.find((availableLeader) => availableLeader._id === leaderId)

    return leader?.name || leader?.email || leaderId
  }


  return (
    <div>
      <SubmittingOverlay
        show={submitting}
        label="Guardando cambios..."
        className="fixed z-[70]"
      />

      <TypographyH1 className="mb-6 text-left">
        Ministerios
      </TypographyH1>

      <Button onClick={() => {
        setSelectedMinistry(null)
        setOpen(true)
      }} disabled={submitting}>
        + Nuevo ministerio
      </Button>

      <div className="bg-white rounded-lg border mt-4">
        <Table containerClassName="max-h-[60vh]">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Líder</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeletonRows columns={4} rows={5} />
            ) : ministeries.map((ministry) => (
              <TableRow key={ministry._id}>
                <TableCell>{ministry.name}</TableCell>
                <TableCell>{ministry.description}</TableCell>
                <TableCell>{getLeaderName(ministry.leader)}</TableCell>
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
                            disabled={submitting}
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
                              <Button
                                size="icon"
                                variant="destructive"
                                disabled={submitting}
                              >
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
                                  disabled={submitting}
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
        leaders={leaders}
        onSuccess={fetchMinisteries}
        submitting={submitting}
        onSubmittingChange={setSubmitting}
      />
    </div>
  )
}
