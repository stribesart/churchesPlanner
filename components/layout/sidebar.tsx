"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  LayoutDashboard,
  Users,
  Calendar,
  Church,
  Megaphone,
  DollarSign,
  Settings,
  LogOut,
} from "lucide-react"

type User = {
  name: string
  role: string
  email: string
}

type Props = {
  user: User | null
}

const menu = [
  {
    label: "Principal",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Gestión",
    items: [
      {
        name: "Miembros",
        href: "/users",
        icon: Users,
      },
      {
        name: "Usuarios",
        href: "/users",
        icon: Users,
        roles: ["ADMIN"], // solo pastor
      },
    ],
  },
  {
    label: "Operación",
    items: [
      {
        name: "Ministerios",
        href: "/dashboard/ministries",
        icon: Church,
      },
      {
        name: "Eventos",
        href: "/dashboard/events",
        icon: Calendar,
      },
      {
        name: "Anuncios",
        href: "/dashboard/announcements",
        icon: Megaphone,
      },
    ],
  },
  {
    label: "Finanzas",
    items: [
      {
        name: "Ofrendas",
        href: "/dashboard/offers",
        icon: DollarSign,
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        name: "Configuración",
        href: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
]

export default function Sidebar({ user }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r flex flex-col justify-between h-screen">
      
      {/* Top */}
      <div className="p-4 space-y-6">
        
        {/* Logo */}
        <div className="text-xl font-bold">
          ERP Iglesia
        </div>

        {/* Menu */}
        <nav className="space-y-6">
          {menu.map((section) => (
            <div key={section.label}>
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
                {section.label}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  
                  // Control por rol
                  if (item.roles && !item.roles.includes(user?.role || "")) {
                    return null
                  }

                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition
                        ${
                          isActive
                            ? "bg-black text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }
                      `}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom User */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0) || "U"}
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          className="mt-4 flex items-center gap-2 text-sm text-red-500 hover:underline"
          onClick={() => {
            window.location.href = "/login"
          }}
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>

    </aside>
  )
}