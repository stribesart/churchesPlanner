import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"

export async function GET(req: Request) {
  try {
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

    const user = await tenantDb.collection("users").findOne({
      _id: new ObjectId(session),
    })

    return NextResponse.json({ user })

  } catch {
    return NextResponse.json({ user: null })
  }
}