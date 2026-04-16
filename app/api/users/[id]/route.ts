import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, email, password, role } = await req.json()

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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log("ID a eliminar:", id)

    const client = await clientPromise
    const db = client.db("churchesPlanner")

    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Usuario eliminado" })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    )
  }
}