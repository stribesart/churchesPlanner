import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import { ObjectId } from "mongodb"

function parseAnnouncementInput(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const content = typeof body.content === "string" ? body.content.trim() : ""
  const date = typeof body.date === "string" ? body.date.trim() : ""
  const author = typeof body.author === "string" ? body.author.trim() : ""
  const registryInput =
    body.registry && typeof body.registry === "object"
      ? (body.registry as Record<string, unknown>)
      : null
  const registryName =
    typeof registryInput?.name === "string" ? registryInput.name.trim() : ""
  const registryEmail =
    typeof registryInput?.email === "string" ? registryInput.email.trim() : ""

  if (!title) return { ok: false as const, message: "El título es obligatorio" }
  if (!content) return { ok: false as const, message: "El contenido es obligatorio" }
  if (content.length < 50) {
    return {
      ok: false as const,
      message: "La descripción debe tener al menos 50 caracteres",
    }
  }
  if (!date) return { ok: false as const, message: "Selecciona la fecha del anuncio" }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false as const, message: "Selecciona una fecha válida" }
  }
  if (Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    return { ok: false as const, message: "Selecciona una fecha válida" }
  }
  if (!author) return { ok: false as const, message: "El autor es obligatorio" }

  if (registryInput && (!registryName || !registryEmail)) {
    return {
      ok: false as const,
      message: "El registro debe incluir nombre y correo del usuario",
    }
  }

  return {
    ok: true as const,
    announcement: {
      title,
      content,
      date,
      author,
      ...(registryInput
        ? { registry: { name: registryName, email: registryEmail } }
        : { registry: null }),
    },
  }
}

function normalizeRole(role: unknown) {
  if (typeof role !== "string") return ""

  const normalizedRole = role
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  return normalizedRole === "administrador" ? "pastor" : normalizedRole
}

function canAuthorAnnouncement(role: unknown) {
  return ["pastor", "admin", "lider"].includes(normalizeRole(role))
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantDbName = await getTenantFromRequest(req)

    if (!tenantDbName) {
      return NextResponse.json(
        { message: "Acceso denegado" },
        { status: 401 }
      )
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Anuncio no válido" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parsed = parseAnnouncementInput(body)

    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 })
    }

    const db = await getTenantDbByName(tenantDbName)
    const authorUser = ObjectId.isValid(parsed.announcement.author)
      ? await db.collection("users").findOne({
          _id: new ObjectId(parsed.announcement.author),
        })
      : null

    if (!authorUser || !canAuthorAnnouncement(authorUser.role)) {
      return NextResponse.json(
        { message: "Selecciona un autor válido" },
        { status: 400 }
      )
    }

    const result = await db.collection("announcements").updateOne(
      { _id: new ObjectId(id) },
      { $set: parsed.announcement }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Anuncio no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Anuncio actualizado" })

  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantDbName = await getTenantFromRequest(req)

    if (!tenantDbName) {
      return NextResponse.json(
        { message: "Acceso denegado" },
        { status: 401 }
      )
    }

    const db = await getTenantDbByName(tenantDbName)

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Anuncio no válido" },
        { status: 400 }
      )
    }

    const result = await db.collection("announcements").deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Anuncio no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Anuncio eliminado" })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    )
  }
}
