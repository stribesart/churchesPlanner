import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export type DashboardRole = "admin" | "pastor" | "lider" | "miembro" | string

export type DashboardEvent = {
  id: number
  title: string
  date: string
}

export type DashboardActivity = {
  id: number
  description: string
}

export type DashboardAnnouncement = {
  _id: string
  title: string
  content: string
  author: string
  authorName?: string
  createdAt?: string
}

export type DashboardData = {
  totalMembers: number
  newMembers: number
  totalLeaders: number
  groupMembers: number
  attendance: number
  events: DashboardEvent[]
  activities: DashboardActivity[]
  announcements: DashboardAnnouncement[]
  groupName: string
}

export type StatsCardProps = {
  title: string
  value: ReactNode
  icon?: LucideIcon
}
