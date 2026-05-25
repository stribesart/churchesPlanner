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
