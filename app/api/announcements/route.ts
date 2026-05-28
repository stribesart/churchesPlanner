import { NextResponse } from "next/server"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import { ObjectId } from "mongodb"

function getUserDisplayName(user: unknown) {
  if (!user || typeof user !== "object") return ""

  const fields = ["name", "realName", "displayName", "email"]

  for (const field of fields) {
    const value = (user as Record<string, unknown>)[field]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

function parseAnnouncementInput(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const content = typeof body.content === "string" ? body.content.trim() : ""
  const author = typeof body.author === "string" ? body.author.trim() : ""

  if (!title) return { ok: false as const, message: "El título es obligatorio" }
  if (!content) return { ok: false as const, message: "El contenido es obligatorio" }
  if (!author) return { ok: false as const, message: "El autor es obligatorio" }

  return { ok: true as const, announcement: { title, content, author } }
}

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
  const authorIds = Array.from(
    new Set(
      announcements
        .map((announcement) => announcement.author)
        .filter(
          (author): author is string =>
            typeof author === "string" && ObjectId.isValid(author)
        )
    )
  )
  const authors =
    authorIds.length > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: authorIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : []
  const authorsById = new Map(
    authors.map((author) => [author._id.toString(), author])
  )
  const announcementsWithAuthorName = announcements.map((announcement) => {
    const author =
      typeof announcement.author === "string"
        ? authorsById.get(announcement.author)
        : null
    const authorName = getUserDisplayName(author)

    return {
      ...announcement,
      authorName:
        authorName ||
        (typeof announcement.author === "string" &&
        announcement.author.trim() &&
        !ObjectId.isValid(announcement.author)
          ? announcement.author
          : "Sistema"),
    }
  })

  return NextResponse.json(announcementsWithAuthorName)
}

export async function POST(req: Request) {
  const tenantDbName = await getTenantFromRequest(req)

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const body = await req.json()
  const parsed = parseAnnouncementInput(body)

  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 })
  }

  const db = await getTenantDbByName(tenantDbName)

  const newAnnouncement = {
    ...parsed.announcement,
    createdAt: new Date(),
  }

  await db.collection("announcements").insertOne(newAnnouncement)

  return NextResponse.json({ message: "Anuncio creado" })
}
