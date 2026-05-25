"use client"

import type * as React from "react"
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
} from "lucide-react"
import { SidebarUser } from "@/components/layout/sidebar-user"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

type User = {
  name: string
  role: string
  email: string
}

type Props = React.ComponentProps<typeof ShadcnSidebar> & {
  user: User | null
}

export const menu = [
  {
    label: "Principal",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["pastor", "lider", "miembro colaborador", "miembro"],
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
        roles: ["pastor", "lider"],
      },
    ],
  }, 
  {
    label: "Operación",
    items: [
      {
        name: "Ministerios",
        href: "/ministeries",
        icon: Church,
        roles: ["pastor"],
      },
      {
        name: "Eventos",
        href: "/events",
        icon: Calendar,
        roles: ["pastor", "lider"],
      },
      {
        name: "Anuncios",
        href: "/announcements",
        icon: Megaphone,
        roles: ["pastor", "lider"],
      },
    ],
  },
  {
    label: "Finanzas",
    items: [
      {
        name: "Ofrendas",
        href: "/offerings",
        icon: DollarSign,
        roles: ["pastor"],
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        name: "Configuración",
        href: "/settings",
        icon: Settings,
        roles: ["pastor"],
      },
    ],
  },
]

export function canShowMenuItem(
  item: { roles?: string[] },
  userRole?: string
) {
  if (!item.roles) {
    return true
  }

  const normalizedUserRole = normalizeRole(userRole)

  return item.roles.some((role) => normalizeRole(role) === normalizedUserRole)
}

function normalizeRole(role?: string) {
  const normalizedRole = (role || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (normalizedRole === "administrador") {
    return "pastor"
  }

  return normalizedRole
}

export default function Sidebar({ user, ...props }: Props) {
  const pathname = usePathname()

  return (
    <ShadcnSidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]"
            >
              <span className="text-base font-semibold">Church Planner</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {menu.map((section) => {
          const visibleItems = section.items.filter((item) =>
            canShowMenuItem(item, user?.role)
          )

          if (visibleItems.length === 0) {
            return null
          }

          return (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  )
}
