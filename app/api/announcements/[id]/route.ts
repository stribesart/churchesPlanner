import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import { ObjectId } from "mongodb"

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

    const { title, content, author } = await req.json()
    const db = await getTenantDbByName(tenantDbName)

    const updateData: { title?: string; content?: string; author?: string } = {}

    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (author !== undefined) updateData.author = author

    const result = await db.collection("announcements").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
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