import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getTenantFromRequest, getTenantDbByName } from "@/lib/tenant"
import clientPromise from "@/lib/mongodb"

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
    const client = await clientPromise
    const globalDb = client.db("churchesPlanner")
    const church = await globalDb.collection("churches").findOne(
      { dbName: tenantDbName },
      {
        projection: {
          churchName: 1,
          location: 1,
          generalServiceDay: 1,
          generalServiceStartTime: 1,
          serviceFrequency: 1,
        },
      }
    )

    return NextResponse.json({ user, church })

  } catch {
    return NextResponse.json({ user: null })
  }
}
