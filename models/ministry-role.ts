import type { ObjectId } from "mongodb"

export type MinistryRole = {
  _id?: ObjectId
  ministryId: string
  name: string
  normalizedName: string
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}
