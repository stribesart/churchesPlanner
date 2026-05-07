import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description, leader } = await req.json()

    const client = await clientPromise
    const db = client.db("churchesPlanner")

    const updateData: { name?: string; description?: string; leader?: string } = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (leader !== undefined) updateData.leader = leader

    const result = await db.collection("ministeries").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Ministerio no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Ministerio actualizado" })

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

    const client = await clientPromise
    const db = client.db("churchesPlanner")

    const result = await db.collection("ministeries").deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Ministerio no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Ministerio eliminado" })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    )
  }
}