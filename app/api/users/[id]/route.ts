import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { name, email, password, role } = await req.json()

    console.log("ID recibido:", id)

    const client = await clientPromise
    const db = client.db("churchesPlanner")

    const updateData: any = {
      name,
      email,
      role,
    }

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    console.log("Resultado:", result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Usuario actualizado" })

  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    )
  }
}