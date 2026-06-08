"use client"

import { useEffect, useState } from "react"
import {
  LogOut,
  MoreVertical,
  Palette,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

type SidebarUserProps = {
  user: {
    name: string
    email: string
    role?: string
    avatar?: string
  } | null
}

const THEME_STORAGE_KEY = "churches-planner-theme"

const colorThemes = [
  {
    value: "default",
    label: "Neutral",
    color: "oklch(0.205 0 0)",
  },
  {
    value: "cobalt",
    label: "Cobalto",
    color: "oklch(0.546 0.245 262.881)",
  },
  {
    value: "indigo",
    label: "Índigo",
    color: "oklch(0.511 0.262 276.966)",
  },
  {
    value: "violet",
    label: "Violeta",
    color: "oklch(0.541 0.281 293.009)",
  },
  {
    value: "coral",
    label: "Coral",
    color: "oklch(0.645 0.246 16.439)",
  },
  {
    value: "copper",
    label: "Cobre",
    color: "oklch(0.58 0.15 45)",
  },
  {
    value: "emerald",
    label: "Esmeralda",
    color: "oklch(0.47 0.14 166)",
  },
] as const

function normalizeTheme(value: string | null) {
  if (value === "blue") return "cobalt"
  if (value === "green") return "emerald"
  if (value === "rose") return "coral"
  if (value === "amber") return "copper"

  return colorThemes.some((item) => item.value === value)
    ? (value as (typeof colorThemes)[number]["value"])
    : "default"
}

function getInitials(name?: string | null) {
  if (!name) {
    return "U"
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

export function SidebarUser({ user }: SidebarUserProps) {
  const { isMobile } = useSidebar()
  const initials = getInitials(user?.name)
  const [theme, setTheme] = useState<(typeof colorThemes)[number]["value"]>(
    () => {
      if (typeof window === "undefined") return "default"

      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

      return normalizeTheme(savedTheme)
    }
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const handleLogout = () => {
    window.location.href = "/"
  }

  const handleThemeChange = (nextTheme: string) => {
    const normalizedTheme = normalizeTheme(nextTheme)

    setTheme(normalizedTheme)
    document.documentElement.dataset.theme = normalizedTheme
    window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar} alt={user?.name || "Usuario"} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user?.name || "Usuario"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email || user?.role || "Sin correo"}
                </span>
              </div>
              <MoreVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user?.avatar}
                    alt={user?.name || "Usuario"}
                  />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.name || "Usuario"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email || user?.role || "Sin correo"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-1.5 px-1.5">
                <Palette className="h-3.5 w-3.5" />
                Colores
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={handleThemeChange}
              >
                {colorThemes.map((item) => (
                  <DropdownMenuRadioItem key={item.value} value={item.value}>
                    <span
                      className="size-3 rounded-full ring-1 ring-foreground/15"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
