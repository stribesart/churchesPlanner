"use client"

import Link from "next/link"
import { Home, Users, Calendar, Package, Megaphone, HandCoins } from "lucide-react"

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r h-screen p-4">

      <h2 className="text-xl font-bold mb-6">
        Churches Planner
      </h2>

      <nav className="flex flex-col gap-2">

        <Link href="/dashboard" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
          <Home size={18} />
          Dashboard
        </Link>

        <Link href="/users" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
          <Users size={18} />
          Usuarios
        </Link>

        <Link href="/ministries" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
          <Users size={18} />
          Ministerios
        </Link>

        <Link href="/events" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
          <Calendar size={18} />
          Eventos
        </Link>

        <Link href="/inventory" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
          <Package size={18} />
          Inventario
        </Link>

        <Link href="/announcements" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
          <Megaphone size={18} />
          Anuncios
        </Link>

        <Link href="/offerings" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
          <HandCoins size={18} />
          Ofrendas
        </Link>

      </nav>

    </aside>
  )
}