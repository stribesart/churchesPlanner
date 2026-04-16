"use client"

import Link from "next/link"
import { Home, Users, Calendar, Package, Megaphone, HandCoins } from "lucide-react"

export default function Sidebar({ user }: any) {
  const role = user?.role;
  const menu = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["pastor", "admin", "lider", "miembro"],
    },
    {
      label: "Usuarios",
      href: "/users",
      icon: Users,
      roles: ["pastor", "admin"], // 🔥 restringido
    },
    {
      label: "Ministerios",
      href: "/ministries",
      icon: Users,
      roles: ["pastor", "admin", "lider"],
    },
    {
      label: "Eventos",
      href: "/events",
      icon: Calendar,
      roles: ["pastor", "admin", "lider"],
    },
    {
      label: "Inventario",
      href: "/inventory",
      icon: Package,
      roles: ["pastor", "admin"],
    },
    {
      label: "Anuncios",
      href: "/announcements",
      icon: Megaphone,
      roles: ["pastor", "admin", "lider"],
    },
    {
      label: "Ofrendas",
      href: "/offerings",
      icon: HandCoins,
      roles: ["pastor"],
    },
  ]
  return (
    <aside className="w-64 bg-white border-r h-screen p-4">
      <h2 className="text-xl font-bold mb-6">
        Churches Planner
      </h2>
      <nav className="flex flex-col gap-2">
        {menu
          .filter((item) => item.roles.includes(role))
          .map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
      </nav>
    </aside>
  )
}