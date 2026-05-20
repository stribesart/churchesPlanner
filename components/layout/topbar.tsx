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

      <h1 className="font-semibold">
        Panel administrativo
      </h1>

      <div>
        {user?.name || "Usuario"}
      </div>

    </header>
  )
}
