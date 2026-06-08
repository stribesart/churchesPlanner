import { SidebarTrigger } from "@/components/ui/sidebar"

type User = {
  name: string
  role: string
  email: string
}

type Props = {
  user: User | null
}

export default function Topbar({ user }: Props) {
  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b bg-card px-4 text-card-foreground sm:px-6">

      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        <h1 className="truncate text-sm font-semibold sm:text-base">
          Panel administrativo
        </h1>
      </div>

      <div className="min-w-0 max-w-[45vw] truncate text-right text-sm font-medium text-muted-foreground sm:max-w-none sm:text-base">
        {user?.name || "Usuario"}
      </div>

    </header>
  )
}
