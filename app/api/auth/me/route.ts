import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import { readSignedSession, sessionUserToResponse } from "@/lib/session"

export async function GET(req: Request) {
  try {
    const signedSession = readSignedSession(req)

    if (signedSession) {
      return NextResponse.json({
        user: sessionUserToResponse(signedSession),
        church: {
          churchName: signedSession.churchName,
        },
      })
    }

    const cookie = req.headers.get("cookie")

    if (!cookie) {
      return NextResponse.json({ user: null })
    }

    const session = cookie
      .split("; ")
      .find(c => c.startsWith("session="))
      ?.split("=")[1]

    if (!session) {
      return NextResponse.json({ user: null })
    }

    const tenantDbName = await getTenantFromRequest(req)

    if (!tenantDbName) {
      return NextResponse.json({ user: null })
    }

    const tenantDb = await getTenantDbByName(tenantDbName)

    const user = await tenantDb.collection("users").findOne(
      { _id: new ObjectId(session) },
      { projection: { password: 0 } }
    )

    return NextResponse.json({ user, church: null })

  } catch {
    return NextResponse.json({ user: null })
  }
}
