import { createHash } from "crypto"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import {
  addUserToTenantIndex,
  getTenantDbByName,
  getUserEmailOwner,
  normalizeEmail,
} from "@/lib/tenant"
import clientPromise from "@/lib/mongodb"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function isPasswordValid(password: string) {
  return /(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(password)
}

function hasReachedUseLimit(invite: unknown) {
  const inviteRecord = invite as Record<string, unknown>

  return (
    typeof inviteRecord.maxUses === "number" &&
    typeof inviteRecord.usedCount === "number" &&
    inviteRecord.usedCount >= inviteRecord.maxUses
  )
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { name, email, password } = await req.json()
  const normalizedEmail = normalizeEmail(email || "")

  if (!token || !name || !normalizedEmail || !password) {
    return NextResponse.json(
      { message: "Todos los campos son obligatorios" },
      { status: 400 }
    )
  }

  if (!isPasswordValid(password)) {
    return NextResponse.json(
      {
        message:
          "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, letras y un número",
      },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const globalDb = client.db("churchesPlanner")
  const invite = await globalDb.collection("invites").findOne({
    tokenHash: hashToken(token),
  })

  if (
    !invite ||
    invite.isActive === false ||
    hasReachedUseLimit(invite) ||
    invite.expiresAt < new Date()
  ) {
    return NextResponse.json(
      {
        message: "El enlace de invitación expiró o alcanzó su límite de registros",
      },
      { status: 410 }
    )
  }

  const existingEmailOwner = await getUserEmailOwner(normalizedEmail)

  if (existingEmailOwner) {
    return NextResponse.json(
      { message: "Ya existe una cuenta registrada con ese correo" },
      { status: 409 }
    )
  }

  const tenantDb = await getTenantDbByName(invite.dbName)
  const hashedPassword = await bcrypt.hash(password, 10)
  const role = typeof invite.defaultRole === "string" ? invite.defaultRole : "miembro"
  const trimmedName = name.trim()

  const newUser = {
    name: trimmedName,
    realName: trimmedName,
    displayName: trimmedName.split(" ")[0] || trimmedName,
    email: normalizedEmail,
    password: hashedPassword,
    role,
    ministryId: null,
    ministryRoleId: null,
    createdViaInvite: true,
    inviteTokenHash: invite.tokenHash,
    createdAt: new Date(),
    isActive: true,
  }

  const userResult = await tenantDb.collection("users").insertOne(newUser)

  await addUserToTenantIndex({
    email: normalizedEmail,
    dbName: invite.dbName,
    userId: userResult.insertedId,
    role,
  })

  await globalDb.collection("invites").updateOne(
    { _id: invite._id },
    {
      $inc: { usedCount: 1 },
      $set: {
        lastUsedByUserId: userResult.insertedId,
        lastUsedAt: new Date(),
      },
      $addToSet: { usedByUserIds: userResult.insertedId },
    }
  )

  return NextResponse.json({ message: "Cuenta creada correctamente" })
}
