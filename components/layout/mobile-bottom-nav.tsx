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
      <nav className="fixed right-4 bottom-4 left-4 z-50 flex items-center justify-between gap-2 rounded-full border bg-card/95 p-2 text-card-foreground shadow-lg backdrop-blur md:hidden">
        {primary.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate text-[10px]">{item.name}</span>
            </Link>
          )
        })}

        <button
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
          className="ml-2 rounded-full bg-primary p-2 text-primary-foreground"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </nav>

      {/* Slide-over with full menu */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="absolute top-0 left-0 h-full w-[85%] max-w-xs overflow-auto bg-card p-4 text-card-foreground">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">ERP Iglesia</div>
              <button aria-label="Cerrar" onClick={() => setOpen(false)} className="p-2">
                <X className="h-5 w-5" />
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
                  <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">{section.label}</p>
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.name}</span>
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
