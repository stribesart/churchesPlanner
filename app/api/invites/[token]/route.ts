import { createHash } from "crypto"
import { NextResponse } from "next/server"

import clientPromise from "@/lib/mongodb"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function hasReachedUseLimit(invite: unknown) {
  const inviteRecord = invite as Record<string, unknown>

  return (
    typeof inviteRecord.maxUses === "number" &&
    typeof inviteRecord.usedCount === "number" &&
    inviteRecord.usedCount >= inviteRecord.maxUses
  )
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token) {
    return NextResponse.json(
      { message: "Invitación no válida" },
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

  return NextResponse.json({
    churchName: invite.churchName,
    defaultRole: invite.defaultRole,
    expiresAt: invite.expiresAt,
  })
}
