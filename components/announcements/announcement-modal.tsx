"use client"

import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Announcement = {
  _id?: string
  title: string
  content: string
  author: string
  date?: string
  registry?: AnnouncementRegistry | null
}

type AnnouncementAuthor = {
  _id: string
  name?: string
  realName?: string
  displayName?: string
  email?: string
  role?: string
}

type AnnouncementRegistry = {
  name: string
  email: string
}

type CurrentUser = {
  name?: string
  realName?: string
  displayName?: string
  email?: string
}

type AnnouncementField = "title" | "content" | "date" | "author" | "registry"
type AnnouncementFieldErrors = Partial<Record<AnnouncementField, string>>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void> | void
  announcement?: Announcement | null
  authors: AnnouncementAuthor[]
  currentUser?: CurrentUser | null
  submitting: boolean
  onSubmittingChange: (submitting: boolean) => void
}

function normalizeAuthorRole(role?: string) {
  const normalizedRole = (role || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  return normalizedRole === "administrador" ? "pastor" : normalizedRole
}

function getRoleLabel(role?: string) {
  const normalizedRole = normalizeAuthorRole(role)

  if (normalizedRole === "pastor" || normalizedRole === "admin") {
    return "Administradores / Pastor"
  }

  if (normalizedRole === "lider") {
    return "Líderes"
  }

  return "Otros"
}

function getAuthorLabel(author?: AnnouncementAuthor) {
  if (!author) return "Selecciona un autor"

  return (
    author.name?.trim() ||
    author.realName?.trim() ||
    author.displayName?.trim() ||
    author.email ||
    "Usuario sin nombre"
  )
}

function getCurrentUserName(user?: CurrentUser | null) {
  if (!user) return ""

  return (
    user.name?.trim() ||
    user.realName?.trim() ||
    user.displayName?.trim() ||
    ""
  )
}

function groupAuthors(authors: AnnouncementAuthor[]) {
  const adminAuthors = authors.filter((author) =>
    ["pastor", "admin"].includes(normalizeAuthorRole(author.role))
  )
  const leaderAuthors = authors.filter(
    (author) => normalizeAuthorRole(author.role) === "lider"
  )

  return [
    { label: "Administradores / Pastor", authors: adminAuthors },
    { label: "Líderes", authors: leaderAuthors },
  ].filter((group) => group.authors.length > 0)
}

function AuthorAccordion({
  authors,
  value,
  onValueChange,
  invalid = false,
}: {
  authors: AnnouncementAuthor[]
  value: string
  onValueChange: (value: string) => void
  invalid?: boolean
}) {
  const selectedAuthor = authors.find((author) => author._id === value)
  const selectedLabel = selectedAuthor
    ? `${getAuthorLabel(selectedAuthor)} · ${getRoleLabel(selectedAuthor.role)}`
    : "Selecciona un autor"

  return (
    <Accordion
      type="single"
      collapsible
      aria-invalid={invalid}
      className={cn(
        "rounded-lg border",
        invalid && "border-destructive ring-3 ring-destructive/20"
      )}
    >
      <AccordionItem value="authors" className="border-b-0 px-3">
        <AccordionTrigger className="hover:no-underline">
          {selectedLabel}
        </AccordionTrigger>
        <AccordionContent className="max-h-64 overflow-y-auto pb-3 pr-1">
          {authors.length > 0 ? (
            <div className="grid gap-4">
              {groupAuthors(authors).map((group) => (
                <div key={group.label} className="grid gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="grid gap-2">
                    {group.authors.map((author) => (
                      <button
                        key={author._id}
                        type="button"
                        onClick={() => onValueChange(author._id)}
                        className={cn(
                          "rounded-md border px-3 py-2 text-left text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          value === author._id
                            ? "border-primary bg-muted font-medium"
                            : "border-transparent"
                        )}
                      >
                        <span className="block">{getAuthorLabel(author)}</span>
                        {author.email ? (
                          <span className="block text-xs text-muted-foreground">
                            {author.email}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              No hay autores disponibles.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default function AnnouncementModal({
  open,
  onOpenChange,
  onSuccess,
  announcement,
  authors,
  currentUser,
  submitting,
  onSubmittingChange,
}: Props) {
  function handleOpenChange(nextOpen: boolean) {
    if (submitting && !nextOpen) return

    onOpenChange(nextOpen)
  }

  const isEdit = !!announcement

  const [title, setTitle] = useState(announcement?.title ?? "")
  const [content, setContent] = useState(announcement?.content ?? "")
  const [date, setDate] = useState(announcement?.date ?? "")
  const [author, setAuthor] = useState(announcement?.author ?? "")
  const [includeRegistry, setIncludeRegistry] = useState(
    Boolean(announcement?.registry)
  )
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<AnnouncementFieldErrors>({})
  const registryName = getCurrentUserName(currentUser)
  const registryEmail = currentUser?.email?.trim() || ""

  async function handleSubmit() {
    setError("")
    setFieldErrors({})

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const trimmedDate = date.trim()
    const trimmedAuthor = author.trim()
    const nextFieldErrors: AnnouncementFieldErrors = {}

    if (!trimmedTitle) {
      nextFieldErrors.title = "El título es obligatorio."
    }

    if (!trimmedContent) {
      nextFieldErrors.content = "El contenido es obligatorio."
    } else if (trimmedContent.length < 50) {
      nextFieldErrors.content =
        "La descripción debe tener al menos 50 caracteres."
    }

    if (!trimmedDate) {
      nextFieldErrors.date = "Selecciona la fecha del anuncio."
    }

    if (!trimmedAuthor) {
      nextFieldErrors.author = "El autor es obligatorio."
    } else if (!authors.some((authorOption) => authorOption._id === trimmedAuthor)) {
      nextFieldErrors.author = "Selecciona un autor válido."
    }

    if (includeRegistry && (!registryName || !registryEmail)) {
      nextFieldErrors.registry =
        "No se pudo cargar la información del usuario para el registro."
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }

    const url = isEdit
      ? `/api/announcements/${announcement?._id}`
      : "/api/announcements"

    const method = isEdit ? "PUT" : "POST"

    onSubmittingChange(true)

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          date: trimmedDate,
          author: trimmedAuthor,
          registry: includeRegistry
            ? {
                name: registryName,
                email: registryEmail,
              }
            : undefined,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        await onSuccess()
        onOpenChange(false)
      } else {
        setError(data?.message || "No se pudo guardar el anuncio. Intenta de nuevo.")
      }
    } catch {
      setError("No se pudo guardar el anuncio. Intenta de nuevo.")
    } finally {
      onSubmittingChange(false)
    }
  }

  function clearFieldError(field: AnnouncementField) {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]

      return nextErrors
    })
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-hidden sm:max-w-lg"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >

        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar anuncio" : "Crear anuncio"}
          </DialogTitle>
          <DialogDescription>
            Completa la información que verá la comunidad.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup aria-busy={submitting}>
          <Field>
            <FieldLabel>Título</FieldLabel>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                clearFieldError("title")
              }}
              aria-invalid={Boolean(fieldErrors.title)}
              disabled={submitting}
            />
            <FieldError>{fieldErrors.title}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Contenido</FieldLabel>
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                clearFieldError("content")
              }}
              aria-invalid={Boolean(fieldErrors.content)}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 50 caracteres. Actual: {content.trim().length}
            </p>
            <FieldError>{fieldErrors.content}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Fecha</FieldLabel>
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                clearFieldError("date")
              }}
              aria-invalid={Boolean(fieldErrors.date)}
              disabled={submitting}
            />
            <FieldError>{fieldErrors.date}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Autor</FieldLabel>
            <AuthorAccordion
              authors={authors}
              value={author}
              onValueChange={(value) => {
                setAuthor(value)
                clearFieldError("author")
              }}
              invalid={Boolean(fieldErrors.author)}
            />
            <FieldError>{fieldErrors.author}</FieldError>
          </Field>

          <Field>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={includeRegistry}
                onChange={(event) => {
                  setIncludeRegistry(event.target.checked)
                  clearFieldError("registry")
                }}
                className="h-4 w-4 accent-primary"
                disabled={submitting}
              />
              Incluir registro del usuario
            </label>
            {includeRegistry ? (
              <div className="grid gap-3 rounded-lg border bg-muted/30 p-3">
                <Field>
                  <FieldLabel>Nombre del usuario</FieldLabel>
                  <Input value={registryName} readOnly />
                </Field>
                <Field>
                  <FieldLabel>Correo del usuario</FieldLabel>
                  <Input value={registryEmail} readOnly />
                </Field>
              </div>
            ) : null}
            <FieldError>{fieldErrors.registry}</FieldError>
          </Field>

          <FieldError>{error}</FieldError>
        </FieldGroup>

        <DialogFooter>
          <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <LoadingSpinner />
                {isEdit ? "Actualizando..." : "Creando..."}
              </>
            ) : isEdit ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
