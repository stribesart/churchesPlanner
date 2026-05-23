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
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">

      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="font-semibold">
          Panel administrativo
        </h1>
      </div>

      <div>
        {user?.name || "Usuario"}
      </div>

    </header>
  )
}
