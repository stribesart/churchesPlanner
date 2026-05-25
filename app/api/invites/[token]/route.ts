import { createHash } from "crypto"
import { NextResponse } from "next/server"

import clientPromise from "@/lib/mongodb"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
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
    invite.usedCount >= invite.maxUses ||
    invite.expiresAt < new Date()
  ) {
    return NextResponse.json(
      { message: "El enlace de invitación expiró o ya fue usado" },
      { status: 410 }
    )
  }

  return NextResponse.json({
    churchName: invite.churchName,
    defaultRole: invite.defaultRole,
    expiresAt: invite.expiresAt,
  })
}
