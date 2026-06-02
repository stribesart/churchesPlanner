import clientPromise from "@/lib/mongodb"
import { readSignedSession, sessionUserToDocument } from "@/lib/session"
import { ObjectId, type Db } from "mongodb"

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function getTenantByEmail(email: string) {
  const client = await clientPromise
  const globalDb = client.db("churchesPlanner")
  const normalizedEmail = normalizeEmail(email)

  const tenantFromUsers = await globalDb.collection("userIndex").findOne(
    { email: normalizedEmail },
    { collation: { locale: "en", strength: 2 } }
  )
  if (tenantFromUsers) {
    return tenantFromUsers
  }

  return await globalDb.collection("churches").findOne(
    { email: normalizedEmail },
    { collation: { locale: "en", strength: 2 } }
  )
}

export async function getGlobalEmailOwner(email: string) {
  const client = await clientPromise
  const globalDb = client.db("churchesPlanner")
  const normalizedEmail = normalizeEmail(email)

  const userIndexOwner = await globalDb.collection("userIndex").findOne(
    { email: normalizedEmail },
    { collation: { locale: "en", strength: 2 } }
  )

  if (userIndexOwner) {
    return {
      source: "userIndex",
      dbName: userIndexOwner.dbName,
      userId: userIndexOwner.userId,
      email: userIndexOwner.email,
    }
  }

  const churchOwner = await globalDb.collection("churches").findOne(
    { email: normalizedEmail },
    { collation: { locale: "en", strength: 2 } }
  )

  if (churchOwner) {
    return {
      source: "churches",
      dbName: churchOwner.dbName,
      userId: churchOwner.adminUserId,
      email: churchOwner.email,
    }
  }

  return null
}

export async function getUserEmailOwner(email: string) {
  const client = await clientPromise
  const globalDb = client.db("churchesPlanner")
  const normalizedEmail = normalizeEmail(email)

  const userIndexOwner = await globalDb.collection("userIndex").findOne(
    { email: normalizedEmail },
    { collation: { locale: "en", strength: 2 } }
  )

  if (!userIndexOwner) {
    return null
  }

  return {
    source: "userIndex",
    dbName: userIndexOwner.dbName,
    userId: userIndexOwner.userId,
    email: userIndexOwner.email,
  }
}

export async function getTenantDbByName(dbName: string): Promise<Db> {
  const client = await clientPromise
  return client.db(dbName)
}

export async function addUserToTenantIndex({
  email,
  dbName,
  userId,
  role,
}: {
  email: string
  dbName: string
  userId: ObjectId
  role: string
}) {
  const client = await clientPromise
  const globalDb = client.db("churchesPlanner")
  const church = await globalDb.collection("churches").findOne({ dbName })
  const normalizedEmail = normalizeEmail(email)

  await globalDb.collection("userIndex").insertOne({
    email: normalizedEmail,
    dbName,
    tenantKey: church?.tenantKey,
    churchName: church?.churchName,
    userId,
    role,
    createdAt: new Date(),
  })
}

export async function updateUserTenantIndex({
  dbName,
  userId,
  email,
  role,
}: {
  dbName: string
  userId: ObjectId
  email?: string
  role?: string
}) {
  const client = await clientPromise
  const globalDb = client.db("churchesPlanner")
  const updateData: { email?: string; role?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  }

  if (email) updateData.email = normalizeEmail(email)
  if (role) updateData.role = role

  await globalDb.collection("userIndex").updateOne(
    { userId, dbName },
    { $set: updateData }
  )
}

export async function removeUserFromTenantIndex(dbName: string, userId: ObjectId) {
  const client = await clientPromise
  const globalDb = client.db("churchesPlanner")

  await globalDb.collection("userIndex").deleteOne({ userId, dbName })
}

function getCookieValue(req: Request | { headers: Headers }, name: string) {
  const cookie = req.headers.get("cookie") || ""
  const value = cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split("=")[1]

  return value ? decodeURIComponent(value) : null
}

export async function getTenantFromRequest(req: Request | { headers: Headers }) {
  const signedSession = readSignedSession(req)

  if (signedSession) {
    return signedSession.tenantDbName
  }

  const session = getCookieValue(req, "session")
  const tenant = getCookieValue(req, "tenant")

  if (!session || !tenant || !ObjectId.isValid(session)) {
    return null
  }

  const client = await clientPromise
  const globalDb = client.db("churchesPlanner")

  const tenantAccess = await globalDb.collection("userIndex").findOne({
    userId: new ObjectId(session),
    dbName: tenant,
  })

  return tenantAccess?.dbName || null
}

export async function getCurrentTenantUser(req: Request | { headers: Headers }) {
  const signedSession = readSignedSession(req)

  if (signedSession) {
    return {
      tenantDbName: signedSession.tenantDbName,
      user: sessionUserToDocument(signedSession),
    }
  }

  const session = getCookieValue(req, "session")
  const tenantDbName = await getTenantFromRequest(req)

  if (!session || !tenantDbName || !ObjectId.isValid(session)) {
    return null
  }

  const tenantDb = await getTenantDbByName(tenantDbName)
  const user = await tenantDb.collection("users").findOne({
    _id: new ObjectId(session),
  })

  if (!user) {
    return null
  }

  return {
    tenantDbName,
    user,
  }
}
