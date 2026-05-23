"use client"

import { useState } from "react"
import { canShowMenuItem, menu } from "./sidebar"
import { LayoutDashboard, Users, Calendar, Megaphone, X, Menu as MenuIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type User = {
  name: string
  role: string
  email: string
}

type Props = {
  user: User | null
}

export default function MobileBottomNav({ user }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Simplified primary actions for bottom nav
  const primary = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["pastor", "lider", "miembro colaborador", "miembro"] },
    { name: "Miembros", href: "/users", icon: Users, roles: ["pastor", "lider"] },
    { name: "Eventos", href: "/events", icon: Calendar, roles: ["pastor", "lider"] },
    { name: "Anuncios", href: "/announcements", icon: Megaphone, roles: ["pastor", "lider"] },
  ].filter((item) => canShowMenuItem(item, user?.role))

  return (
    <>
      {/* Bottom nav - only on mobile */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-2 rounded-full bg-white/90 p-2 shadow-lg md:hidden">
        {primary.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs ${isActive ? "bg-blue-700 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          )
        })}

        <button
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
          className="ml-2 rounded-full bg-blue-700 p-2 text-white"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
      </nav>

      {/* Slide-over with full menu */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="absolute left-0 top-0 h-full w-[85%] max-w-xs overflow-auto bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">ERP Iglesia</div>
              <button aria-label="Cerrar" onClick={() => setOpen(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="mt-6 space-y-4">
              {menu.map((section) => {
                const visibleItems = section.items.filter((item) =>
                  canShowMenuItem(item, user?.role)
                )

                if (visibleItems.length === 0) {
                  return null
                }

                return (
                <div key={section.label}>
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">{section.label}</p>
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )})}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
