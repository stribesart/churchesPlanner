import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"

export async function GET(req: Request) {
  const tenantDbName = await getTenantFromRequest(req)

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const db = await getTenantDbByName(tenantDbName)
  const announcements = await db.collection("announcements").find().toArray()

  return NextResponse.json(announcements)
}

export async function POST(req: Request) {
  const tenantDbName = await getTenantFromRequest(req)

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const { title, content, author } = await req.json()
  const db = await getTenantDbByName(tenantDbName)

  const newAnnouncement = {
    title,
    content,
    author,
    createdAt: new Date(),
  }

  await db.collection("announcements").insertOne(newAnnouncement)

  return NextResponse.json({ message: "Anuncio creado" })
}