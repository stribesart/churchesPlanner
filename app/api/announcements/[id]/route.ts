import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import { ObjectId } from "mongodb"

function parseAnnouncementInput(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const content = typeof body.content === "string" ? body.content.trim() : ""
  const author = typeof body.author === "string" ? body.author.trim() : ""

  if (!title) return { ok: false as const, message: "El título es obligatorio" }
  if (!content) return { ok: false as const, message: "El contenido es obligatorio" }
  if (!author) return { ok: false as const, message: "El autor es obligatorio" }

  return { ok: true as const, announcement: { title, content, author } }
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
