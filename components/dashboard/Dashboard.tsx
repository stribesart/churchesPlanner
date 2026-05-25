// components/dashboard/Dashboard.tsx
import AdminDashboard from "./AdminDashboard"
import LeaderDashboard from "./LeaderDashboard"
import MemberDashboard from "./MemberDashboard"
import type { DashboardData, DashboardRole } from "./types"

type Props = {
  role: DashboardRole
  data: DashboardData
}

function normalizeDashboardRole(role: DashboardRole) {
  const normalizedRole = role
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (
    normalizedRole === "admin" ||
    normalizedRole === "administrador" ||
    normalizedRole === "pastor"
  ) {
    return "admin"
  }

  if (normalizedRole === "lider") {
    return "lider"
  }

  return "miembro"
}

export default function Dashboard({ role, data }: Props) {
  const dashboardRole = normalizeDashboardRole(role)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="mx-auto max-w-7xl px-6 py-10 text-slate-900 sm:py-12 lg:py-16">
        {dashboardRole === "admin" && <AdminDashboard data={data} />}
        {dashboardRole === "lider" && <LeaderDashboard data={data} />}
        {dashboardRole === "miembro" && <MemberDashboard data={data} />}
      </div>
    </div>
  )
}
