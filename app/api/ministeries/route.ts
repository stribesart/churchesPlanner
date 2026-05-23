import { NextResponse } from "next/server"
import {
  getCurrentTenantUser,
  getTenantFromRequest,
  getTenantDbByName,
} from "@/lib/tenant"
import { ObjectId } from "mongodb"

function isLeaderRole(role: unknown) {
  if (typeof role !== "string") return false

  const normalizedRole = role.toLowerCase()

  return normalizedRole === "lider" || normalizedRole === "líder"
}

function getLeaderField(leader: unknown, field: string) {
  if (!leader || typeof leader !== "object" || !(field in leader)) {
    return ""
  }

  const value = (leader as { [key: string]: unknown })[field]

  return typeof value === "string" ? value.trim() : ""
}

function getLeaderDisplayName(leader: unknown) {
  const name = getLeaderField(leader, "name")
  const ministryId =
    getLeaderField(leader, "ministryId")
  const realName = getLeaderField(leader, "realName")
  const displayName = getLeaderField(leader, "displayName")
  const email = getLeaderField(leader, "email")

  if (name && name !== ministryId) return name
  if (realName && realName !== ministryId) return realName
  if (displayName && displayName !== ministryId) return displayName

  return email
}

export async function GET(req: Request) {
  const currentUser = await getCurrentTenantUser(req)
  const tenantDbName = currentUser?.tenantDbName

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const db = await getTenantDbByName(tenantDbName)
  const user = currentUser.user
  const userRole = typeof user.role === "string" ? user.role.toLowerCase() : ""
  const userMinistryId = typeof user.ministryId === "string" ? user.ministryId : null
  const userId = user._id.toString()

  const ministryFilter =
    userRole === "lider"
      ? {
          $or: [
            ...(userMinistryId ? [{ ministryId: userMinistryId }] : []),
            { leader: userId },
          ],
        }
      : {}

  const ministeries = await db.collection("ministeries").find(ministryFilter).toArray()

  // Obtener usuarios únicos que ya tienen un ministerio asignado
  const uniqueLeaderIds = Array.from(
    new Set(
      ministeries
        .map((ministry) => ministry.leader)
        .filter((id): id is string => typeof id === "string" && ObjectId.isValid(id))
    )
  )

  const leaderIds = uniqueLeaderIds.map((id) => new ObjectId(id))

  const assignedLeaders = leaderIds.length > 0
    ? await db.collection("users").find({ _id: { $in: leaderIds } }).toArray()
    : []
  const leaderFilter =
    userRole === "lider"
      ? { _id: user._id }
      : { role: { $in: ["lider", "líder"] } }
  const leaders = await db.collection("users").find(leaderFilter).toArray()
  const leadersById = new Map([
    ...assignedLeaders.map((leader) => [leader._id.toString(), leader] as const),
    ...leaders.map((leader) => [leader._id.toString(), leader] as const),
  ])
  const ministeriesWithLeader = ministeries.map((ministry) => {
    const leader =
      typeof ministry.leader === "string"
        ? leadersById.get(ministry.leader)
        : null

    return {
      ...ministry,
      leaderName: leader ? getLeaderDisplayName(leader) : "",
      leaderEmail:
        leader && typeof leader.email === "string" ? leader.email : "",
    }
  })

  return NextResponse.json({ 
    ministeries: ministeriesWithLeader, 
    leaders 
  })
}

export async function POST(req: Request) {
  const tenantDbName = await getTenantFromRequest(req)

  if (!tenantDbName) {
    return NextResponse.json(
      { message: "Acceso denegado" },
      { status: 401 }
    )
  }

  const { name, description, leader } = await req.json()

  const db = await getTenantDbByName(tenantDbName)

  if (typeof leader !== "string" || !ObjectId.isValid(leader)) {
    return NextResponse.json(
      { message: "Selecciona un líder válido" },
      { status: 400 }
    )
  }

  const selectedLeader = await db.collection("users").findOne({
    _id: new ObjectId(leader),
  })

  if (!selectedLeader || !isLeaderRole(selectedLeader.role)) {
    return NextResponse.json(
      { message: "El usuario seleccionado no es líder" },
      { status: 400 }
    )
  }

  if (typeof selectedLeader.ministryId === "string" && selectedLeader.ministryId) {
    return NextResponse.json(
      { message: "El líder seleccionado ya pertenece a un ministerio" },
      { status: 400 }
    )
  }

  // verificar si ya existe
  const existingMinistry = await db.collection("ministeries").findOne({ name })

  if (existingMinistry) {
    return NextResponse.json(
      { message: "El ministerio ya existe" },
      { status: 400 }
    )
  }

  const ministryObjectId = new ObjectId()
  const ministryId = ministryObjectId.toString()

  const newMinistry = {
    _id: ministryObjectId,
    ministryId,
    name,
    description,
    leader,
    createdAt: new Date(),
  }

  await db.collection("ministeries").insertOne(newMinistry)

  if (typeof leader === "string" && ObjectId.isValid(leader)) {
    await db.collection("users").updateOne(
      { _id: new ObjectId(leader) },
      { $set: { ministryId } }
    )
  }

  return NextResponse.json({ message: "Ministerio creado" })
}
